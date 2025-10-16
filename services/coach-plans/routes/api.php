<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PlanDayExercisesController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\PlanWeekController;
use App\Http\Controllers\PlanDayController;

    Route::middleware('auth.service')->group(function () {
        Route::middleware('coach')->group(function () {
            Route::get('/plans', [PlanController::class, 'index']);
            Route::post('/plans', [PlanController::class, 'store']);
            Route::get('/plans/{plan}', [PlanController::class, 'show']);
            Route::put('/plans/{plan}', [PlanController::class, 'update']);
            Route::delete('/plans/{plan}', [PlanController::class, 'destroy']);

            Route::get('/plans/{plan}/weeks', [PlanWeekController::class, 'index']);
            Route::post('/plans/{plan}/weeks', [PlanWeekController::class, 'store']);
            Route::put('/plans/{plan}/weeks/reorder', [PlanWeekController::class, 'reorder']);
            Route::delete('/plans/{plan}/weeks/{week}', [PlanWeekController::class, 'destroy']);

            Route::get('/weeks/{week}/days', [PlanDayController::class, 'index']);
            Route::post('/weeks/{week}/days', [PlanDayController::class, 'store']);
            Route::put('/weeks/{week}/days/reorder', [PlanDayController::class, 'reorder']);
            Route::delete('/weeks/{week}/days/{day}', [PlanDayController::class, 'destroy']);

            Route::get('/products/{productId}/days/{dayId}/exercises', [PlanDayExercisesController::class, 'index']);
            Route::put('/products/{productId}/days/{dayId}/exercises', [PlanDayExercisesController::class, 'update']);
        });

    });


Route::get('/public/products/{productId}/days/{dayId}/exercises', [PlanDayExercisesController::class, 'publicIndex']);