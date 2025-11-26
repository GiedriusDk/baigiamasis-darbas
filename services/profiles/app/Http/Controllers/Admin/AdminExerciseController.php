<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CoachExercise;
use Illuminate\Http\Request;

class AdminExerciseController extends Controller
{
    protected function transformExercise(CoachExercise $e): array
    {
        return [
            'id'             => $e->id,
            'user_id'        => $e->user_id ?? $e->coach_id ?? null,
            'title'          => $e->title ?? null,
            'description'    => $e->description ?? null,
            'equipment'      => $e->equipment ?? null,
            'primary_muscle' => $e->primary_muscle ?? null,
            'difficulty'     => $e->difficulty ?? null,
            'tags'           => $e->tags ?? null,
            'media_path'     => $e->media_path ?? $e->media_url ?? null,
            'is_shared'      => $e->is_shared ?? null,
            'created_at'     => $e->created_at,
            'updated_at'     => $e->updated_at,
        ];
    }

    public function index(Request $request)
    {
        $query = CoachExercise::query()->orderBy('id', 'asc');

        $exercises = $query->get();

        return response()->json([
            'data' => $exercises->map(fn (CoachExercise $e) => $this->transformExercise($e)),
        ]);
    }

    public function show(int $id)
    {
        $exercise = CoachExercise::findOrFail($id);

        return response()->json(
            $this->transformExercise($exercise)
        );
    }

    public function update(Request $request, int $id)
    {
        $exercise = CoachExercise::findOrFail($id);

        $data = $request->validate([
            'title'          => 'nullable|string|max:255',
            'description'    => 'nullable|string',
            'equipment'      => 'nullable',
            'primary_muscle' => 'nullable|string|max:255',
            'difficulty'     => 'nullable|string|max:50',
            'tags'           => 'nullable',
            'media_path'     => 'nullable|string|max:255',
            'is_shared'      => 'nullable|boolean',
        ]);

        unset($data['id'], $data['user_id'], $data['created_at'], $data['updated_at']);

        $exercise->fill($data);
        $exercise->save();

        return response()->json(
            $this->transformExercise($exercise)
        );
    }

    public function destroy(int $id)
    {
        $exercise = CoachExercise::findOrFail($id);
        $exercise->delete();

        return response()->json([
            'message' => 'Coach exercise deleted',
        ]);
    }
}