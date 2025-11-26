<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

class AdminOrdersController extends Controller
{
    protected function transformOrder(Order $o): array
    {
        return [
            'id'         => $o->id,
            'user_id'    => $o->user_id,
            'product_id' => $o->product_id,
            'public_id'  => $o->public_id,
            'amount'     => $o->amount,
            'currency'   => $o->currency,
            'status'     => $o->status,
            'paid_at'    => $o->paid_at,
            'expires_at' => $o->expires_at,
            'metadata'   => $o->metadata,
            'created_at' => $o->created_at,
            'updated_at' => $o->updated_at,
        ];
    }

    public function index(Request $request)
    {
        $query = Order::query()->orderByDesc('id');

        if ($userId = $request->query('user_id')) {
            $query->where('user_id', $userId);
        }

        if ($productId = $request->query('product_id')) {
            $query->where('product_id', $productId);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $orders = $query->limit(500)->get();

        return response()->json([
            'data' => $orders->map(fn (Order $o) => $this->transformOrder($o)),
        ]);
    }

    public function show(int $id)
    {
        $order = Order::findOrFail($id);

        return response()->json(
            $this->transformOrder($order)
        );
    }

    public function update(Request $request, int $id)
    {
        $order = Order::findOrFail($id);

        $data = $request->validate([
            'status'     => 'sometimes|string|max:255',
            'paid_at'    => 'nullable|date',
            'expires_at' => 'nullable|date',
            'metadata'   => 'nullable',
        ]);

        unset($data['id'], $data['user_id'], $data['product_id'], $data['public_id'], $data['amount'], $data['currency'], $data['created_at'], $data['updated_at']);

        $order->fill($data);
        $order->save();

        return response()->json(
            $this->transformOrder($order)
        );
    }
}