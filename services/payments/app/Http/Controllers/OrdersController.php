<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Product;

class OrdersController extends Controller
{
    public function store(Request $r)
    {
        $data = $r->validate([
            'product_id' => 'required|integer|exists:products,id',
            'quantity'   => 'nullable|integer|min:1|max:50',
        ]);

        $authUser = $r->attributes->get('auth_user');
        if (!$authUser || empty($authUser['id'])) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $userId = (int)$authUser['id'];

        $qty = $data['quantity'] ?? 1;
        $product = Product::findOrFail($data['product_id']);
        if (!$product->is_active) {
            return response()->json(['message' => 'Product inactive'], 422);
        }

        $order = Order::create([
            'user_id'    => $userId,
            'product_id' => $product->id,
            'public_id'  => (string) \Illuminate\Support\Str::uuid(),
            'amount'     => $product->price,
            'currency'   => $product->currency,
            'status'     => 'pending',
            'metadata'   => ['qty' => $qty],
        ]);

        return response()->json(['data' => $order], 201);
    }

    public function show(Order $order)
    {
        return response()->json(['data' => $order->load('product')]);
    }

    public function access(Request $request, Order $order)
    {
        $user = $request->attributes->get('auth_user');
        $can  = ($order->status === 'paid') && ((int)$order->user_id === (int)($user['id'] ?? 0));

        return response()->json([
            'data' => [
                'can_access' => $can,
                'status'     => $order->status,
                'order_id'   => $order->id,
            ]
        ]);
    }
}