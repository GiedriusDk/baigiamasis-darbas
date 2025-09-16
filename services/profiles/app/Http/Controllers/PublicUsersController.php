<?php

// services/auth/app/Http/Controllers/PublicUsersController.php
namespace App\Http\Controllers;

use App\Models\User;

class PublicUsersController extends Controller
{
    public function show($id)
    {
        $u = User::findOrFail((int)$id);
        return response()->json([
            'id'         => $u->id,
            'name'       => $u->name,
            'avatar_url' => $u->avatar_url ?? null, // jei turi
        ]);
    }
}