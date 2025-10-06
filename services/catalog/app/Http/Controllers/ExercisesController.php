<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExercisesController extends Controller
{
    public function index(Request $r)
    {
        $q = DB::table('exercises');

        if ($equip = trim((string) $r->query('equipment', ''))) {
            $q->where('equipment', $equip);
        }

        if ($muscles = trim((string) $r->query('muscles', ''))) {
            $list = collect(explode(',', $muscles))->map(fn($m)=>trim($m))->filter();
            if ($list->isNotEmpty()) {
                $q->where(function($qq) use ($list) {
                    foreach ($list as $m) {
                        $qq->orWhereJsonContains('target_muscles', $m);
                    }
                });
            }
        }

        $single = strtolower(trim((string) $r->query('tag', '')));
        $many   = collect((array) $r->query('tags', []))
                    ->map(fn($t)=>strtolower(trim((string)$t)))
                    ->filter()->values()->all();

        $slugs = array_values(array_unique(array_filter(array_merge(
            $single ? [$single] : [], $many
        ))));

        if ($slugs) {
            $q->whereExists(function($sub) use ($slugs) {
                $sub->from('exercise_tags as et')
                    ->join('tags as t', 't.id', '=', 'et.tag_id')
                    ->whereColumn('et.exercise_id', 'exercises.id')
                    ->whereIn('t.slug', $slugs);
            });
        }

        if ((bool) $r->query('shuffle', 1)) {
            $q->inRandomOrder();
        }

        $per = max(1, min(100, (int) $r->query('per_page', 30)));
        $data = $q->limit($per)->get();

        return response()->json(['data' => $data]);
    }

    public function show(int $id)
    {
        $row = DB::table('exercises')->where('id', $id)->first();
        if (!$row) return response()->json(['message' => 'Not found'], 404);
        return response()->json(['data' => $row]);
    }
}