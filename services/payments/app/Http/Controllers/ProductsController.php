<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class ProductsController extends Controller
{
    public function index()
    {
        $items = Product::query()
            ->where('is_active', true)
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
            ->where('coach_id', (int)$u['id'])
            ->orderByDesc('id')
            ->get();

        return response()->json(['data' => $items]);
    }

    public function store(Request $r)
    {
        $u = (array) ($r->attributes->get('auth_user') ?? []);

        $data = $r->validate([
            'title'       => 'required|string|max:160',
            'description' => 'nullable|string',
            'price'       => 'required|integer|min:50',
            'currency'    => 'nullable|string|size:3',
            'is_active'   => 'nullable|boolean',
            'metadata'    => 'nullable|array',
        ]);

        $p = Product::create([
            'coach_id'   => (int)$u['id'],
            'title'      => $data['title'],
            'description'=> $data['description'] ?? null,
            'price'      => $data['price'],
            'currency'   => strtoupper($data['currency'] ?? 'EUR'),
            'is_active'  => (bool)($data['is_active'] ?? true),
            'metadata'   => $data['metadata'] ?? null,
        ]);

        return response()->json(['data' => $p], 201);
    }

    public function update(Request $r, Product $product)
    {
        $u = $r->attributes->get('auth_user');
        if ((int)$product->coach_id !== (int)$u['id']) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $r->validate([
            'title'       => 'sometimes|string|max:160',
            'description' => 'sometimes|nullable|string',
            'price'       => 'sometimes|integer|min:50',
            'currency'    => 'sometimes|string|size:3',
            'is_active'   => 'sometimes|boolean',
            'metadata'    => 'sometimes|array',
        ]);

        $product->fill([
            'title'       => $data['title'] ?? $product->title,
            'description' => array_key_exists('description', $data) ? $data['description'] : $product->description,
            'price'       => $data['price'] ?? $product->price,
            'currency'    => isset($data['currency']) ? strtoupper($data['currency']) : $product->currency,
            'is_active'   => $data['is_active'] ?? $product->is_active,
            'metadata'    => $data['metadata'] ?? $product->metadata,
        ])->save();

        return response()->json(['data' => $product]);
    }

    public function destroy(Request $r, Product $product)
    {
        $u = $r->attributes->get('auth_user');
        if ((int)$product->coach_id !== (int)$u['id']) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $product->is_active = false;
        $product->save();

        return response()->json(['message' => 'Archived']);
    }
}