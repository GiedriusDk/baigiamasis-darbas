<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MetricsController;
use App\Http\Controllers\EntriesController;
use App\Http\Controllers\PhotosController;
use App\Http\Controllers\GoalsController;
use App\Http\Controllers\GoalCheckinsController;

Route::middleware(['auth.via'])->group(function () {

    Route::prefix('metrics')->group(function () {
        Route::get('',        [MetricsController::class, 'index']);
        Route::post('',       [MetricsController::class, 'store']);
        Route::get('{metric}',   [MetricsController::class, 'show']);
        Route::patch('{metric}', [MetricsController::class, 'update']);
        Route::delete('{metric}',[MetricsController::class, 'destroy']);
    });

    Route::prefix('entries')->group(function () {
        Route::get('',        [EntriesController::class, 'index']);
        Route::post('',       [EntriesController::class, 'store']);
        Route::get('{entry}',    [EntriesController::class, 'show']);
        Route::patch('{entry}',  [EntriesController::class, 'update']);
        Route::delete('{entry}', [EntriesController::class, 'destroy']);

        Route::get('{entry}/photos', [PhotosController::class, 'index']);
    });

    Route::prefix('photos')->group(function () {
        Route::post('',        [PhotosController::class, 'store']);     // multipart: image, entry_id
        Route::delete('{photo}',[PhotosController::class, 'destroy']);
    });

    Route::prefix('goals')->group(function () {
        Route::get('',        [GoalsController::class, 'index']);
        Route::post('',       [GoalsController::class, 'store']);
        Route::get('{goal}',     [GoalsController::class, 'show']);
        Route::patch('{goal}',   [GoalsController::class, 'update']);
        Route::delete('{goal}',  [GoalsController::class, 'destroy']);

        Route::get('{goal}/checkins',         [GoalCheckinsController::class, 'index']);
        Route::post('{goal}/checkins',        [GoalCheckinsController::class, 'store']);
        Route::delete('{goal}/checkins/{checkin}', [GoalCheckinsController::class, 'destroy']);
    });

});