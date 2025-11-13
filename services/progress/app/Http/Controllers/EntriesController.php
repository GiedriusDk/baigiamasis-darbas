<?php

namespace App\Http\Controllers;

use App\Models\Entry;
use App\Models\Metric;
use Illuminate\Http\Request;

class EntriesController extends Controller
{
    protected function me(Request $r): int
    {
        $u = (array) ($r->attributes->get('auth_user') ?? []);
        return (int) ($u['id'] ?? 0);
    }

    public function index(Request $r)
    {
        $me = $this->me($r);
        if (!$me) return response()->json(['message' => 'Unauthenticated.'], 401);

        $q = Entry::query()->where('user_id', $me);

        if ($r->filled('metric_id')) $q->where('metric_id', (int) $r->query('metric_id'));
        if ($r->filled('from'))      $q->where('recorded_at', '>=', $r->query('from'));
        if ($r->filled('to'))        $q->where('recorded_at', '<=', $r->query('to'));

        $q->orderByDesc('recorded_at')->orderByDesc('id');

        if ($r->boolean('paginate', true)) {
            $per = min(max((int) $r->query('per_page', 50), 1), 200);
            return response()->json($q->paginate($per));
        }

        return response()->json(['data' => $q->get()]);
    }

    public function store(Request $r)
    {
        $me = $this->me($r);
        if (!$me) return response()->json(['message' => 'Unauthenticated.'], 401);

        $data = $r->validate([
            'metric_id'   => ['required','integer','min:1'],
            'value'       => ['nullable','numeric'],
            'value_json'  => ['nullable','array'],
            'note'        => ['nullable','string','max:1000'],
            'date'        => ['nullable','date'],
            'recorded_at' => ['nullable','date'],
            'source'      => ['nullable','string','max:32'],
        ]);

        $metric = Metric::findOrFail($data['metric_id']);
        if ((int) $metric->user_id !== $me) return response()->json(['message' => 'Forbidden'], 403);

        if (!array_key_exists('value', $data) && !array_key_exists('value_json', $data)) {
            return response()->json(['message' => 'Either value or value_json is required.'], 422);
        }

        $e = Entry::create([
            'user_id'     => $me,
            'metric_id'   => (int) $metric->id,
            'value'       => $data['value'] ?? null,
            'value_json'  => $data['value_json'] ?? null,
            'note'        => $data['note'] ?? null,
            'date'        => $data['date'] ?? null,
            'recorded_at' => $data['recorded_at'] ?? now(),
            'source'      => $data['source'] ?? 'manual',
        ]);

        return response()->json(['data' => $e], 201);
    }

    public function show(Request $r, Entry $entry)
    {
        $me = $this->me($r);
        if ((int) $entry->user_id !== $me) return response()->json(['message' => 'Forbidden'], 403);
        return response()->json(['data' => $entry->load('photos')]);
    }

    public function update(Request $r, Entry $entry)
    {
        $me = $this->me($r);
        if ((int) $entry->user_id !== $me) return response()->json(['message' => 'Forbidden'], 403);

        $data = $r->validate([
            'value'       => ['sometimes','nullable','numeric'],
            'value_json'  => ['sometimes','nullable','array'],
            'note'        => ['sometimes','nullable','string','max:1000'],
            'date'        => ['sometimes','nullable','date'],
            'recorded_at' => ['sometimes','nullable','date'],
            'source'      => ['sometimes','nullable','string','max:32'],
        ]);

        $entry->fill($data)->save();

        return response()->json(['data' => $entry]);
    }

    public function destroy(Request $r, Entry $entry)
    {
        $me = $this->me($r);
        if ((int) $entry->user_id !== $me) return response()->json(['message' => 'Forbidden'], 403);

        $entry->delete();
        return response()->json(['ok' => true]);
    }
}