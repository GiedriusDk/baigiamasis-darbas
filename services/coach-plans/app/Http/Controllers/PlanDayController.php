<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\PlanWeek;
use App\Models\PlanDay;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlanDayController extends Controller
{
    protected function ensureOwner(Request $r, Plan $plan)
    {
        $u = (array)($r->attributes->get('auth_user') ?? []);
        abort_if((int)($u['id'] ?? 0) !== (int)$plan->coach_id, 403, 'Forbidden');
    }

    public function index(Request $r, PlanWeek $week)
    {
        $plan = Plan::findOrFail($week->plan_id);
        $this->ensureOwner($r, $plan);

        $days = PlanDay::where('plan_week_id', $week->id)
            ->orderBy('day_number')
            ->get(['id','plan_week_id','day_number','title']);

        return response()->json(['data' => $days]);
    }

    public function store(Request $r, PlanWeek $week)
    {
        $plan = Plan::findOrFail($week->plan_id);
        $this->ensureOwner($r, $plan);

        $data = $r->validate([
            'title'      => 'nullable|string|max:255',
            'day_number' => 'nullable|integer|min:1',
        ]);

        $next = $data['day_number'] ?? ((int)PlanDay::where('plan_week_id', $week->id)->max('day_number') + 1);

        $day = PlanDay::create([
            'plan_week_id' => $week->id,
            'day_number'   => $next,
            'title'        => $data['title'] ?? 'Day '.$next,
        ]);

        return response()->json(['data' => $day], 201);
    }

    public function reorder(Request $r, PlanWeek $week)
    {
        $plan = Plan::findOrFail($week->plan_id);
        $this->ensureOwner($r, $plan);

        $data = $r->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer|min:1',
        ]);

        DB::transaction(function () use ($week, $data) {
            foreach (array_values($data['ids']) as $i => $id) {
                PlanDay::where('id', $id)->where('plan_week_id', $week->id)->update(['day_number' => $i + 1]);
            }
        });

        return response()->json(['data' => true]);
    }

    public function destroy(Request $r, PlanWeek $week, PlanDay $day)
    {
        $plan = Plan::findOrFail($week->plan_id);
        $this->ensureOwner($r, $plan);
        abort_if($day->plan_week_id !== $week->id, 404);
        $day->delete();
        return response()->json(['data' => true]);
    }
}