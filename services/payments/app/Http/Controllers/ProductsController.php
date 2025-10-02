<?php

namespace App\Http\Controllers;

use App\Models\Product;

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
        abort_unless($product->is_active, 404);
        return response()->json(['data' => $product]);
    }
}