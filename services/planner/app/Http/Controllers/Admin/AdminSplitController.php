<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Split;
use App\Models\SplitDay;
use App\Models\SplitSlot;
use Illuminate\Http\Request;

class AdminSplitController extends Controller
{
    protected function transformSlot(SplitSlot $slot): array
    {
        return [
            'id'            => $slot->id,
            'split_day_id'  => $slot->split_day_id,
            'tag'           => $slot->tag,
            'count'         => $slot->count,
            'min_compound'  => $slot->min_compound,
            'created_at'    => $slot->created_at,
            'updated_at'    => $slot->updated_at,
        ];
    }

    protected function transformDay(SplitDay $day, bool $withSlots = false): array
    {
        return [
            'id'         => $day->id,
            'split_id'   => $day->split_id,
            'day_index'  => $day->day_index,
            'name'       => $day->name,
            'created_at' => $day->created_at,
            'updated_at' => $day->updated_at,
            'slots'      => $withSlots
                ? $day->slots->map(fn (SplitSlot $s) => $this->transformSlot($s))->all()
                : null,
        ];
    }

    protected function transformSplit(Split $split, bool $withRelations = false): array
    {
        return [
            'id'         => $split->id,
            'user_id'    => $split->user_id,
            'name'       => $split->name,
            'created_at' => $split->created_at,
            'updated_at' => $split->updated_at,
            'days'       => $withRelations
                ? $split->days
                    ->sortBy('day_index')
                    ->values()
                    ->map(fn (SplitDay $d) => $this->transformDay($d, true))
                    ->all()
                : null,
        ];
    }

    public function index(Request $request)
    {
        $query = Split::query()->orderBy('id', 'asc');

        if ($userId = $request->query('user_id')) {
            $query->where('user_id', $userId);
        }

        $splits = $query->get();

        return response()->json([
            'data' => $splits->map(fn (Split $s) => $this->transformSplit($s, false)),
        ]);
    }

    public function show(int $id)
    {
        $split = Split::with(['days.slots'])
            ->findOrFail($id);

        return response()->json(
            $this->transformSplit($split, true)
        );
    }

    public function update(Request $request, int $id)
    {
        $split = Split::findOrFail($id);

        $data = $request->validate([
            'name' => 'nullable|string|max:255',
        ]);

        $split->fill($data);
        $split->save();

        return response()->json(
            $this->transformSplit($split, false)
        );
    }

    public function destroy(int $id)
    {
        $split = Split::with('days.slots')->findOrFail($id);

        // jei neturi ON DELETE CASCADE, šitas užtikrina tvarką
        foreach ($split->days as $day) {
            $day->slots()->delete();
        }
        $split->days()->delete();
        $split->delete();

        return response()->json([
            'message' => 'Split deleted',
        ]);
    }
}