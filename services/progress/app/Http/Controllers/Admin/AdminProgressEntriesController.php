<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Entry;
use Illuminate\Http\Request;

class AdminProgressEntriesController extends Controller
{
    public function index(Request $r)
    {
        $q = Entry::query();

        if ($r->user_id) {
            $q->where('user_id', $r->user_id);
        }
        if ($r->metric_id) {
            $q->where('metric_id', $r->metric_id);
        }
        if ($r->date_from) {
            $q->whereDate('date', '>=', $r->date_from);
        }
        if ($r->date_to) {
            $q->whereDate('date', '<=', $r->date_to);
        }

        $items = $q->orderByDesc('id')->paginate(50);

        return response()->json([
            'data' => $items,
        ]);
    }

    public function show($id)
    {
        $entry = Entry::findOrFail($id);

        return response()->json([
            'data' => $entry,
        ]);
    }

    public function update(Request $r, $id)
    {
        $entry = Entry::findOrFail($id);

        $entry->update([
            'value'       => $r->value       ?? $entry->value,
            'value_json'  => $r->value_json  ?? $entry->value_json,
            'note'        => $r->note        ?? $entry->note,
            'date'        => $r->date        ?? $entry->date,
        ]);

        return response()->json([
            'message' => 'Updated',
            'data'    => $entry,
        ]);
    }

    public function destroy($id)
    {
        $entry = Entry::findOrFail($id);
        $entry->delete();

        return response()->json(['message' => 'Deleted']);
    }
}