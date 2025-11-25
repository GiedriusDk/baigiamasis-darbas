<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ConversationsController;
use App\Http\Controllers\MessagesController;
use App\Http\Controllers\PresenceController;
use App\Http\Controllers\ForumController;
use App\Http\Controllers\CoachClientLinkController;

Route::middleware(['auth.via', 'chat.presence'])->group(function () {
    Route::get('/conversations', [ConversationsController::class, 'index']);
    Route::post('/conversations', [ConversationsController::class, 'store']);
    Route::get('/conversations/{conversation}', [ConversationsController::class, 'show']);

    Route::get('/conversations/{conversation}/messages',  [MessagesController::class, 'index']);
    Route::post('/conversations/{conversation}/messages', [MessagesController::class, 'store']);
});

Route::middleware(['auth.via'])->group(function () {
    Route::post('/presence/touch', [PresenceController::class, 'touch']);
    Route::post('/presence/leave', [PresenceController::class, 'leave']);
    Route::get('/presence/status', [PresenceController::class, 'status']);

    Route::get('/forums', [ForumController::class, 'rooms']);
    Route::get('/forums/{room}/messages', [ForumController::class, 'messages']);
    Route::post('/forums/{room}/messages', [ForumController::class, 'send']);
});
Route::middleware(['auth.via:coach'])->group(function () {
    Route::get('/coach/clients', [CoachClientLinkController::class, 'list']);
    Route::get('/coach/clients/{userId}', [CoachClientLinkController::class, 'check']);
});