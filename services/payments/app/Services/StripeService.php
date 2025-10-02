<?php

namespace App\Services;

use Stripe\StripeClient;
use App\Models\Order;

class StripeService
{
    protected StripeClient $stripe;

    public function __construct()
    {
        $this->stripe = new StripeClient(config('stripe.secret'));
    }

    public function createCheckoutSessionForOrder(Order $order): string
    {
        // Šitam MVP naudosim vieną "line item" iš Order sumos (centais).
        // Jei nori realių pozicijų — paimsi iš products/order_items.
        $amount   = (int) $order->total_price_cents;
        $currency = config('stripe.currency', 'eur');

        $session = $this->stripe->checkout->sessions->create([
            'mode'        => 'payment',
            'success_url' => config('stripe.success_url'),
            'cancel_url'  => config('stripe.cancel_url'),
            'line_items'  => [[
                'price_data' => [
                    'currency'     => $currency,
                    'product_data' => [
                        'name' => 'Order #'.$order->id,
                    ],
                    'unit_amount'  => $amount,
                ],
                'quantity' => 1,
            ]],
            // Patogu pasidėti orderio ID
            'metadata' => [
                'order_id' => (string)$order->id,
            ],
        ]);

        return $session->url;
    }

    public function verifyAndHandleWebhook(string $payload, ?string $sigHeader): void
    {
        $secret = config('stripe.webhook_secret');
        // Paprastumui: jeigu webhook secret nėra nustatytas, praleidžiam verifikaciją (dev režimas).
        if ($secret) {
            $event = \Stripe\Webhook::constructEvent($payload, $sigHeader, $secret);
        } else {
            $event = json_decode($payload);
        }

        $type = $event->type ?? $event->type ?? null;

        if ($type === 'checkout.session.completed') {
            $session = $event->data->object ?? null;
            $orderId = $session?->metadata?->order_id ?? null;

            if ($orderId) {
                $order = \App\Models\Order::find($orderId);
                if ($order && $order->status !== 'paid') {
                    $order->status = 'paid';
                    $order->save();

                    // (nebūtina) įrašyk Payment į payments lentelę, jei turi modelį
                    \App\Models\Payment::create([
                        'order_id'         => $order->id,
                        'provider'         => 'stripe',
                        'provider_ref'     => $session->id ?? null,
                        'amount_cents'     => $order->total_price_cents,
                        'currency'         => config('stripe.currency', 'eur'),
                        'status'           => 'succeeded',
                        'raw_payload_json' => json_encode($session),
                    ]);
                }
            }
        }
    }
}