<?php

use Illuminate\Support\Facades\Route;
use App\Models\User;
use App\Http\Controllers\AuthController;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);
    Route::get('me',        [AuthController::class, 'me'])->middleware('auth:api');

    Route::middleware('auth:api')->put('users/me', [UserController::class, 'updateMe']);
});

Route::middleware('auth:api')->get('/users/{id}', function ($id) {
  $u = \App\Models\User::findOrFail($id);
  return [
    'id'    => $u->id,
    'name'  => $u->name,
    'email' => $u->email,
    'roles' => $u->roles->pluck('name'),
    'avatar_url' => $u->avatar_url ?? null,
  ];
});

Route::middleware('auth:api')->put('/auth/me', function (\Illuminate\Http\Request $r) {
    $data = $r->validate(['name' => 'required|string|max:120']);
    $u = $r->user();             // JWT guardas jau veikia
    $u->name = $data['name'];
    $u->save();
    return ['id'=>$u->id, 'name'=>$u->name, 'email'=>$u->email];
});