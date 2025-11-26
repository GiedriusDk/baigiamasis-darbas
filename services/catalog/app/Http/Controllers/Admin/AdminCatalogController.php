<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Exercise;
use App\Models\Equipment;
use App\Models\Muscle;

class AdminCatalogController extends Controller
{
    /* ------------ TRANSFORM HELPERS ------------ */

    protected function transformExercise(Exercise $e): array
    {
        return [
            'id'                => $e->id,
            'name'              => $e->name,
            'primary_muscle'    => $e->primary_muscle,
            'equipment'         => $e->equipment,
            'image_url'         => $e->image_url,
            'source'            => $e->source,
            'source_id'         => $e->source_id,
            'tags'              => $e->tags,
            'body_parts'        => $e->body_parts,
            'target_muscles'    => $e->target_muscles,
            'secondary_muscles' => $e->secondary_muscles,
            'equipments_j'      => $e->equipments_j,
            'instructions'      => $e->instructions,
            'keywords'          => $e->keywords,
            'created_at'        => $e->created_at,
            'updated_at'        => $e->updated_at,
        ];
    }

    protected function transformEquipment(Equipment $e): array
    {
        return [
            'id'         => $e->id,
            'name'       => $e->name,
            'created_at' => $e->created_at,
            'updated_at' => $e->updated_at,
        ];
    }

    protected function transformMuscle(Muscle $m): array
    {
        return [
            'id'         => $m->id,
            'name'       => $m->name,
            'created_at' => $m->created_at,
            'updated_at' => $m->updated_at,
        ];
    }

    /* ---------------- EXERCISES ---------------- */

    public function listExercises(Request $request)
    {
        $perPage = (int) $request->query('per_page', 50);
        $perPage = max(1, min(200, $perPage));

        $q = Exercise::query()->orderBy('id', 'desc');

        if ($search = trim((string) $request->query('q', ''))) {
            $q->where(function ($qq) use ($search) {
                $qq->where('name', 'ILIKE', "%{$search}%")
                   ->orWhere('primary_muscle', 'ILIKE', "%{$search}%")
                   ->orWhere('equipment', 'ILIKE', "%{$search}%");
            });
        }

        $paginator = $q->paginate($perPage);

        return response()->json([
            'data' => collect($paginator->items())
                ->map(fn (Exercise $e) => $this->transformExercise($e))
                ->values()
                ->all(),
            'meta' => [
                'total'        => $paginator->total(),
                'per_page'     => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
            ],
        ]);
    }

    public function updateExercise(int $id, Request $request)
    {
        $exercise = Exercise::findOrFail($id);

        $data = $request->validate([
            'name'              => 'sometimes|string|max:255',
            'primary_muscle'    => 'sometimes|nullable|string|max:255',
            'equipment'         => 'sometimes|nullable|string|max:255',
            'image_url'         => 'sometimes|nullable|string|max:2000',
            'source'            => 'sometimes|nullable|string|max:255',
            'source_id'         => 'sometimes|nullable|string|max:255',
            'tags'              => 'sometimes|nullable|array',
            'body_parts'        => 'sometimes|nullable|array',
            'target_muscles'    => 'sometimes|nullable|array',
            'secondary_muscles' => 'sometimes|nullable|array',
            'equipments_j'      => 'sometimes|nullable|array',
            'instructions'      => 'sometimes|nullable|array',
            'keywords'          => 'sometimes|nullable|array',
        ]);

        // JSON laukus priskiriam tiesiai, o likusius – per fill()
        foreach ([
            'tags',
            'body_parts',
            'target_muscles',
            'secondary_muscles',
            'equipments_j',
            'instructions',
            'keywords',
        ] as $jsonField) {
            if (array_key_exists($jsonField, $data)) {
                $exercise->{$jsonField} = $data[$jsonField];
                unset($data[$jsonField]);
            }
        }

        $exercise->fill($data)->save();

        return response()->json($this->transformExercise($exercise));
    }

    public function deleteExercise(int $id)
    {
        $exercise = Exercise::findOrFail($id);
        $exercise->delete();

        return response()->json(['ok' => true]);
    }

    /* ---------------- EQUIPMENTS ---------------- */

    public function listEquipments()
    {
        $items = Equipment::query()->orderBy('id')->get();

        return response()->json([
            'data' => $items->map(
                fn (Equipment $e) => $this->transformEquipment($e)
            )->values()->all(),
        ]);
    }

    public function createEquipment(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $item = Equipment::create($data);

        return response()->json($this->transformEquipment($item), 201);
    }

    public function updateEquipment(int $id, Request $request)
    {
        $item = Equipment::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
        ]);

        $item->fill($data)->save();

        return response()->json($this->transformEquipment($item));
    }

    public function deleteEquipment(int $id)
    {
        $item = Equipment::findOrFail($id);
        $item->delete();

        return response()->json(['ok' => true]);
    }

    /* ---------------- MUSCLES ---------------- */

    public function listMuscles()
    {
        $items = Muscle::query()->orderBy('id')->get();

        return response()->json([
            'data' => $items->map(
                fn (Muscle $m) => $this->transformMuscle($m)
            )->values()->all(),
        ]);
    }

    public function createMuscle(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $item = Muscle::create($data);

        return response()->json($this->transformMuscle($item), 201);
    }

    public function updateMuscle(int $id, Request $request)
    {
        $item = Muscle::findOrFail($id);

        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
        ]);

        $item->fill($data)->save();

        return response()->json($this->transformMuscle($item));
    }

    public function deleteMuscle(int $id)
    {
        $item = Muscle::findOrFail($id);
        $item->delete();

        return response()->json(['ok' => true]);
    }
}