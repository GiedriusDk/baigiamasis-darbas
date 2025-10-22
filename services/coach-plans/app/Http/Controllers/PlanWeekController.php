<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Plan;
use App\Models\PlanWeek;

class PlanWeekController extends Controller
{
    public function store(Request $r, Plan $plan)
    {
        $u = (array) ($r->attributes->get('auth_user') ?? []);
        if ((int)$plan->coach_id !== (int)($u['id'] ?? 0)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $r->validate([
            'week_number' => 'nullable|integer|min:1',
            'title' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        if (empty($data['week_number'])) {
            $max = PlanWeek::where('plan_id', $plan->id)->max('week_number');
            $data['week_number'] = (int)$max + 1;
        }

        $exists = PlanWeek::where('plan_id', $plan->id)
            ->where('week_number', $data['week_number'])
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Week already exists'], 422);
        }

        $week = PlanWeek::create([
            'plan_id' => $plan->id,
            'week_number' => $data['week_number'],
            'title' => $data['title'] ?? 'Week '.$data['week_number'],
            'notes'       => $data['notes'] ?? null,
        ]);

        return response()->json(['data' => $week], 201);
    }

    public function update(Request $r, int $id)
    {
        $w = \App\Models\PlanWeek::findOrFail($id);
        $u = (array) ($r->attributes->get('auth_user') ?? []);
        if ((int)$w->plan->coach_id !== (int)($u['id'] ?? 0)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $r->validate([
            'title' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $w->fill($data)->save();
        return response()->json(['data' => $w]);
    }

    public function destroy(Request $r, PlanWeek $week)
    {
        $u = (array) ($r->attributes->get('auth_user') ?? []);
        if ((int)$week->plan->coach_id !== (int)($u['id'] ?? 0)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $week->delete();
        return response()->json(['ok' => true]);
    }
}