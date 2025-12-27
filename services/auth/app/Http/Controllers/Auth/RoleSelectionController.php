<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;

class RoleSelectionController extends Controller
{
    public function select(Request $r)
    {
        $data = $r->validate([
            'role' => 'required|in:user,coach',
        ]);

        $u = $r->user();

        $roleName = $data['role'];

        $role = Role::where('name', $roleName)->first();
        if (!$role) {
            return response()->json(['message' => 'Role not found'], 404);
        }

        // Jei jau turi coach (ar admin) - nekeičiam
        if ($u->roles()->whereIn('name', ['coach', 'admin'])->exists()) {
            return response()->json(['message' => 'Role already set'], 409);
        }

        // Užtikrinam, kad user role visada liktų
        $userRole = Role::where('name', 'user')->first();
        if ($userRole) {
            $u->roles()->syncWithoutDetaching([$userRole->id]);
        }

        if ($roleName === 'coach') {
            $u->roles()->syncWithoutDetaching([$role->id]);
        }

        return response()->json([
            'message' => 'Role updated',
            'roles' => $u->roles()->pluck('name')->values(),
        ]);
    }
}