<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\PlanWeek;
use App\Models\PlanDay;
use App\Models\PlanDayExercise;
use Illuminate\Http\Request;

class AdminPlansController extends Controller
{
    protected function transformExercise(PlanDayExercise $e): array
    {
        return [
            'id'           => $e->id,
            'plan_id'      => $e->plan_id,
            'plan_day_id'  => $e->plan_day_id,
            'exercise_id'  => $e->exercise_id,
            'custom_title' => $e->custom_title,
            'custom_notes' => $e->custom_notes,
            'order'        => $e->order,
            'sets'         => $e->sets,
            'reps'         => $e->reps,
            'rest_seconds' => $e->rest_seconds,
            'created_at'   => $e->created_at,
            'updated_at'   => $e->updated_at,
        ];
    }

    protected function transformDay(PlanDay $d, bool $withExercises = false): array
    {
        return [
            'id'          => $d->id,
            'plan_id'     => $d->plan_id,
            'plan_week_id'=> $d->plan_week_id,
            'week_number' => $d->week_number,
            'day_number'  => $d->day_number,
            'title'       => $d->title,
            'notes'       => $d->notes,
            'created_at'  => $d->created_at,
            'updated_at'  => $d->updated_at,
            'exercises'   => $withExercises
                ? $d->exercises->map(
                    fn (PlanDayExercise $e) => $this->transformExercise($e)
                  )->values()->all()
                : null,
        ];
    }

    protected function transformWeek(PlanWeek $w, bool $withTree = false): array
    {
        return [
            'id'          => $w->id,
            'plan_id'     => $w->plan_id,
            'week_number' => $w->week_number,
            'title'       => $w->title,
            'notes'       => $w->notes,
            'created_at'  => $w->created_at,
            'updated_at'  => $w->updated_at,
            'days'        => $withTree
                ? $w->days->map(
                    fn (PlanDay $d) => $this->transformDay($d, true)
                  )->values()->all()
                : null,
        ];
    }

    protected function transformPlan(Plan $p, bool $withTree = false): array
    {
        return [
            'id'         => $p->id,
            'product_id' => $p->product_id,
            'coach_id'   => $p->coach_id,
            'created_at' => $p->created_at,
            'updated_at' => $p->updated_at,
            'weeks'      => $withTree
                ? $p->weeks->map(
                    fn (PlanWeek $w) => $this->transformWeek($w, true)
                  )->values()->all()
                : null,
        ];
    }

    public function index(Request $request)
    {
        $q = Plan::query()->orderBy('id', 'asc');

        if ($coachId = $request->query('coach_id')) {
            $q->where('coach_id', (int) $coachId);
        }

        if ($productId = $request->query('product_id')) {
            $q->where('product_id', (int) $productId);
        }

        $plans = $q->get();

        return response()->json([
            'data' => $plans->map(
                fn (Plan $p) => $this->transformPlan($p, false)
            ),
        ]);
    }

    public function show(int $id)
    {
        $plan = Plan::with([
            'weeks.days.exercises',
        ])->findOrFail($id);

        return response()->json(
            $this->transformPlan($plan, true)
        );
    }
}