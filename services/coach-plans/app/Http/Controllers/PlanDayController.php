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

    
    public function store(Request $r, int $planId)
    {
        $data = $r->validate([
            'week_number' => 'required|integer|min:1',
            'day_number'  => 'nullable|integer|min:1',
            'title'       => 'nullable|string|max:255',
            'notes'       => 'nullable|string',
        ]);

        $plan = \App\Models\Plan::findOrFail($planId);

        $week = \DB::table('plan_weeks')
            ->where('plan_id', $plan->id)
            ->where('week_number', $data['week_number'])
            ->first();

        if (!$week) {
            $weekId = \DB::table('plan_weeks')->insertGetId([
                'plan_id'     => $plan->id,
                'week_number' => $data['week_number'],
                'title'       => $data['title'] ?? 'Week '.$data['week_number'],
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        } else {
            $weekId = $week->id;
        }

        if (empty($data['day_number'])) {
            $max = (int) \DB::table('plan_days')
                ->where('plan_week_id', $weekId)
                ->max('day_number');
            $data['day_number'] = $max + 1;  // <— serveris pats paskiria sekantį
        }

        $id = \DB::table('plan_days')->insertGetId([
            'plan_id'      => $plan->id,
            'plan_week_id' => $weekId,
            'week_number'  => $data['week_number'],
            'day_number'   => $data['day_number'],
            'title'        => $data['title'] ?? ('Day '.$data['day_number']),
            'notes'        => $data['notes'] ?? null,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        $day = \DB::table('plan_days')->where('id', $id)->first();

        return response()->json(['data' => $day]);
    }

    public function update(Request $r, int $id)
    {
        $day = \DB::table('plan_days')->where('id', $id)->first();
        if (!$day) abort(404, 'Day not found');

        $plan = \DB::table('plans')->where('id', $day->plan_id)->first();
        $u = (array)($r->attributes->get('auth_user') ?? []);
        if ((int)$plan->coach_id !== (int)($u['id'] ?? 0)) abort(403, 'Forbidden');

        $data = $r->validate([
            'title' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        \DB::table('plan_days')->where('id', $id)->update([
            'title'      => array_key_exists('title', $data) ? $data['title'] : $day->title,
            'notes'      => array_key_exists('notes', $data) ? $data['notes'] : $day->notes,
            
            'updated_at' => now(),
        ]);

        $updated = \DB::table('plan_days')->where('id', $id)->first();
        return response()->json($updated);
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