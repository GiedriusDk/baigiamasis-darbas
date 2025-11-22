<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Workout;
use Illuminate\Http\Request;

class WorkoutController extends Controller
{

    public function index(Request $r, Plan $plan)
    {
        $me = $this->me($r);
        $this->ensurePlanOwner($plan, $me);

        $workouts = $plan->workouts()
            ->orderBy('day_index')
            ->get()
            ->map(function ($w) {
                return [
                    'id'        => $w->id,
                    'plan_id'   => $w->plan_id,
                    'day_index' => $w->day_index,
                    'name'      => $w->name,
                    'notes'     => $w->notes,
                    'created_at'=> $w->created_at?->toIso8601String(),
                    'updated_at'=> $w->updated_at?->toIso8601String(),
                ];
            });

        return response()->json(['data' => $workouts]);
    }

    protected function me(Request $r): int
    {
        $u = (array)($r->attributes->get('auth_user') ?? []);
        return (int)($u['id'] ?? 0);
    }

    protected function ensurePlanOwner(Plan $plan, int $userId)
    {
        if ($plan->user_id !== $userId) {
            abort(response()->json(['message' => 'Forbidden'], 403));
        }
    }

    protected function ensureWorkoutOwner(Workout $workout, int $userId)
    {
        $plan = $workout->plan ?? $workout->plan()->first();
        if (!$plan || $plan->user_id !== $userId) {
            abort(response()->json(['message' => 'Forbidden'], 403));
        }
    }

    public function store(Request $r, Plan $plan)
    {
        $me = $this->me($r);
        $this->ensurePlanOwner($plan, $me);

        $data = $r->validate([
            'name'      => ['required', 'string', 'max:120'],
            'notes'     => ['nullable', 'string', 'max:2000'],
            'day_index' => ['nullable', 'integer', 'min:0', 'max:6'],
        ]);

        $dayIndex = $data['day_index'] ?? null;
        if ($dayIndex === null) {
            $max = $plan->workouts()->max('day_index');
            $dayIndex = is_null($max) ? 0 : $max + 1;
        }

        $workout = Workout::create([
            'plan_id'   => $plan->id,
            'day_index' => $dayIndex,
            'name'      => $data['name'],
            'notes'     => $data['notes'] ?? null,
        ]);

        return response()->json(['data' => $workout], 201);
    }

    public function update(Request $r, Workout $workout)
    {
        $me = $this->me($r);
        $this->ensureWorkoutOwner($workout, $me);

        $data = $r->validate([
            'name'      => ['sometimes', 'string', 'max:120'],
            'notes'     => ['sometimes', 'nullable', 'string', 'max:2000'],
            'day_index' => ['sometimes', 'integer', 'min:0', 'max:6'],
        ]);

        $workout->fill($data);
        $workout->save();

        return response()->json(['data' => $workout]);
    }

    public function destroy(Request $r, Workout $workout)
    {
        $me = $this->me($r);
        $this->ensureWorkoutOwner($workout, $me);

        $workout->delete();

        return response()->json(['ok' => true]);
    }
}