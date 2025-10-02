<?php

return [
    'secret'         => env('STRIPE_SECRET_KEY', ''),
    'public'         => env('STRIPE_PUBLIC_KEY', ''),
    'webhook_secret' => env('STRIPE_WEBHOOK_SECRET', ''), // gali likti tuščias kol nenaudosi webhook
    'success_url'    => env('STRIPE_SUCCESS_URL', 'http://localhost:5173/payments/success?session_id={CHECKOUT_SESSION_ID}'),
    'cancel_url'     => env('STRIPE_CANCEL_URL',  'http://localhost:5173/payments/cancelled'),
    'currency'       => env('STRIPE_CURRENCY', 'eur'),
];