<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CoachProfileController;
use App\Http\Controllers\CoachExerciseController;
use App\Http\Controllers\UserProfileController;
use App\Http\Controllers\CoachPublicController;

Route::middleware('auth.proxy')->prefix('coach')->group(function () {
    // Profile (jau turi)
    Route::get('profile', [CoachProfileController::class, 'show']);
    Route::put('profile', [CoachProfileController::class, 'update']);
    Route::post('upload', [CoachProfileController::class, 'upload']);

    // Exercises
    Route::get('exercises', [CoachExerciseController::class, 'index']);
    Route::post('exercises', [CoachExerciseController::class, 'store']);
    Route::post('exercises/reorder', [CoachExerciseController::class, 'reorder']);
    Route::post('exercises/{coachExercise}', [CoachExerciseController::class, 'update']);
    Route::delete('exercises/{coachExercise}', [CoachExerciseController::class, 'destroy']);
    Route::put   ('/exercises/reorder',         [CoachExerciseController::class, 'reorder']);
});

Route::middleware('auth.proxy')->group(function () {
    Route::get('user/profile',  [UserProfileController::class, 'show']);   // GET /api/user/profile
    Route::put('user/profile',  [UserProfileController::class, 'update']); // PUT /api/user/profile
    Route::post('user/upload',  [UserProfileController::class, 'upload']);
});

Route::prefix('coach/public')->group(function () {
    Route::get('/',        [CoachPublicController::class, 'index']);
    Route::get('{id}',     [CoachPublicController::class, 'show']);
    Route::get('{id}/exercises', [CoachPublicController::class, 'exercises']);
});
