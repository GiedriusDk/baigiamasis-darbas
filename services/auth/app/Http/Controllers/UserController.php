<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /** Update first/last name (and optional avatar) */
    public function updateMe(Request $r)
    {
        $u = $r->user();

        $data = $r->validate([
            'first_name' => ['required','string','max:120'],
            'last_name'  => ['required','string','max:120'],
            'avatar_url' => ['nullable','string','max:500'],
        ]);

        $u->fill($data)->save();
        $u->load('roles:id,name');

        return response()->json([
            'id'         => $u->id,
            'email'      => $u->email,
            'first_name' => $u->first_name,
            'last_name'  => $u->last_name,
            'full_name'  => trim(($u->first_name ?? '').' '.($u->last_name ?? '')),
            'roles'      => $u->roles->map(fn($r)=>['id'=>$r->id,'name'=>$r->name]),
            'avatar_url' => $u->avatar_url ?? null,
        ]);
    }

    /** Update email (requires current password) */
    public function updateEmail(Request $r)
    {
        $u = $r->user();

        $data = $r->validate([
            'email'    => ['required','email', Rule::unique('users','email')->ignore($u->id)],
            'password' => ['required'], // current password to confirm identity
        ]);

        if (!Hash::check($data['password'], $u->password)) {
            return response()->json(['message' => 'Invalid password'], 422);
        }

        $u->email = $data['email'];
        $u->save();

        return response()->json([
            'message' => 'Email updated',
            'user'    => [
                'id'         => $u->id,
                'email'      => $u->email,
                'first_name' => $u->first_name,
                'last_name'  => $u->last_name,
                'full_name'  => trim(($u->first_name ?? '').' '.($u->last_name ?? '')),
            ],
        ]);
    }

    /** Update password (requires current password; logs out current JWT) */
    public function updatePassword(Request $r)
    {
        $u = $r->user();

        $data = $r->validate([
            'current_password' => ['required'],
            'password'         => ['required','string','min:8','confirmed'], // needs password_confirmation
        ]);

        if (!Hash::check($data['current_password'], $u->password)) {
            return response()->json(['message' => 'Current password is incorrect'], 422);
        }

        $u->password = Hash::make($data['password']);
        $u->save();

        // If JWT blacklist/invalidating is enabled, invalidate current token
        try {
            auth('api')->logout(true);
        } catch (\Throwable $e) {}

        return response()->json(['message' => 'Password updated. Please log in again.']);
    }
}