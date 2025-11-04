<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Services\PaymentsService;
use Illuminate\Http\Request;

class ConversationsController extends Controller
{
    protected function me(Request $r): int
    {
        $u = (array)($r->attributes->get('auth_user') ?? []);
        return (int)($u['id'] ?? 0);
    }

    public function index(Request $r)
    {
        $me = $this->me($r);

        $rows = Conversation::query()
            ->where(function ($q) use ($me) {
                $q->where('user_id', $me)->orWhere('coach_id', $me);
            })
            ->orderByDesc('updated_at')
            ->get();

        return response()->json(['data' => $rows]);
    }

    public function store(Request $r, PaymentsService $payments)
    {
        $me = $this->me($r);

        $data = $r->validate([
            'coach_id' => 'required|integer|min:1',
        ]);
        $coachId = (int)$data['coach_id'];

        $hasAccess = $payments->userHasAccessToCoach($me, $coachId, (string)$r->bearerToken());
        if (!$hasAccess) {
            return response()->json(['message' => 'No access to chat with this coach'], 403);
        }

        $conv = Conversation::firstOrCreate(
            ['user_id' => $me, 'coach_id' => $coachId],
            ['updated_at' => now()]
        );

        return response()->json(['data' => $conv], 201);
    }

    public function show(Request $r, Conversation $conversation)
    {
        $me = $this->me($r);
        if ($conversation->user_id !== $me && $conversation->coach_id !== $me) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json(['data' => $conversation]);
    }
}