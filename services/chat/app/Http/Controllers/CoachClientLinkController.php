<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use Illuminate\Http\Request;

class CoachClientLinkController extends Controller
{
    protected function me(Request $r): int
    {
        $u = (array) ($r->attributes->get('auth_user') ?? []);
        return (int) ($u['id'] ?? 0);
    }

    public function list(Request $r)
    {
        $coachId = $this->me($r);

        $userIds = Conversation::query()
            ->where('coach_id', $coachId)
            ->pluck('user_id')
            ->unique()
            ->values()
            ->toArray();

        return response()->json([
            'user_ids' => $userIds
        ]);
    }

    public function check(Request $r, int $userId)
    {
        $coachId = $this->me($r);

        $exists = Conversation::query()
            ->where('coach_id', $coachId)
            ->where('user_id', $userId)
            ->exists();

        return response()->json(
            ['ok' => $exists],
            $exists ? 200 : 404
        );
    }
}