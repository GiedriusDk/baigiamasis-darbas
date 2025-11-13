<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Goal;
use App\Models\GoalCheckin;
use App\Models\Entry;
use Illuminate\Http\Request;

class GoalCheckinsController extends Controller
{
    protected function me(Request $r): int
    {
        $u = (array)($r->attributes->get('auth_user') ?? []);
        return (int)($u['id'] ?? 0);
    }

    public function index(Request $r, Goal $goal)
    {
        $me = $this->me($r);
        if ($goal->user_id !== $me) return response()->json(['message'=>'Forbidden'], 403);
        return response()->json(['data' => $goal->checkins()->orderByDesc('id')->get()]);
    }

    public function store(Request $r, Goal $goal)
    {
        $me = $this->me($r);
        if ($goal->user_id !== $me) return response()->json(['message'=>'Forbidden'], 403);

        $data = $r->validate([
            'entry_id' => ['nullable','integer','min:1'],
            'achieved' => ['required','boolean'],
            'note'     => ['nullable','string','max:500'],
        ]);

        $entryId = $data['entry_id'] ?? null;
        if ($entryId) {
            $entry = Entry::findOrFail($entryId);
            if ($entry->user_id !== $me) return response()->json(['message'=>'Forbidden'], 403);
        }

        $c = GoalCheckin::create([
            'goal_id'  => $goal->id,
            'user_id'  => $me,
            'entry_id' => $entryId,
            'achieved' => (bool)$data['achieved'],
            'note'     => $data['note'] ?? null,
        ]);

        return response()->json(['data' => $c], 201);
    }

    public function destroy(Request $r, Goal $goal, GoalCheckin $checkin)
    {
        $me = $this->me($r);
        if ($goal->user_id !== $me || $checkin->goal_id !== $goal->id) return response()->json(['message'=>'Forbidden'], 403);
        $checkin->delete();
        return response()->json(['ok' => true]);
    }
}