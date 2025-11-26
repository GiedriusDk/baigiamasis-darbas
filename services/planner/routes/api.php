<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\PlanController;
use App\Http\Controllers\WorkoutController;
use App\Http\Controllers\WorkoutExerciseController;

use App\Http\Controllers\Admin\AdminWorkoutController;
use App\Http\Controllers\Admin\AdminSplitController;

Route::middleware('auth.via')->get('/me', function (Request $r) {
    return response()->json($r->attributes->get('auth_user'));
});

Route::middleware('auth.via')->group(function () {

    Route::post('/plans', [PlanController::class, 'store']);
    Route::get('/plans/latest', [PlanController::class, 'latest']);
    Route::get('/plans/{plan}', [PlanController::class, 'show']);


    Route::get('/plans/{plan}/workouts', [WorkoutController::class, 'index']);
    Route::post('/plans/{plan}/workouts', [WorkoutController::class, 'store']);
    Route::put('/workouts/{workout}', [WorkoutController::class, 'update']);
    Route::delete('/workouts/{workout}', [WorkoutController::class, 'destroy']);

    Route::get('/workouts/{workout}/exercises', [WorkoutExerciseController::class, 'index']);
    Route::post('/workouts/{workout}/exercises', [WorkoutExerciseController::class, 'store']);
    Route::put('/workouts/{workout}/exercises/{workoutExercise}',[WorkoutExerciseController::class, 'update']);
    Route::delete('/workouts/{workout}/exercises/{workoutExercise}', [WorkoutExerciseController::class, 'destroy']);


    Route::get('/workouts/{workout}/exercises/{order}/alternatives', [WorkoutExerciseController::class, 'alternatives']);
    Route::patch('/workouts/{workout}/exercises/{order}', [WorkoutExerciseController::class, 'swap']);
    Route::get('/exercises/search', [WorkoutExerciseController::class, 'search']);
});

Route::middleware('auth.via:admin')->prefix('admin')->group(function () {
    
    Route::get('workouts',       [AdminWorkoutController::class, 'index']);
    Route::get('workouts/{id}',  [AdminWorkoutController::class, 'show']);
    Route::put('workouts/{id}',  [AdminWorkoutController::class, 'update']);
    Route::delete('workouts/{id}', [AdminWorkoutController::class, 'destroy']);

    Route::get('splits',       [AdminSplitController::class, 'index']);
    Route::get('splits/{id}',  [AdminSplitController::class, 'show']);
    Route::put('splits/{id}',  [AdminSplitController::class, 'update']);
    Route::delete('splits/{id}', [AdminSplitController::class, 'destroy']);
});