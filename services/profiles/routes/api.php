<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CoachProfileController;
use App\Http\Controllers\CoachExerciseController;
use App\Http\Controllers\UserProfileController;
use App\Http\Controllers\CoachPublicController;
use App\Http\Controllers\PublicUsersController;
use App\Http\Controllers\CoachClientProfileController;

use App\Http\Controllers\Admin\AdminProfilesController;
use App\Http\Controllers\Admin\AdminCoachController;
use App\Http\Controllers\Admin\AdminExerciseController;

Route::middleware('auth.via:coach,admin')->prefix('coach')->group(function () {

    Route::get('clients/{userId}', [CoachClientProfileController::class, 'show']);
    Route::get('profile', [CoachProfileController::class, 'show']);
    Route::put('profile', [CoachProfileController::class, 'update']);
    Route::post('upload', [CoachProfileController::class, 'upload']);

    Route::get('exercises/shared', [CoachExerciseController::class, 'shared']);
    Route::get('exercises/shared/{id}', [CoachExerciseController::class, 'sharedShow']);
    Route::post('exercises/import', [CoachExerciseController::class, 'importFromCatalog']);

    Route::get('exercises', [CoachExerciseController::class, 'index']);
    Route::post('exercises', [CoachExerciseController::class, 'store']);
    Route::post('exercises/{coachExercise}', [CoachExerciseController::class, 'update']);
    Route::delete('exercises/{coachExercise}', [CoachExerciseController::class, 'destroy']);
    Route::put('exercises/reorder', [CoachExerciseController::class, 'reorder']);
});


Route::middleware('auth.via:user,admin')->group(function () {
    Route::get('user/profile',  [UserProfileController::class, 'show']);
    Route::put('user/profile',  [UserProfileController::class, 'update']);
    Route::post('user/upload',  [UserProfileController::class, 'upload']);
});

Route::prefix('coach/public')->group(function () {
    Route::get('/', [CoachPublicController::class, 'index']);
    Route::get('{id}', [CoachPublicController::class, 'show']);
    Route::get('{id}/exercises', [CoachPublicController::class, 'exercises']);
});
Route::prefix('user/public')->group(function () {
    Route::get('{id}', [PublicUsersController::class, 'show']);
});

Route::middleware('auth.via:admin')->prefix('admin')->group(function () {
    Route::get('users', [AdminProfilesController::class, 'index']);
    Route::get('users/{id}', [AdminProfilesController::class, 'show']);
    Route::put('users/{id}', [AdminProfilesController::class, 'update']);
    Route::delete('users/{id}', [AdminProfilesController::class, 'destroy']);

    Route::get('coaches', [AdminCoachController::class, 'index']);
    Route::get('coaches/{id}', [AdminCoachController::class, 'show']);
    Route::put('coaches/{id}', [AdminCoachController::class, 'update']);
    Route::delete('coaches/{id}', [AdminCoachController::class, 'destroy']);

    Route::get('exercises', [AdminExerciseController::class, 'index']);
    Route::get('exercises/{id}', [AdminExerciseController::class, 'show']);
    Route::put('exercises/{id}', [AdminExerciseController::class, 'update']);
    Route::delete('exercises/{id}', [AdminExerciseController::class, 'destroy']);
});