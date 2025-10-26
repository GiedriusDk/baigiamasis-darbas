<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    private function userResource(User $u): array
    {
        $u->loadMissing('roles:id,name');

        return [
            'id'         => $u->id,
            'email'      => $u->email,
            'first_name' => $u->first_name,
            'last_name'  => $u->last_name,
            'full_name'  => trim(($u->first_name ?? '').' '.($u->last_name ?? '')),
            'roles'      => $u->roles->map(fn($r) => ['id' => $r->id, 'name' => $r->name])->all(),
        ];
    }

    public function register(Request $r)
    {
        $data = $r->validate([
            'first_name' => ['required','string','max:120'],
            'last_name'  => ['required','string','max:120'],
            'email'      => ['required','email','unique:users,email'],
            'password'   => ['required','string','min:8','confirmed'],
            'role'       => ['nullable','in:user,coach'],
        ]);

        $user = User::create([
            'first_name' => $data['first_name'],
            'last_name'  => $data['last_name'],
            'email'      => $data['email'],
            'password'   => bcrypt($data['password']),
        ]);

        $roleName = $data['role'] ?? 'user';
        if ($role = Role::where('name', $roleName)->first()) {
            $user->roles()->sync([$role->id]); 
        }

        $token = auth('api')->login($user);

        return response()->json([
            'token' => $token,
            'user'  => $this->userResource($user),
        ], 201);
    }

    public function login(Request $r)
    {
        $cred = $r->validate([
            'email'    => ['required','email'],
            'password' => ['required','string'],
        ]);

        if (!$token = auth('api')->attempt($cred)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        /** @var \App\Models\User $me */
        $me = auth('api')->user();

        return response()->json([
            'token' => $token,
            'user'  => $this->userResource($me),
        ]);
    }

    public function me(Request $r)
    {
        /** @var \App\Models\User $me */
        $me = $r->user(); // guard 'api'
        return response()->json($this->userResource($me));
    }
}