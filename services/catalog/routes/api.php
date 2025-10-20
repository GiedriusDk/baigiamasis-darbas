<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::get('/exercises', function (Request $r) {
    $per  = max(1, min((int) $r->query('per_page', 24), 60));
    $page = max(1, (int) $r->query('page', 1));
    $q    = trim((string) $r->query('q', ''));

    $equipCsv = (string) ($r->query('equipment', '') ?? '');
    $musCsv   = (string) (
        $r->query('muscles', '') ??
        $r->query('muscle', '') ??
        $r->query('body_parts', '') ??
        $r->query('body_part', '')
    );
    $tag = trim((string) $r->query('tag', ''));

    $equipments = array_values(array_filter(array_map('trim', explode(',', $equipCsv))));
    $muscles    = array_values(array_filter(array_map('trim', explode(',', $musCsv))));

    $sql = DB::table('exercises as e')
        ->select('e.id','e.name','e.primary_muscle','e.equipment','e.image_url')
        ->orderBy('e.name');

    if ($q !== '') {
        $sql->where('e.name', 'ilike', '%'.$q.'%');
    }

    if ($tag !== '') {
        $sql->whereExists(function ($q2) use ($tag) {
            $q2->from('exercise_tag as et')
               ->join('tags as t', 't.id', '=', 'et.tag_id')
               ->whereColumn('et.exercise_id', 'e.id')
               ->where('t.slug', $tag);
        });
    }

    if ($equipments) {
        $sql->where(function ($w) use ($equipments) {
            $w->whereIn('e.equipment', $equipments);
            foreach ($equipments as $e) {
                $w->orWhereJsonContains('e.equipments_j', $e);
            }
        });
    }

    if ($muscles) {
        $sql->where(function ($w) use ($muscles) {
            $w->whereIn('e.primary_muscle', $muscles);
            foreach ($muscles as $m) {
                $w->orWhereJsonContains('e.target_muscles', $m)
                  ->orWhereJsonContains('e.secondary_muscles', $m);
            }
        });
    }

    $p = $sql->paginate($per, ['*'], 'page', $page);

    return response()->json([
        'data' => $p->items(),
        'meta' => [
            'page'     => $p->currentPage(),
            'perPage'  => $p->perPage(),
            'total'    => $p->total(),
            'lastPage' => $p->lastPage(),
        ],
    ]);
});

Route::get('/filters', function () {
    return [
        'equipments' => DB::table('equipments')->orderBy('name')->pluck('name'),
        'muscles'    => DB::table('muscles')->orderBy('name')->pluck('name'),
    ];
});

Route::get('/exercises/{id}', function (int $id) {
    $row = DB::table('exercises')
        ->select(
            'id',
            'name',
            'primary_muscle',
            'equipment',
            'image_url',
            'instructions',
            'target_muscles',
            'secondary_muscles',
            'equipments_j'
        )
        ->where('id', $id)
        ->first();

    if (!$row) {
        return response()->json(['message' => 'Not found'], 404);
    }

    $row->target_muscles     = $row->target_muscles     ? json_decode($row->target_muscles, true)     : [];
    $row->secondary_muscles  = $row->secondary_muscles  ? json_decode($row->secondary_muscles, true)  : [];
    $row->equipments_j       = $row->equipments_j       ? json_decode($row->equipments_j, true)       : [];
    $row->instructions       = $row->instructions       ? json_decode($row->instructions, true)       : [];

    return ['data' => $row];
});

Route::get('/exercises/by-tag', function (Request $r) {
    $tag = (string) $r->query('tag', '');
    if ($tag === '') {
        return response()->json(['data' => []]);
    }

    $equipCsv = (string) ($r->query('equipment', '') ?? '');
    $equipments = array_values(array_filter(array_map('trim', explode(',', $equipCsv))));

    $q = DB::table('exercise_tag as et')
        ->join('tags as t', 't.id', '=', 'et.tag_id')
        ->join('exercises as e', 'e.id', '=', 'et.exercise_id')
        ->select('e.id','e.name','e.primary_muscle','e.equipment','e.image_url')
        ->where('t.slug', $tag);

    if ($equipments) {
        $q->where(function ($w) use ($equipments) {
            $w->whereIn('e.equipment', $equipments);
            foreach ($equipments as $e) {
                $w->orWhereJsonContains('e.equipments_j', $e);
            }
        });
    }

    return response()->json(['data' => $q->orderBy('e.name')->limit(200)->get()]);
});

Route::get('/exercises/shared', function (Request $r) {
    $per  = max(1, min((int) $r->query('per_page', 24), 60));
    $page = max(1, (int) $r->query('page', 1));
    $q    = trim((string) $r->query('q', ''));

    $equipCsv = (string) ($r->query('equipment', '') ?? '');
    $musCsv   = (string) (
        $r->query('muscles', '') ??
        $r->query('muscle', '') ??
        $r->query('body_parts', '') ??
        $r->query('body_part', '')
    );
    $tag = trim((string) $r->query('tag', ''));

    $equipments = array_values(array_filter(array_map('trim', explode(',', $equipCsv))));
    $muscles    = array_values(array_filter(array_map('trim', explode(',', $musCsv))));

    $sql = DB::table('exercises as e')
        ->select('e.id','e.name','e.primary_muscle','e.equipment','e.image_url')
        ->orderBy('e.name');

    if ($q !== '') {
        $sql->where('e.name', 'ilike', '%'.$q.'%');
    }

    if ($tag !== '') {
        $sql->whereExists(function ($q2) use ($tag) {
            $q2->from('exercise_tag as et')
               ->join('tags as t', 't.id', '=', 'et.tag_id')
               ->whereColumn('et.exercise_id', 'e.id')
               ->where('t.slug', $tag);
        });
    }

    if ($equipments) {
        $sql->where(function ($w) use ($equipments) {
            $w->whereIn('e.equipment', $equipments);
            foreach ($equipments as $e) {
                $w->orWhereJsonContains('e.equipments_j', $e);
            }
        });
    }

    if ($muscles) {
        $sql->where(function ($w) use ($muscles) {
            $w->whereIn('e.primary_muscle', $muscles);
            foreach ($muscles as $m) {
                $w->orWhereJsonContains('e.target_muscles', $m)
                  ->orWhereJsonContains('e.secondary_muscles', $m);
            }
        });
    }

    $p = $sql->paginate($per, ['*'], 'page', $page);

    return response()->json([
        'data' => $p->items(),
        'meta' => [
            'page'     => $p->currentPage(),
            'perPage'  => $p->perPage(),
            'total'    => $p->total(),
            'lastPage' => $p->lastPage(),
        ],
    ]);
});

Route::get('/exercises/shared/{id}', function (int $id) {
    $row = DB::table('exercises')
        ->select(
            'id',
            'name',
            'primary_muscle',
            'equipment',
            'image_url',
            'instructions',
            'target_muscles',
            'secondary_muscles',
            'equipments_j'
        )
        ->where('id', $id)
        ->first();

    if (!$row) {
        return response()->json(['message' => 'Not found'], 404);
    }

    $row->target_muscles     = $row->target_muscles     ? json_decode($row->target_muscles, true)     : [];
    $row->secondary_muscles  = $row->secondary_muscles  ? json_decode($row->secondary_muscles, true)  : [];
    $row->equipments_j       = $row->equipments_j       ? json_decode($row->equipments_j, true)       : [];
    $row->instructions       = $row->instructions       ? json_decode($row->instructions, true)       : [];

    return ['data' => $row];
});