<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::get('/exercises', function (Request $r) {
    $per  = max(1, min((int) $r->query('per_page', 24), 60));
    $page = max(1, (int) $r->query('page', 1));

    $q = trim((string) $r->query('q', ''));

    // Accept both singular/plural and old body_parts names (CSV)
    $equipCsv = (string) ($r->query('equipment', '') ?? '');
    $musCsv   = (string) (
        $r->query('muscles', '') ??
        $r->query('muscle', '') ??
        $r->query('body_parts', '') ??
        $r->query('body_part', '')
    );

    // Normalize to arrays
    $equipments = array_values(array_filter(array_map('trim', explode(',', $equipCsv))));
    $muscles    = array_values(array_filter(array_map('trim', explode(',', $musCsv))));

    $sql = DB::table('exercises')
        ->select('id','name','primary_muscle','equipment','image_url')
        ->orderBy('name');

    if ($q !== '') {
        $sql->where('name', 'ilike', '%'.$q.'%');
    }

    // EQUIPMENT: (eq1 OR eq2 OR …)
    if ($equipments) {
        $sql->where(function ($w) use ($equipments) {
            $w->whereIn('equipment', $equipments);
            foreach ($equipments as $e) {
                $w->orWhereJsonContains('equipments_j', $e);
            }
        });
    }

    // MUSCLES (replaces body parts): (m1 OR m2 OR …)
    if ($muscles) {
        $sql->where(function ($w) use ($muscles) {
            $w->whereIn('primary_muscle', $muscles);
            foreach ($muscles as $m) {
                $w->orWhereJsonContains('target_muscles', $m)
                  ->orWhereJsonContains('secondary_muscles', $m);
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