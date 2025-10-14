<?php

namespace App\Services;

use App\Models\Order;
use Stripe\StripeClient;

class StripeService
{
    public function __construct(
        protected ?StripeClient $client = null
    ) {
        $this->client = $this->client ?: new StripeClient(config('services.stripe.secret'));
    }

    public function retrieveCheckoutSession(string $sessionId): \Stripe\Checkout\Session
    {
        return $this->client->checkout->sessions->retrieve($sessionId, []);
    }

    public function createCheckoutSessionForOrder(Order $order): string
    {
        $currency = strtolower(config('services.stripe.currency', 'eur'));

        $frontend = rtrim(env('FRONTEND_URL', env('APP_URL', 'http://localhost:5173')), '/');
        $success  = $frontend . '/payments/success?order=' . $order->id . '&session_id={CHECKOUT_SESSION_ID}';
        $cancel   = $frontend . '/payments/cancelled?order=' . $order->id;

        $amount = (int) $order->amount;

        $session = $this->client->checkout->sessions->create([
            'mode'        => 'payment',
            'success_url' => $success,
            'cancel_url'  => $cancel,
            'line_items'  => [[
                'price_data' => [
                    'currency'     => $currency,
                    'product_data' => [
                        'name'        => 'Order #' . $order->id,
                        'description' => 'Product ID: ' . $order->product_id,
                    ],
                    'unit_amount'  => $amount,
                ],
                'quantity' => 1,
            ]],
            'metadata' => [
                'order_id'  => (string) $order->id,
                'public_id' => (string) $order->public_id,
            ],
        ]);

        return $session->url;
    }
}