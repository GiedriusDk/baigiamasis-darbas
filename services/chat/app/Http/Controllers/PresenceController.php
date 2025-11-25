<?php

// app/Http/Controllers/PresenceController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ChatStatus;

class PresenceController extends Controller
{
    public function status(Request $r)
    {
        $timeout = (int) config('chat.presence_timeout', 60);
        ChatStatus::where('is_online', true)
            ->where('last_seen_at', '<', now()->subSeconds($timeout))
            ->update(['is_online' => false]);

        $ids = collect(explode(',', (string) $r->query('ids', '')))
            ->filter()->map('intval')->unique()->all();

        $rows = ChatStatus::query()
            ->when($ids, fn($q) => $q->whereIn('user_id', $ids))
            ->get(['user_id', 'is_online', 'last_seen_at'])
            ->map(fn($s) => [
                'user_id'     => $s->user_id,
                'is_online'   => (bool) $s->is_online,
                'last_seen_at' => $s->last_seen_at?->toIso8601String(),
            ]);

        return response()->json(['data' => $rows]);
    }

    public function touch(Request $r)
    {
        $uid = (int) $r->user()->id;
        ChatStatus::updateOrCreate(
            ['user_id' => $uid],
            ['is_online' => true, 'last_seen_at' => now()]
        );

        return response()->json(['ok' => true]);
    }

    public function leave(Request $r)
    {
        $uid = (int) $r->user()->id;
        ChatStatus::where('user_id', $uid)->update(['is_online' => false]);
        return response()->json(['ok' => true]);
    }

    
}