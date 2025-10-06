<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Payment;
use App\Services\StripeService;
use Illuminate\Support\Carbon;

class WebhookController extends Controller
{
    public function stripe(Request $request)
    {
        $sig = $request->header('Stripe-Signature');
        if (!$sig) return response('Missing signature', 400);

        $payload = $request->getContent();
        try {
            $event = StripeService::make()->constructWebhookEvent($payload, $sig);
        } catch (\Throwable $e) {
            report($e);
            return response('Invalid signature', 400);
        }

        $type = $event['type'] ?? '';
        $obj  = $event['data']['object'] ?? [];

        if ($type === 'checkout.session.completed') {
            $sessionId = $obj['id'] ?? null;
            $clientRef = $obj['client_reference_id'] ?? null;

            if (!$sessionId || !$clientRef) {
                return response('Ignored', 200);
            }

            $payment = Payment::where('provider', 'stripe')
                ->where('provider_txn_id', $sessionId)
                ->first();

            $order = Order::where('public_id', $clientRef)->first();

            if ($order && $payment) {
                $payment->status       = 'succeeded';
                $payment->paid_at      = Carbon::now();
                $payment->raw_response = $obj;
                $payment->save();

                $order->status  = 'paid';
                $order->paid_at = Carbon::now();
                $order->save();
            }

            return response('ok', 200);
        }

        if ($type === 'payment_intent.succeeded') {
            return response('ok', 200);
        }

        return response('ignored', 200);
    }
}