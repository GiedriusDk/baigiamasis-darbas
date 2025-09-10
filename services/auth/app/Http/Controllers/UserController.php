<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class UserController extends Controller
{
    public function updateMe(Request $r)
    {
        $u = $r->user();
        $data = $r->validate([
            'name'       => 'required|string|max:120',
            'avatar_url' => 'nullable|string|max:500',
        ]);
        $u->fill($data)->save();

        $u->load('roles');
        return response()->json([
            'id'    => $u->id,
            'name'  => $u->name,
            'email' => $u->email,
            'roles' => $u->roles->map(fn($r)=>['id'=>$r->id,'name'=>$r->name]),
            'avatar_url' => $u->avatar_url ?? null,
        ]);
    }
}