<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Goal;
use App\Models\Metric;
use Illuminate\Http\Request;

class GoalsController extends Controller
{
    protected function me(Request $r): int
    {
        $u = (array)($r->attributes->get('auth_user') ?? []);
        return (int)($u['id'] ?? 0);
    }

    public function index(Request $r)
    {
        $me = $this->me($r);
        $q = Goal::query()->where('user_id', $me);

        if ($r->filled('metric_id')) $q->where('metric_id', (int)$r->query('metric_id'));
        if ($r->filled('status'))    $q->where('status', $r->query('status'));

        return response()->json(['data' => $q->orderBy('target_date')->get()]);
    }

    public function store(Request $r)
    {
        $me = $this->me($r);
        $data = $r->validate([
            'metric_id'    => ['required','integer','min:1'],
            'title'        => ['required','string','max:160'],
            'target_value' => ['nullable','numeric'],
            'target_date'  => ['nullable','date'],
            'status'       => ['nullable','string','max:16'],
        ]);

        $metric = Metric::findOrFail($data['metric_id']);
        if ($metric->user_id !== $me) return response()->json(['message'=>'Forbidden'], 403);

        $g = Goal::create([
            'user_id'      => $me,
            'metric_id'    => $metric->id,
            'title'        => $data['title'],
            'target_value' => $data['target_value'] ?? null,
            'target_date'  => $data['target_date'] ?? null,
            'status'       => $data['status'] ?? 'active',
        ]);

        return response()->json(['data' => $g], 201);
    }

    public function show(Request $r, Goal $goal)
    {
        $me = $this->me($r);
        if ($goal->user_id !== $me) return response()->json(['message'=>'Forbidden'], 403);
        return response()->json(['data' => $goal->load('checkins')]);
    }

    public function update(Request $r, Goal $goal)
    {
        $me = $this->me($r);
        if ($goal->user_id !== $me) return response()->json(['message'=>'Forbidden'], 403);

        $data = $r->validate([
            'title'        => ['sometimes','string','max:160'],
            'target_value' => ['sometimes','nullable','numeric'],
            'target_date'  => ['sometimes','nullable','date'],
            'status'       => ['sometimes','string','max:16'],
        ]);

        $goal->fill($data)->save();
        return response()->json(['data' => $goal]);
    }

    public function destroy(Request $r, Goal $goal)
    {
        $me = $this->me($r);
        if ($goal->user_id !== $me) return response()->json(['message'=>'Forbidden'], 403);
        $goal->delete();
        return response()->json(['ok' => true]);
    }
}