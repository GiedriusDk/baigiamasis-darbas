<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\Workout;
use App\Models\WorkoutExercise;
use App\Services\CatalogService;
use Illuminate\Http\Request;

class WorkoutExerciseController extends Controller
{
    protected function assertOwnsWorkout(Request $r, Workout $workout): void
    {
        $auth  = $r->attributes->get('auth_user');
        $userId = (int)($auth['id'] ?? 0);

        $plan = Plan::where('id', $workout->plan_id)->firstOrFail();
        if ($plan->user_id !== $userId) {
            abort(403, 'Forbidden');
        }
    }

    public function alternatives(Request $r, Workout $workout, int $order, CatalogService $catalog)
    {
        $this->assertOwnsWorkout($r, $workout);

        $we = WorkoutExercise::where('workout_id', $workout->id)
            ->where('order', $order)->firstOrFail();

        $equipment = trim((string)$r->query('equipment', ''));
        $limit     = max(5, min((int)$r->query('limit', 24), 60));

        $current = $catalog->getExercise((int)$we->exercise_id);
        if (!$current) {
            return response()->json(['data' => []]);
        }

        $muscles = [];
        if (!empty($current['primary_muscle'])) {
            $muscles[] = $current['primary_muscle'];
        }

        $params = [
            'muscles'   => implode(',', array_unique(array_filter($muscles))),
            'equipment' => $equipment === 'gym' ? null : $equipment,
            'per_page'  => $limit,
            'page'      => 1,
        ];
        $alts = $catalog->exercises($params);

        $usedIds = WorkoutExercise::where('workout_id', $workout->id)->pluck('exercise_id')->all();
        $usedIds = array_map('intval', $usedIds);

        $alts = array_values(array_filter($alts, function ($e) use ($we, $usedIds) {
            $id = (int)($e['id'] ?? 0);
            return $id && $id !== (int)$we->exercise_id && !in_array($id, $usedIds, true);
        }));

        return response()->json(['data' => $alts, 'current' => $current]);
    }

    public function swap(Request $r, Workout $workout, int $order, CatalogService $catalog)
    {
        $this->assertOwnsWorkout($r, $workout);

        $data = $r->validate([
            'exercise_id' => 'required|integer|min:1',
        ]);
        $newId = (int)$data['exercise_id'];

        $row = $catalog->getExercise($newId);
        if (!$row) {
            return response()->json(['message' => 'Exercise not found in catalog'], 422);
        }

        $we = WorkoutExercise::where('workout_id', $workout->id)
            ->where('order', $order)->firstOrFail();

        $exists = WorkoutExercise::where('workout_id', $workout->id)
            ->where('exercise_id', $newId)->exists();
        if ($exists) {
            return response()->json(['message' => 'Already in this workout'], 422);
        }

        $we->exercise_id = $newId;
        $we->save();

        return response()->json(['message' => 'Swapped', 'workout_exercise' => $we]);
    }

    public function search(Request $r, CatalogService $catalog)
    {
        $data = $catalog->exercises([
            'q'         => (string)$r->query('q', ''),
            'equipment' => (string)$r->query('equipment', ''),
            'muscles'   => (string)$r->query('muscles', ''),
            'per_page'  => max(10, min((int)$r->query('per_page', 30), 60)),
            'page'      => max(1, (int)$r->query('page', 1)),
        ]);
        return response()->json(['data' => $data]);
    }
}