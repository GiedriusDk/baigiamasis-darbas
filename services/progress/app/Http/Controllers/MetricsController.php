<?php

namespace App\Http\Controllers;

use App\Models\Metric;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;

class MetricsController extends Controller
{
    protected function me(Request $r): int
    {
        $u = (array)($r->attributes->get('auth_user') ?? []);
        return (int)($u['id'] ?? 0);
    }

    public function index(Request $r)
    {
        $me = $this->me($r);
        if (!$me) return response()->json(['message' => 'Unauthenticated.'], 401);

        // jei user’is dar neturi jokių metrų – automatiškai sukuriam „Weight“
        $hasAny = Metric::where('user_id', $me)->exists();
        if (!$hasAny) {
            Metric::create([
                'user_id'   => $me,
                'slug'      => 'weight',
                'name'      => 'Weight',
                'unit'      => 'kg',
                'kind'      => 'numeric',
                'is_public' => true,
            ]);
        }

        $q = Metric::query()->where('user_id', $me);

        if ($r->boolean('include_latest')) {
            $q->with(['latestEntry' => function ($q2) {
                $q2->orderByDesc('recorded_at')->orderByDesc('id')->limit(1);
            }]);
        }

        $metrics = $q->orderBy('id')->get()->map(function (Metric $m) {
            $latest = $m->latestEntry;
            return [
                'id'        => $m->id,
                'user_id'   => $m->user_id,
                'slug'      => $m->slug,
                'name'      => $m->name,
                'unit'      => $m->unit,
                'kind'      => $m->kind,
                'is_public' => $m->is_public,
                'created_at'=> $m->created_at,
                'updated_at'=> $m->updated_at,
                'latest'    => $latest ? [
                    'id'    => $latest->id,
                    'value' => $latest->value,
                    'date'  => $latest->recorded_at ? $latest->recorded_at->format('Y-m-d') : null,
                ] : null,
            ];
        });

        return response()->json(['data' => $metrics]);
    }

    // tavo store() palieki tokį, kaip susitvarkėm anksčiau:
    public function store(Request $r)
    {
        $me = $this->me($r);
        if (!$me) return response()->json(['message' => 'Unauthenticated.'], 401);

        $data = $r->validate([
            'name'      => ['required','string','max:120'],
            'unit'      => ['nullable','string','max:32'],
            'kind'      => ['required','string','max:32'],
            'is_public' => ['sometimes','boolean'],
        ]);

        $m = Metric::create([
            'user_id'   => $me,
            'slug'      => \Str::slug($data['name']),
            'name'      => $data['name'],
            'unit'      => $data['unit'] ?? null,
            'kind'      => $data['kind'],
            'is_public' => (bool)($data['is_public'] ?? true),
        ]);

        return response()->json(['data' => $m], 201);
    }

    public function show(Request $r, Metric $metric)
    {
        $me = $this->me($r);
        if (!$me) return response()->json(['message' => 'Unauthenticated.'], 401);
        if ($metric->user_id !== $me) return response()->json(['message' => 'Forbidden'], 403);

        $includeLatest = $r->boolean('include_latest');
        if ($includeLatest) $metric->load('latestEntry');

        return response()->json([
            'data' => [
                'id'         => $metric->id,
                'user_id'    => $metric->user_id,
                'slug'       => $metric->slug,
                'name'       => $metric->name,
                'unit'       => $metric->unit,
                'kind'       => $metric->kind,
                'is_public'  => (bool) $metric->is_public,
                'latest'     => $includeLatest && $metric->latestEntry ? [
                    'id'    => $metric->latestEntry->id,
                    'value' => (float) $metric->latestEntry->value,
                    'date'  => $metric->latestEntry->date?->format('Y-m-d'),
                ] : null,
                'created_at' => $metric->created_at,
                'updated_at' => $metric->updated_at,
            ],
        ]);
    }

    public function update(Request $r, Metric $metric)
    {
        $me = $this->me($r);
        if (!$me) return response()->json(['message' => 'Unauthenticated.'], 401);
        if ($metric->user_id !== $me) return response()->json(['message' => 'Forbidden'], 403);

        $data = $r->validate([
            'slug'      => ['sometimes','string','max:64', Rule::unique('progress_metrics','slug')->where('user_id',$me)->ignore($metric->id)],
            'name'      => ['sometimes','string','max:120'],
            'unit'      => ['sometimes','nullable','string','max:32'],
            'kind'      => ['sometimes','string','max:32'],
            'is_public' => ['sometimes','boolean'],
        ]);

        $metric->fill($data)->save();
        return response()->json(['data' => $metric]);
    }

    public function destroy(Request $r, Metric $metric)
    {
        $me = $this->me($r);
        if (!$me) return response()->json(['message' => 'Unauthenticated.'], 401);
        if ($metric->user_id !== $me) return response()->json(['message' => 'Forbidden'], 403);

        $metric->delete();
        return response()->json(['ok' => true]);
    }
}