<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductsController extends Controller
{
    public function index()
    {
        $items = Product::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get();

        return response()->json(['data' => $items]);
    }

    public function show(Product $product)
    {
        if (!$product->is_active) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json(['data' => $product]);
    }

    public function mine(Request $r)
    {
        $u = $r->attributes->get('auth_user');

        $items = Product::query()
            ->where('coach_id', (int) $u['id'])
            ->orderBy('sort_order')
            ->orderByDesc('id')
            ->get();

        return response()->json(['data' => $items]);
    }

    public function store(Request $r)
    {
        $u = (array) ($r->attributes->get('auth_user') ?? []);

        $data = $r->validate([
            'title'             => 'required|string|max:160',
            'description'       => 'nullable|string',
            'price'             => 'required|integer|min:50',
            'currency'          => 'nullable|string|size:3',
            'type'              => 'nullable|string|in:online,in_person,hybrid',
            'gym_name'          => 'nullable|string|max:160',
            'gym_address'       => 'nullable|string|max:255',
            'duration_weeks'    => 'nullable|integer|min:1|max:52',
            'sessions_per_week' => 'nullable|integer|min:1|max:14',
            'access_days'       => 'nullable|integer|min:1|max:365',
            'includes_chat'     => 'nullable|boolean',
            'includes_calls'    => 'nullable|boolean',
            'level'             => 'nullable|string|max:24',
            'thumbnail_url'     => 'nullable|string|max:255',
            'sort_order'        => 'nullable|integer',
            'is_active'         => 'nullable|boolean',
            'metadata'          => 'nullable|array',
        ]);

        $p = Product::create([
            'coach_id'          => (int) $u['id'],
            'title'             => $data['title'],
            'slug'              => Str::slug($data['title']) . '-' . Str::lower(Str::random(6)),
            'description'       => $data['description'] ?? null,
            'price'             => $data['price'],
            'currency'          => strtoupper($data['currency'] ?? 'EUR'),
            'type'              => $data['type'] ?? 'online',
            'gym_name'          => $data['gym_name'] ?? null,
            'gym_address'       => $data['gym_address'] ?? null,
            'duration_weeks'    => $data['duration_weeks'] ?? null,
            'sessions_per_week' => $data['sessions_per_week'] ?? null,
            'access_days'       => $data['access_days'] ?? null,
            'includes_chat'     => $data['includes_chat'] ?? true,
            'includes_calls'    => $data['includes_calls'] ?? false,
            'level'             => $data['level'] ?? null,
            'thumbnail_url'     => $data['thumbnail_url'] ?? null,
            'sort_order'        => $data['sort_order'] ?? 0,
            'is_active'         => $data['is_active'] ?? true,
            'metadata'          => $data['metadata'] ?? null,
        ]);

        return response()->json(['data' => $p], 201);
    }

    public function update(Request $r, Product $product)
    {
        $u = $r->attributes->get('auth_user');

        if ((int) $product->coach_id !== (int) $u['id']) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $r->validate([
            'title'             => 'sometimes|string|max:160',
            'description'       => 'sometimes|nullable|string',
            'price'             => 'sometimes|integer|min:50',
            'currency'          => 'sometimes|string|size:3',
            'type'              => 'sometimes|string|in:online,in_person,hybrid',
            'gym_name'          => 'sometimes|nullable|string|max:160',
            'gym_address'       => 'sometimes|nullable|string|max:255',
            'duration_weeks'    => 'sometimes|nullable|integer|min:1|max:52',
            'sessions_per_week' => 'sometimes|nullable|integer|min:1|max:14',
            'access_days'       => 'sometimes|nullable|integer|min:1|max:365',
            'includes_chat'     => 'sometimes|boolean',
            'includes_calls'    => 'sometimes|boolean',
            'level'             => 'sometimes|nullable|string|max:24',
            'thumbnail_url'     => 'sometimes|nullable|string|max:255',
            'sort_order'        => 'sometimes|integer',
            'is_active'         => 'sometimes|boolean',
            'metadata'          => 'sometimes|array',
        ]);

        if (isset($data['currency'])) {
            $data['currency'] = strtoupper($data['currency']);
        }

        $product->fill($data)->save();

        return response()->json(['data' => $product]);
    }

    public function destroy(Request $r, Product $product)
    {
        $u = $r->attributes->get('auth_user');

        if ((int) $product->coach_id !== (int) $u['id']) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $product->is_active = false;
        $product->save();

        return response()->json(['message' => 'Archived']);
    }

    public function reorder(Request $r)
    {
        $u = (array)($r->attributes->get('auth_user') ?? []);
        $data = $r->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer'
        ]);

        $ids = $data['ids'];

        $mine = Product::query()
            ->where('coach_id', (int)$u['id'])
            ->orderBy('sort_order','asc')
            ->whereIn('id', $ids)
            ->pluck('id')
            ->all();

        $filtered = array_values(array_filter($ids, fn($id) => in_array((int)$id, $mine, true)));

        \DB::transaction(function () use ($filtered) {
            foreach ($filtered as $i => $id) {
                Product::where('id', $id)->update(['sort_order' => $i]);
            }
        });

        return response()->json(['message' => 'OK']);
    }
}