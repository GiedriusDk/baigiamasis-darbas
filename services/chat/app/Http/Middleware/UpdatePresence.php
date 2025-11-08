<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Cache;
use App\Models\ChatStatus;

class UpdatePresence
{
    public function handle($request, Closure $next)
    {
        if ($u = $request->attributes->get('auth_user')) {
            ChatStatus::updateOrCreate(
                ['user_id' => $u['id']],
                ['last_seen_at' => now(), 'is_online' => true]
            );
        }

        $this->sweepWhenNeeded();
        return $next($request);
    }

    protected function sweepWhenNeeded(): void
    {
        $ttl = (int) config('chat.presence_timeout', 60);
        if (! Cache::add('presence_sweep_lock', 1, $ttl)) {
            return;
        }

        $cut = now()->subSeconds($ttl);

        ChatStatus::where('is_online', true)
            ->where(function ($q) use ($cut) {
                $q->whereNull('last_seen_at')
                  ->orWhere('last_seen_at', '<', $cut);
            })
            ->update(['is_online' => false]);
    }
}