<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\WorkoutExerciseController;

Route::middleware('auth.via')->get('/me', function (Request $r) {
    return response()->json($r->attributes->get('auth_user'));
});

Route::middleware('auth.via')->group(function () {
    Route::post('/plans', [\App\Http\Controllers\PlanController::class, 'store']);
    Route::get('/plans/latest', [\App\Http\Controllers\PlanController::class, 'latest']);
    Route::get('/plans/{plan}', [\App\Http\Controllers\PlanController::class, 'show']);
    

    Route::get('/workouts/{workout}/exercises/{order}/alternatives', [WorkoutExerciseController::class, 'alternatives']);
    Route::patch('/workouts/{workout}/exercises/{order}', [WorkoutExerciseController::class, 'swap']);
    Route::get('/exercises/search', [WorkoutExerciseController::class, 'search']);
});