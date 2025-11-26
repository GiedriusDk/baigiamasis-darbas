<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductsController;
use App\Http\Controllers\OrdersController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\PublicProductsController;
use App\Http\Controllers\InternalAccessController;

use App\Http\Controllers\Admin\AdminOrdersController;
use App\Http\Controllers\Admin\AdminPaymentsController;
use App\Http\Controllers\Admin\AdminProductsController;

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


Route::middleware('auth.via:admin')->prefix('admin')->group(function () {
    Route::get('orders', [AdminOrdersController::class, 'index']);
    Route::get('orders/{id}', [AdminOrdersController::class, 'show']);
    Route::put('orders/{id}', [AdminOrdersController::class, 'update']);

    Route::get('payments', [AdminPaymentsController::class, 'index']);
    Route::get('payments/{id}', [AdminPaymentsController::class, 'show']);
    Route::put('payments/{id}', [AdminPaymentsController::class, 'update']);

    Route::get('products', [AdminProductsController::class, 'index']);
    Route::get('products/{id}', [AdminProductsController::class, 'show']);
    Route::put('products/{id}', [AdminProductsController::class, 'update']);
});