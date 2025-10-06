<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductsController;
use App\Http\Controllers\OrdersController;
use App\Http\Controllers\CheckoutController;

Route::prefix('')->group(function () {
    Route::get('products', [ProductsController::class, 'index']);
    Route::get('products/{product}', [ProductsController::class, 'show']);

    Route::get('confirm', [CheckoutController::class, 'confirm']);

    Route::middleware('auth.service')->group(function () {
        Route::get('products/mine', [ProductsController::class, 'mine'])->middleware('coach');
        Route::post('products', [ProductsController::class, 'store'])->middleware('coach');
        Route::patch('products/{product}', [ProductsController::class, 'update'])->middleware('coach');
        Route::delete('products/{product}', [ProductsController::class, 'destroy'])->middleware('coach');

        Route::post('orders', [OrdersController::class, 'store']);
    });

    Route::get('orders/{order}/access', [OrdersController::class, 'access'])
            ->middleware('auth.service');
    
    Route::get('orders/{order}', [OrdersController::class, 'show']);

    Route::post('checkout/{order}', [CheckoutController::class, 'create']);
    Route::get('checkout/confirm', [CheckoutController::class, 'confirm']);
});