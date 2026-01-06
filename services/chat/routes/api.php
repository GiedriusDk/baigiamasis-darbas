<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ConversationsController;
use App\Http\Controllers\MessagesController;
use App\Http\Controllers\PresenceController;
use App\Http\Controllers\ForumController;
use App\Http\Controllers\CoachClientLinkController;

use App\Http\Controllers\Admin\AdminChatRoomController;
use App\Http\Controllers\Admin\AdminChatMessageController;

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
Route::middleware(['auth.via:coach,admin'])->group(function () {
    Route::get('/coach/clients', [CoachClientLinkController::class, 'list']);
    Route::get('/coach/clients/{userId}', [CoachClientLinkController::class, 'check']);
});

Route::middleware('auth.via:admin')->prefix('admin')->group(function () {

    Route::get('rooms',        [AdminChatRoomController::class, 'index']);
    Route::get('rooms/{id}',   [AdminChatRoomController::class, 'show']);
    Route::put('rooms/{id}',   [AdminChatRoomController::class, 'update']);
    Route::delete('rooms/{id}',[AdminChatRoomController::class, 'destroy']);

    Route::get('messages',        [AdminChatMessageController::class, 'index']);
    Route::get('messages/{id}',   [AdminChatMessageController::class, 'show']);
    Route::put('messages/{id}',   [AdminChatMessageController::class, 'update']);
    Route::delete('messages/{id}',[AdminChatMessageController::class, 'destroy']);
});