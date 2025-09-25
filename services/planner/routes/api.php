<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PlanController;

Route::middleware('auth.proxy')->get('/me', function (Request $r) {
    // matysi ką atidavė AUTH /me
    return response()->json($r->attributes->get('auth_user'));
});

Route::middleware('auth.proxy')->group(function () {
    Route::post('/plans', [\App\Http\Controllers\PlanController::class, 'store']);
    Route::get('/plans/latest', [\App\Http\Controllers\PlanController::class, 'latest']);
    Route::get('/plans/{plan}', [\App\Http\Controllers\PlanController::class, 'show']);
    
    
});