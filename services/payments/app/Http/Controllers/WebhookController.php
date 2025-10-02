<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\StripeService;

class WebhookController extends Controller
{
    public function stripe(Request $r, StripeService $stripe)
    {
        $payload   = $r->getContent();
        $signature = $r->header('Stripe-Signature');

        try {
            $stripe->verifyAndHandleWebhook($payload, $signature);
        } catch (\Throwable $e) {
            return response('Invalid', 400);
        }

        return response('OK', 200);
    }
}