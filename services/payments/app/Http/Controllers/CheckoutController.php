<?php

namespace App\Http\Controllers;

use App\Models\Order;

class CheckoutController extends Controller
{
    public function create(Order $order)
    {
        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Order not payable'], 422);
        }

        // Kol kas — „fake“ checkout nuoroda (be Stripe)
        $url = url('/payments/fake-checkout/'.$order->public_id);

        return response()->json(['checkout_url' => $url]);
    }
}