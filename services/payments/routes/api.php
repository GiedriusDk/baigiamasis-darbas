<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductsController;
use App\Http\Controllers\OrdersController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\PublicProductsController;
use App\Http\Controllers\InternalAccessController;

Route::prefix('')->group(function () {
    Route::get('products', [ProductsController::class, 'index']);

    Route::middleware('auth.via')->group(function () {
        Route::post('orders', [OrdersController::class, 'store']);
        Route::get('orders/{order}', [OrdersController::class, 'show'])->whereNumber('order');
        Route::get('orders/{order}/access', [OrdersController::class, 'access'])->whereNumber('order');

        Route::post('checkout/{order}', [CheckoutController::class, 'create'])->whereNumber('order');
        Route::get('confirm', [CheckoutController::class, 'confirm']);
        Route::get('me/access', [OrdersController::class, 'meAccess']);
    });

    Route::middleware('auth.via:coach')->group(function () {
        Route::get('products/mine', [ProductsController::class, 'mine']);
        Route::put('products/reorder', [ProductsController::class, 'reorder']);
        Route::post('products', [ProductsController::class, 'store']);
        Route::patch('products/{product}', [ProductsController::class, 'update'])->whereNumber('product');
        Route::delete('products/{product}', [ProductsController::class, 'destroy'])->whereNumber('product');
        Route::post('products/thumbnail', [ProductsController::class, 'uploadThumbnail']);
    });

    Route::get('products/{product}', [ProductsController::class, 'show'])->whereNumber('product');
});

Route::prefix('public')->group(function () {
    Route::get('products/{id}', [PublicProductsController::class, 'show']);
});
Route::prefix('internal')->middleware('auth.via')->group(function () {
    Route::get('owned-coaches', [InternalAccessController::class, 'ownedCoaches']);
    Route::get('can-chat',      [InternalAccessController::class, 'canChat']);
});