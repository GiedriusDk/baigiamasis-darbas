<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Workout;
use App\Models\WorkoutExercise;
use Illuminate\Http\Request;

class AdminWorkoutController extends Controller
{
    // GET /admin/workouts
    public function index()
    {
        $items = Workout::with('exercises')->orderBy('id', 'desc')->get();
        return response()->json(['data' => $items]);
    }

    // GET /admin/workouts/{id}
    public function show($id)
    {
        $item = Workout::with('exercises')->findOrFail($id);
        return response()->json(['data' => $item]);
    }

    // PUT /admin/workouts/{id}
    public function update(Request $r, $id)
    {
        $w = Workout::findOrFail($id);

        $w->update($r->only(['name', 'notes']));

        return response()->json(['data' => $w]);
    }

    // DELETE /admin/workouts/{id}
    public function destroy($id)
    {
        Workout::findOrFail($id)->delete();
        return response()->json(['message' => 'deleted']);
    }

    // --- EXERCISES ---
    // PUT /admin/workouts/{id}/exercises
    public function syncExercises(Request $r, $id)
    {
        $w = Workout::findOrFail($id);

        $items = $r->input('items', []); 
        // items: [{id?, exercise_id, order, sets, rep_min, rep_max, rest_sec}]

        // Delete old ones:
        WorkoutExercise::where('workout_id', $id)->delete();

        foreach ($items as $it) {
            WorkoutExercise::create([
                'workout_id' => $id,
                'exercise_id' => $it['exercise_id'],
                'order'       => $it['order'] ?? 1,
                'sets'        => $it['sets'] ?? 3,
                'rep_min'     => $it['rep_min'] ?? 5,
                'rep_max'     => $it['rep_max'] ?? 10,
                'rest_sec'    => $it['rest_sec'] ?? 60,
                'prescription'=> $it['prescription'] ?? null,
            ]);
        }

        return response()->json(['message' => 'updated']);
    }
}