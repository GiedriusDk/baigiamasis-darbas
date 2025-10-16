<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlanDayController extends Controller
{
    protected function getOwnedPlanOrFail(Request $r, int $planId)
    {
        $u = (array)($r->attributes->get('auth_user') ?? []);
        $plan = DB::table('plans')->where('id', $planId)->first();
        if (!$plan) abort(404, 'Plan not found');
        if ((int)$plan->coach_id !== (int)($u['id'] ?? 0)) abort(403, 'Forbidden');
        return $plan;
    }

    
public function store(Request $r, Plan $plan)
{
    $u = (array) ($r->attributes->get('auth_user') ?? []);
    if ((int)$plan->coach_id !== (int)($u['id'] ?? 0)) {
        return response()->json(['message' => 'Forbidden'], 403);
    }

    $data = $r->validate([
        'week_number' => 'required|integer|min:1',
        'day_number'  => 'nullable|integer|min:1',
        'title'       => 'nullable|string|max:255',
        'notes'       => 'nullable|string',
    ]);

    $week = \App\Models\PlanWeek::where('plan_id', $plan->id)
        ->where('week_number', $data['week_number'])
        ->firstOrFail();

    if (empty($data['day_number'])) {
        $max = \App\Models\PlanDay::where('plan_week_id', $week->id)->max('day_number');
        $data['day_number'] = (int)$max + 1;
    }

    $exists = \App\Models\PlanDay::where('plan_week_id', $week->id)
        ->where('day_number', $data['day_number'])
        ->exists();

    if ($exists) {
        return response()->json(['message' => 'Day already exists'], 422);
    }

    $day = \App\Models\PlanDay::create([
        'plan_id'      => $plan->id,
        'plan_week_id' => $week->id,
        'day_number'   => $data['day_number'],
        'title'        => $data['title'] ?? 'Day '.$data['day_number'],
        'notes'        => $data['notes'] ?? null,
    ]);

    return response()->json(['data' => $day]);
}

    public function destroy(Request $r, int $day)
    {
        $d = DB::table('plan_days')->where('id', $day)->first();
        if (!$d) abort(404, 'Day not found');
        $plan = DB::table('plans')->where('id', $d->plan_id)->first();
        $u = (array)($r->attributes->get('auth_user') ?? []);
        if ((int)$plan->coach_id !== (int)($u['id'] ?? 0)) abort(403, 'Forbidden');

        DB::transaction(function () use ($d) {
            DB::table('plan_day_exercises')->where('plan_day_id', $d->id)->delete();
            DB::table('plan_days')->where('id', $d->id)->delete();
        });

        return response()->noContent();
    }
}