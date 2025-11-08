<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ConversationsController;
use App\Http\Controllers\MessagesController;
use App\Http\Controllers\PresenceController;

Route::middleware(['auth.via', 'chat.presence'])->group(function () {
    Route::get('/conversations', [ConversationsController::class, 'index']);
    Route::post('/conversations', [ConversationsController::class, 'store']);
    Route::get('/conversations/{conversation}', [ConversationsController::class, 'show']);

    Route::get('/conversations/{conversation}/messages',  [MessagesController::class, 'index']);
    Route::post('/conversations/{conversation}/messages', [MessagesController::class, 'store']);
});

// <- SVARBU: presence maršrutai be 'chat.presence'
Route::middleware(['auth.via'])->group(function () {
    Route::post('/presence/touch', [PresenceController::class, 'touch']);
    Route::post('/presence/leave', [PresenceController::class, 'leave']);
    Route::get('/presence/status', [PresenceController::class, 'status']);
});