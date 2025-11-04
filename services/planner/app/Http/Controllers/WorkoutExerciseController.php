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
        $auth   = $r->attributes->get('auth_user');
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
            ->where('order', $order)
            ->firstOrFail();

        $equipmentFilter = trim((string)$r->query('equipment', ''));
        $limit           = max(5, min((int)$r->query('limit', 24), 60));

        $current = $catalog->getExercise((int)$we->exercise_id);
        if (!$current) {
            return response()->json(['data' => []]);
        }

        $wantMuscle = $this->normalizeMuscle($current['primary_muscle'] ?? '');
        $wantEquip  = $this->normalize($current['equipment'] ?? '');

        $params = [
            'muscles'   => $wantMuscle ? $wantMuscle : null,
            'equipment' => $equipmentFilter === 'gym' ? null : $equipmentFilter,
            'per_page'  => $limit * 3,   // atsinešam daugiau ir profilttruojam lokaliai
            'page'      => 1,
        ];
        $candidates = $catalog->exercises($params);

        $usedIds = WorkoutExercise::where('workout_id', $workout->id)
            ->pluck('exercise_id')
            ->map(fn($v) => (int)$v)
            ->all();

        $badPrimary = ['cardiovascular system'];
        $nameDeny   = ['stretch', 'mobility', 'pose', 'yoga', 'pilates', 'crawl', 'walk', 'run', 'jump', 'skip'];

        $filtered = array_values(array_filter($candidates, function ($e) use (
            $we, $usedIds, $wantMuscle, $badPrimary, $nameDeny
        ) {
            $id = (int)($e['id'] ?? 0);
            if (!$id || $id === (int)$we->exercise_id || in_array($id, $usedIds, true)) {
                return false;
            }

            $pm = $this->normalizeMuscle($e['primary_muscle'] ?? '');
            if (in_array($pm, $badPrimary, true)) return false;

            $targets   = $this->normArray($e['target_muscles'] ?? []);
            $secondary = $this->normArray($e['secondary_muscles'] ?? []);
            $name      = $this->normalize($e['name'] ?? '');

            foreach ($nameDeny as $deny) {
                if (str_contains($name, $deny)) return false;
            }

            if ($wantMuscle === '') return true;

            if ($pm === $wantMuscle) return true;
            if (in_array($wantMuscle, $targets, true)) return true;
            if (in_array($wantMuscle, $secondary, true)) return true;

            return false;
        }));

        $wantEquip = $wantEquip ?: $this->normalize($equipmentFilter);
        usort($filtered, function ($a, $b) use ($wantMuscle, $wantEquip) {
            $scoreA = $this->score($a, $wantMuscle, $wantEquip);
            $scoreB = $this->score($b, $wantMuscle, $wantEquip);
            return $scoreB <=> $scoreA;
        });

        $filtered = array_slice($filtered, 0, $limit);

        return response()->json([
            'data'    => $filtered,
            'current' => $current,
        ]);
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
            ->where('order', $order)
            ->firstOrFail();

        $exists = WorkoutExercise::where('workout_id', $workout->id)
            ->where('exercise_id', $newId)
            ->exists();
        if ($exists) {
            return response()->json(['message' => 'Already in this workout'], 422);
        }

        $we->exercise_id = $newId;
        $we->save();

        return response()->json([
            'message' => 'Swapped',
            'workout_exercise' => $we,
        ]);
    }

    public function search(Request $r, CatalogService $catalog)
    {
        $data = $catalog->exercises([
            'q'         => (string)$r->query('q', ''),
            'equipment' => (string)$r->query('equipment', ''),
            'muscles'   => (string)$r->query('muscles', ''),
            'per_page'  => max(10, min((int)$r->query('per_page', 10), 60)),
            'page'      => max(1, (int)$r->query('page', 1)),
        ]);

        return response()->json(['data' => $data]);
    }

    private function normalize(string $v): string
    {
        return strtolower(trim($v));
    }

    private function normalizeMuscle(string $m): string
    {
        $m = $this->normalize($m);
        $aliases = [
            'calf' => 'calves',
            'soleus' => 'calves',
            'gastrocnemius' => 'calves',
            'abs' => 'abs',
            'core' => 'abdominals',
            'pecs' => 'pectorals',
            'lats' => 'lats',
            'tricep' => 'triceps',
            'bicep' => 'biceps',
        ];
        return $aliases[$m] ?? $m;
    }

    private function normArray($v): array
    {
        $arr = is_array($v) ? $v : (is_string($v) ? json_decode($v, true) ?: [] : []);
        return array_values(array_filter(array_map(fn($x) => $this->normalizeMuscle(is_string($x) ? $x : ($x['name'] ?? '')), $arr)));
    }

    private function score(array $e, string $wantMuscle, string $wantEquip): int
    {
        $score = 0;

        $pm = $this->normalizeMuscle($e['primary_muscle'] ?? '');
        $tg = $this->normArray($e['target_muscles'] ?? []);
        $sc = $this->normArray($e['secondary_muscles'] ?? []);
        $eq = $this->normalize($e['equipment'] ?? '');

        if ($pm === $wantMuscle) $score += 5;
        if (in_array($wantMuscle, $tg, true)) $score += 3;
        if (in_array($wantMuscle, $sc, true)) $score += 2;
        if ($wantEquip && $eq === $wantEquip) $score += 2;

        return $score;
    }
}