<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\PlanWeekController;
use App\Http\Controllers\PlanDayController;
use App\Http\Controllers\PlanDayExercisesController;

use App\Http\Controllers\Admin\AdminPlansController;

Route::middleware(['auth.via:coach'])->group(function () {

    Route::get('/products/{productId}/plan', [PlanController::class, 'showByProduct']);

    Route::post('/plans/{plan}/weeks', [PlanWeekController::class, 'store']);
    Route::put('/plans/weeks/{id}', [\App\Http\Controllers\PlanWeekController::class, 'update']);
    Route::delete('/weeks/{week}', [PlanWeekController::class, 'destroy']);

    Route::post('/plans/{plan}/days', [PlanDayController::class, 'store']);
    Route::put('/plans/days/{id}', [PlanDayController::class, 'update']); 
    Route::delete('/days/{day}', [PlanDayController::class, 'destroy']);

    Route::get('/products/{productId}/days/{day}/exercises', [PlanDayExercisesController::class, 'index']);
    Route::put('/products/{productId}/days/{day}/exercises', [PlanDayExercisesController::class, 'update']);
});

Route::prefix('public')->group(function () {
    Route::get('/products/{productId}/plan', [PlanController::class, 'publicShow']);
    Route::get('/products/{productId}/days/{day}/exercises', [PlanDayExercisesController::class, 'publicIndex']);
});


Route::middleware('auth.via:admin')->prefix('admin')->group(function () {
    Route::get('plans', [AdminPlansController::class, 'index']);
    Route::get('plans/{id}', [AdminPlansController::class, 'show']);
});