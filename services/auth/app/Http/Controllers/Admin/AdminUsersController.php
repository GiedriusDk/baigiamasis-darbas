<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Http\Request;
use App\Models\User;

class AdminUsersController extends EnsureAdminController
{
    protected function transformUser(User $u): array
    {
        return [
            'id'         => $u->id,
            'first_name' => $u->first_name,
            'last_name'  => $u->last_name,
            'email'      => $u->email,
            'roles'      => $u->roles->pluck('name'),
            'created_at' => $u->created_at,
        ];
    }

    public function index(Request $request)
    {
        $this->ensureAdmin($request);

        $users = User::with('roles:id,name')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'data' => $users->map(fn(User $u) => $this->transformUser($u)),
        ]);
    }

    public function show(Request $request, int $id)
    {
        $this->ensureAdmin($request);

        $user = User::with('roles:id,name')->findOrFail($id);

        return response()->json($this->transformUser($user));
    }

    public function update(Request $request, int $id)
    {
        $this->ensureAdmin($request);

        $user = User::with('roles:id,name')->findOrFail($id);

        $data = $request->validate([
            'first_name' => 'nullable|string|max:120',
            'last_name'  => 'nullable|string|max:120',
            'email'      => 'nullable|email|max:190|unique:users,email,' . $user->id,
            'roles'      => 'nullable|array',
            'roles.*'    => 'string',
        ]);

        if (array_key_exists('first_name', $data)) {
            $user->first_name = $data['first_name'];
        }
        if (array_key_exists('last_name', $data)) {
            $user->last_name = $data['last_name'];
        }
        if (array_key_exists('email', $data)) {
            $user->email = $data['email'];
        }
        $user->save();

        if (array_key_exists('roles', $data)) {
            $roleIds = \App\Models\Role::whereIn('name', $data['roles'])->pluck('id');
            $user->roles()->sync($roleIds);
        }

        $user->load('roles:id,name');

        return response()->json($this->transformUser($user));
    }

    public function destroy(Request $request, int $id)
    {
        $this->ensureAdmin($request);

        $user = User::findOrFail($id);

        if ($request->user()->id === $user->id) {
            return response()->json(['message' => 'Cannot delete yourself'], 422);
        }

        $user->delete();

        return response()->json(['ok' => true]);
    }
}