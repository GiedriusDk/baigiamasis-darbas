<?php

use Illuminate\Support\Facades\Route;
use App\Models\User;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\NewPasswordController;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);

    Route::middleware('auth:api')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::put('users/me', [UserController::class, 'updateMe']);
        Route::put('me/email', [UserController::class, 'updateEmail']);
        Route::put('me/password', [UserController::class, 'updatePassword']);
    });

    Route::middleware('throttle:5,1')->post('forgot-password', [PasswordResetLinkController::class, 'store']);
    Route::middleware('throttle:5,1')->post('reset-password',  [NewPasswordController::class, 'store']);

    Route::get('public/users/{id}', function ($id) {
    $u = \App\Models\User::findOrFail($id);
    return [
        'id'         => $u->id,
        'first_name' => $u->first_name,
        'last_name'  => $u->last_name,
    ];
});
});

Route::middleware('auth:api')->get('/users/{id}', function ($id, \Illuminate\Http\Request $r) {
    $u = $r->user();

    if (!$u->roles->contains('name', 'admin') && !$u->roles->contains('id', 1)) {
        return response()->json(['message' => 'Forbidden'], 403);
    }

    $target = \App\Models\User::findOrFail($id);

    return [
        'id'         => $target->id,
        'first_name' => $target->first_name,
        'last_name'  => $target->last_name,
        'email'      => $target->email,
        'roles'      => $target->roles->pluck('name'),
    ];
});

Route::middleware('auth:api')->put('/auth/me', function (\Illuminate\Http\Request $r) {
    $data = $r->validate([
        'first_name' => 'required|string|max:120',
        'last_name'  => 'required|string|max:120',
    ]);

    $u = $r->user();
    $u->first_name = $data['first_name'];
    $u->last_name  = $data['last_name'];
    $u->save();

    return [
        'id'         => $u->id,
        'first_name' => $u->first_name,
        'last_name'  => $u->last_name,
        'email'      => $u->email,
    ];
});

