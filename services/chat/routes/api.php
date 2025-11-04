<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ConversationsController;
use App\Http\Controllers\MessagesController;

Route::middleware('auth.via')->group(function () {
    Route::get('/conversations', [ConversationsController::class, 'index']);
    Route::post('/conversations', [ConversationsController::class, 'store']);
    Route::get('/conversations/{conversation}', [ConversationsController::class, 'show']);
    Route::get('/conversations/{conversation}/messages', [MessagesController::class, 'index']);
    Route::post('/conversations/{conversation}/messages', [MessagesController::class, 'store']);
});