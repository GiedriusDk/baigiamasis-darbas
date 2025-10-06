<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\StripeService;

class CheckoutController extends Controller
{
    public function create(Order $order, StripeService $stripe)
    {
        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Order not payable'], 422);
        }

        $url = $stripe->createCheckoutSessionForOrder($order);

        return response()->json(['checkout_url' => $url]);
    }


        public function confirm(Request $request, StripeService $stripe)
    {
        $data = $request->validate([
            'order'   => 'required|integer|exists:orders,id',
            'session' => 'required|string',
        ]);

        /** @var Order $order */
        $order = Order::findOrFail($data['order']);
        
        if ($order->status === 'paid') {
            return response()->json([
                'status'  => 'paid',
                'message' => 'Order already paid.',
            ]);
        }

        $session = $stripe->retrieveCheckoutSession($data['session']);

        $isPaid = ($session->payment_status === 'paid')
                  || ($session->status === 'complete' && $session->payment_status === 'paid');

        if (!$isPaid) {
            return response()->json([
                'status'  => 'pending',
                'message' => 'Payment not completed yet.',
            ], 202);
        }

        DB::transaction(function () use ($order, $session) {
            $providerTxnId = $session->payment_intent ?: $session->id;

            Payment::updateOrCreate(
                [
                    'order_id'        => $order->id,
                    'provider'        => 'stripe',
                ],
                [
                    'provider_txn_id' => $providerTxnId,
                    'amount'          => $order->amount,
                    'currency'        => $order->currency,
                    'status'          => 'succeeded',
                    'paid_at'         => now(),
                    'raw_response'    => json_encode($session),
                ]
            );

            $order->status  = 'paid';
            $order->paid_at = now();
            $order->save();
        });

        return response()->json([
            'status'  => 'paid',
            'message' => 'Payment confirmed.',
        ]);
    }
}