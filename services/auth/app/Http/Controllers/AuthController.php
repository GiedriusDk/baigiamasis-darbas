<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function register(Request $r)
    {
        $data = $r->validate([
            'name'                  => 'required|string|max:255',
            'email'                 => 'required|email|unique:users,email',
            'password'              => 'required|string|min:6|confirmed',
            'role'                  => 'nullable|string|in:user,coach', // NEW
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => bcrypt($data['password']),
        ]);

        // Priskiriame rolę (numatytai 'user')
        $roleName = $data['role'] ?? 'user';
        if ($role = Role::where('name', $roleName)->first()) {
            $user->roles()->sync([$role->id]); // vieną rolę
        }

        $token = auth()->login($user);

        // duokime roles ir per /register
        return response()->json([
            'token' => $token,
            'user'  => $user->load('roles:id,name'),
        ], 201);
    }

    public function login(Request $r)
    {
        $cred = $r->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        if (!$token = auth()->attempt($cred)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        return response()->json([
            'token' => $token,
            'user'  => auth()->user()->load('roles:id,name'),
        ]);
    }

    public function me()
    {
        return response()->json(auth()->user()->load('roles:id,name'));
    }
}