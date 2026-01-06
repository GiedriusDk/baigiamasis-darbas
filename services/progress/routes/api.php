<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MetricsController;
use App\Http\Controllers\EntriesController;
use App\Http\Controllers\PhotosController;
use App\Http\Controllers\GoalsController;
use App\Http\Controllers\GoalCheckinsController;

use App\Http\Controllers\Admin\AdminProgressGoalsController;
use App\Http\Controllers\Admin\AdminProgressEntriesController;

Route::middleware(['auth.via:user,admin'])->group(function () {

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
        Route::post('',        [PhotosController::class, 'store']);
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



Route::middleware('auth.via:admin')->prefix('admin')->group(function () {
    Route::get('progress-goals', [AdminProgressGoalsController::class, 'index']);
    Route::get('progress-goals/{id}', [AdminProgressGoalsController::class, 'show']);
    Route::put('progress-goals/{id}', [AdminProgressGoalsController::class, 'update']);
    Route::delete('progress-goals/{id}', [AdminProgressGoalsController::class, 'destroy']);

    Route::get('progress-entries', [AdminProgressEntriesController::class, 'index']);
    Route::get('progress-entries/{id}', [AdminProgressEntriesController::class, 'show']);
    Route::put('progress-entries/{id}', [AdminProgressEntriesController::class, 'update']);
    Route::delete('progress-entries/{id}', [AdminProgressEntriesController::class, 'destroy']);
});