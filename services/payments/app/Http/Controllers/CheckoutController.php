<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use App\Services\StripeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CheckoutController extends Controller
{
    public function create(Order $order, StripeService $stripe)
    {
        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Order not payable'], 422);
        }

        // StripeService turi suformuoti success_url į FE:
        // FRONTEND_URL/payments/success?order={$order->id}&session_id={CHECKOUT_SESSION_ID}
        $url = $stripe->createCheckoutSessionForOrder($order);

        return response()->json(['checkout_url' => $url]);
    }

    // GET /api/payments/confirm?order=123&session=cs_test_...
    public function confirm(Request $request, StripeService $stripe)
    {
        // 1) parametrai
        $data = $request->validate([
            'order'   => 'required|integer|exists:orders,id',
            'session' => 'required|string',
        ]);

        /** @var Order $order */
        $order = Order::findOrFail($data['order']);

        // jau apmokėtas?
        if ($order->status === 'paid') {
            return response()->json([
                'status'  => 'paid',
                'message' => 'Order already paid.',
            ]);
        }

        // 2) Stripe session (rekomenduojama StripeService daryti expand=['payment_intent'])
        $session = $stripe->retrieveCheckoutSession($data['session']);

        $isPaid = (
            (isset($session->payment_status) && $session->payment_status === 'paid') ||
            (isset($session->status, $session->payment_status) && $session->status === 'complete' && $session->payment_status === 'paid')
        );

        if (!$isPaid) {
            return response()->json([
                'status'  => 'pending',
                'message' => 'Payment not completed yet.',
            ], 202);
        }

        // 3) Užfiksuojam DB
        DB::transaction(function () use ($order, $session) {
            $providerTxnId = $session->payment_intent->id ?? $session->payment_intent ?? $session->id;
            $amount        = $session->amount_total ?? $order->amount ?? 0;
            $currency      = strtolower($session->currency ?? $order->currency ?? 'eur');

            Payment::updateOrCreate(
                [
                    'order_id' => $order->id,
                    'provider' => 'stripe',
                ],
                [
                    'provider_txn_id' => $providerTxnId,
                    'amount'          => $amount,
                    'currency'        => $currency,
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