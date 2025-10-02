<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductsController;
use App\Http\Controllers\OrdersController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\WebhookController;

Route::get('/up', fn () => response()->json(['ok' => true]));

Route::get('/products',            [ProductsController::class, 'index']);
Route::get('/products/{product}',  [ProductsController::class, 'show']);


Route::middleware('auth.service')->group(function () {
    Route::post('/orders', [OrdersController::class, 'store']);
    Route::get('/orders/{order}', [OrdersController::class, 'show']);
    Route::post('/checkout/{order}', [CheckoutController::class, 'create']);
});

Route::post('/checkout/{order}',   [CheckoutController::class, 'create']);

Route::post('/webhooks/stripe',    [WebhookController::class, 'stripe']);