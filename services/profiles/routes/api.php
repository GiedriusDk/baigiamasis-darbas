<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CoachProfileController;
use App\Http\Controllers\CoachExerciseController;

Route::middleware('auth.proxy')->prefix('coach')->group(function () {
    // Profile (jau turi)
    Route::get('profile', [CoachProfileController::class, 'show']);
    Route::put('profile', [CoachProfileController::class, 'update']);
    Route::post('upload', [CoachProfileController::class, 'upload']); // jei naudojama avatarui

    // Exercises
    Route::get('exercises', [CoachExerciseController::class, 'index']);
    Route::post('exercises', [CoachExerciseController::class, 'store']);
    Route::post('exercises/reorder', [CoachExerciseController::class, 'reorder']);
    Route::post('exercises/{coachExercise}', [CoachExerciseController::class, 'update']); // PUT taip pat tinka
    Route::delete('exercises/{coachExercise}', [CoachExerciseController::class, 'destroy']);
    Route::put   ('/exercises/reorder',         [CoachExerciseController::class, 'reorder']);
});