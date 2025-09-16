<?php

use Illuminate\Support\Facades\Route;
use App\Models\User;
use App\Http\Controllers\AuthController;
// use App\Http\Controllers\UserController; // <- nebūtinas, jei nenaudosi users/me

Route::prefix('auth')->group(function () {
    // Auth pagrindas
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login',    [AuthController::class, 'login']);

    // Kas aš? (reikia JWT)
    Route::get('me', [AuthController::class, 'me'])->middleware('auth:api');

    // Atnaujinti savo vardą (reikia JWT)
    Route::middleware('auth:api')->put('me', function (\Illuminate\Http\Request $r) {
        $data = $r->validate(['name' => 'required|string|max:120']);
        $u = $r->user();
        $u->name = $data['name'];
        $u->save();
        return ['id' => $u->id, 'name' => $u->name, 'email' => $u->email];
    });

    // Viešas minimalus endpoint'as (be JWT) – coach vardui rodyti
    Route::get('public/users/{id}', function ($id) {
        $u = \App\Models\User::findOrFail($id);
        return [
            'id'         => $u->id,
            'name'       => $u->name,
            // jei norėsi, gali pridėti 'avatar_url' => $u->avatar_url ?? null,
        ];
    });

    // Adminams skirtas endpoint'as – mato el. paštą ir roles (reikia JWT + ADMIN)
    Route::middleware('auth:api')->get('users/{id}', function ($id, \Illuminate\Http\Request $r) {
        $me = $r->user();

        // leisti tik jei turi admin vardinę rolę arba role_id=1
        if (!$me->roles->contains('name', 'admin') && !$me->roles->contains('id', 1)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $target = \App\Models\User::with('roles:id,name')->findOrFail($id);

        return [
            'id'    => $target->id,
            'name'  => $target->name,
            'email' => $target->email,
            'roles' => $target->roles->pluck('name'),
        ];
    });
});