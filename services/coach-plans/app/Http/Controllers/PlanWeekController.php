<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\PlanWeek;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlanWeekController extends Controller
{
    protected function ensureOwner(Request $r, Plan $plan)
    {
        $u = (array)($r->attributes->get('auth_user') ?? []);
        abort_if((int)($u['id'] ?? 0) !== (int)$plan->coach_id, 403, 'Forbidden');
    }

    public function index(Request $r, Plan $plan)
    {
        $this->ensureOwner($r, $plan);

        $weeks = PlanWeek::where('plan_id', $plan->id)
            ->orderBy('week_number')
            ->get(['id','plan_id','week_number','title']);

        return response()->json(['data' => $weeks]);
    }

    public function store(Request $r, Plan $plan)
    {
        $this->ensureOwner($r, $plan);

        $data = $r->validate([
            'title'       => 'nullable|string|max:255',
            'week_number' => 'nullable|integer|min:1',
        ]);

        $next = $data['week_number'] ?? ((int)PlanWeek::where('plan_id', $plan->id)->max('week_number') + 1);

        $week = PlanWeek::create([
            'plan_id'     => $plan->id,
            'week_number' => $next,
            'title'       => $data['title'] ?? 'Week '.$next,
        ]);

        return response()->json(['data' => $week], 201);
    }

    public function reorder(Request $r, Plan $plan)
    {
        $this->ensureOwner($r, $plan);

        $data = $r->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer|min:1',
        ]);

        DB::transaction(function () use ($plan, $data) {
            foreach (array_values($data['ids']) as $i => $id) {
                PlanWeek::where('id', $id)->where('plan_id', $plan->id)->update(['week_number' => $i + 1]);
            }
        });

        return response()->json(['data' => true]);
    }

    public function destroy(Request $r, Plan $plan, PlanWeek $week)
    {
        $this->ensureOwner($r, $plan);
        abort_if($week->plan_id !== $plan->id, 404);
        $week->delete();
        return response()->json(['data' => true]);
    }
}