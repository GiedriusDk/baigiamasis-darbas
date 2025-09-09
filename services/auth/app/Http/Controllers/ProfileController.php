<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function show(Request $r)
    {
        $user = auth()->user()->load(['roles:id,name', 'coachProfile']);
        return response()->json([
            'user'  => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->map(fn($x) => ['id'=>$x->id,'name'=>$x->name]),
            ],
            'coach' => $user->coachProfile,
        ]);
    }

    public function update(Request $r)
    {
        $user = auth()->user();

        // bazinis user name (neprivaloma)
        if ($r->filled('name')) {
            $r->validate(['name' => 'string|max:255']);
            $user->name = $r->input('name');
            $user->save();
        }

        // coach dalis: leidžiam tik jei turi 'coach' rolę
        if ($user->roles()->where('name','coach')->exists() && $r->has('coach')) {
            $payload = $r->validate([
                'coach.bio'               => 'nullable|string',
                'coach.experience_years'  => 'nullable|integer|min:0|max:100',
                'coach.price_per_session' => 'nullable|numeric|min:0|max:999999',
                'coach.specializations'   => 'nullable|array',
                'coach.specializations.*' => 'string|max:100',
                'coach.avatar_url'        => 'nullable|url|max:1024',
                'coach.city'              => 'nullable|string|max:120',
                'coach.availability_note' => 'nullable|string',
            ])['coach'];

            $user->coachProfile()->updateOrCreate(['user_id' => $user->id], $payload);
        }

        $user->load(['roles:id,name', 'coachProfile']);
        return response()->json([
            'user'  => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->map(fn($x) => ['id'=>$x->id,'name'=>$x->name]),
            ],
            'coach' => $user->coachProfile,
        ]);
    }
}