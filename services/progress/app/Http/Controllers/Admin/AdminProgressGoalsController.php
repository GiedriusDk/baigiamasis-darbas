<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Goal;
use Illuminate\Http\Request;

class AdminProgressGoalsController extends Controller
{
    public function index(Request $r)
    {
        $q = Goal::query();

        if ($r->user_id) {
            $q->where('user_id', $r->user_id);
        }
        if ($r->metric_id) {
            $q->where('metric_id', $r->metric_id);
        }
        if ($r->status) {
            $q->where('status', $r->status);
        }

        $items = $q->orderByDesc('id')->paginate(50);

        return response()->json([
            'data' => $items,
        ]);
    }

    public function show($id)
    {
        $goal = Goal::findOrFail($id);

        return response()->json([
            'data' => $goal,
        ]);
    }

    public function update(Request $r, $id)
    {
        $goal = Goal::findOrFail($id);

        $goal->update([
            'title'        => $r->title ?? $goal->title,
            'target_value' => $r->target_value ?? $goal->target_value,
            'target_date'  => $r->target_date ?? $goal->target_date,
            'status'       => $r->status ?? $goal->status,
        ]);

        return response()->json([
            'message' => 'Updated',
            'data'    => $goal,
        ]);
    }

    public function destroy($id)
    {
        $goal = Goal::findOrFail($id);
        $goal->delete();

        return response()->json(['message' => 'Deleted']);
    }
}