<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\Workout;
use App\Models\WorkoutExercise;
use App\Services\PlanGenerators\PplGenerator;
use App\Services\PlanGenerators\SplitGenerator;
use App\Services\CatalogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlanController extends Controller
{
    public function show(Plan $plan, CatalogService $catalog)
    {
        $plan->load('workouts.exercises');

        $ids = collect($plan->workouts)
            ->flatMap(fn ($w) => $w->exercises)
            ->pluck('exercise_id')->filter()->unique()->values()->all();

        if ($ids) {
            $details = collect($catalog->getExercisesByIds($ids))->keyBy('id');
            foreach ($plan->workouts as $w) {
                foreach ($w->exercises as $ex) {
                    if ($row = $details->get($ex->exercise_id)) {
                        $ex->exercise_name = $row['name'] ?? null;
                        $ex->image_url     = $row['image_url'] ?? null;
                        $ex->catalog_exercise = $row;
                    }
                }
            }
        }

        return response()->json($plan);
    }

    public function store(Request $r, SplitGenerator $splitGen)
    {
        $authUser = $r->attributes->get('auth_user');
        $userId   = $authUser['id'] ?? null;
        if (!$userId) return response()->json(['message' => 'Unauthenticated.'], 401);

        $data = $r->validate([
            'goal'              => 'required|string|in:fat_loss,muscle_gain,performance,general_fitness',
            'sessions_per_week' => 'required|integer|in:3,4,5',
            'equipment'         => 'nullable|string',
            'start_date'        => 'nullable|date',
            'weeks'             => 'nullable|integer|min:4|max:24',
        ]);

        $weeks = $data['weeks'] ?? 8;

        DB::beginTransaction();
        try {
            $plan = Plan::create([
                'user_id'           => $userId,
                'goal'              => $data['goal'],
                'sessions_per_week' => (int)$data['sessions_per_week'],
                'start_date'        => $data['start_date'] ?? now()->toDateString(),
                'weeks'             => $weeks,
            ]);

            $template = $splitGen->generate(
                $data['goal'],
                (int)$data['sessions_per_week'],
                $data['equipment'] ?? null
            );

            if (!$template) {
                DB::rollBack();
                return response()->json(['message' => 'No split found for this goal/sessions'], 422);
            }

            foreach ($template as $dayIndex => $w) {
                $workout = Workout::create([
                    'plan_id'   => $plan->id,
                    'day_index' => $dayIndex,
                    'name'      => $w['name'],
                    'notes'     => $w['notes'] ?? null,
                ]);

                $sort = 1;
                foreach ($w['exercises'] as $ex) {
                    WorkoutExercise::create([
                        'workout_id'  => $workout->id,
                        'exercise_id' => $ex['id'],
                        'order'       => $sort++,
                        'sets'        => $ex['sets'],
                        'rep_min'     => $ex['rep_min'],
                        'rep_max'     => $ex['rep_max'],
                        'rest_sec'    => $ex['rest_sec'],
                    ]);
                }
            }

            DB::commit();
            $plan->load('workouts.exercises');
            return response()->json($plan, 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            if (config('app.debug')) {
                return response()->json([
                    'message' => 'Plan generation failed',
                    'error'   => $e->getMessage(),
                ], 500);
            }
            return response()->json(['message' => 'Plan generation failed'], 500);
        }
    }

    public function latest(Request $r, CatalogService $catalog)
    {
        $authUser = $r->attributes->get('auth_user');
        $userId   = $authUser['id'] ?? null;
        if (!$userId) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $plan = Plan::where('user_id', $userId)->orderByDesc('created_at')->first();
        if (!$plan) {
            return response()->json(['message' => 'No plan'], 404);
        }

        $plan->load('workouts.exercises');

        $ids = collect($plan->workouts)
            ->flatMap(fn ($w) => $w->exercises)
            ->pluck('exercise_id')->filter()->unique()->values()->all();

        if ($ids) {
            $details = collect($catalog->getExercisesByIds($ids))->keyBy('id');
            foreach ($plan->workouts as $w) {
                foreach ($w->exercises as $ex) {
                    if ($row = $details->get($ex->exercise_id)) {
                        $ex->exercise_name = $row['name'] ?? null;
                        $ex->image_url     = $row['image_url'] ?? null;
                        $ex->catalog_exercise = $row;
                    }
                }
            }
        }

        return response()->json($plan);
    }
}