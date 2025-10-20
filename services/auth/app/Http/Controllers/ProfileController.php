<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function show(Request $r)
    {
        $u = auth()->user()->load(['roles:id,name', 'coachProfile']);

        return response()->json([
            'user'  => [
                'id'         => $u->id,
                'email'      => $u->email,
                'first_name' => $u->first_name,
                'last_name'  => $u->last_name,
                'full_name'  => trim(($u->first_name ?? '').' '.($u->last_name ?? '')),
                'roles'      => $u->roles->map(fn($x) => ['id'=>$x->id,'name'=>$x->name]),
            ],
            'coach' => $u->coachProfile,
        ]);
    }

    public function update(Request $r)
    {
        $u = auth()->user();

        $data = $r->validate([
            'first_name' => 'nullable|string|max:120',
            'last_name'  => 'nullable|string|max:120',
            'email'      => 'nullable|email|unique:users,email,'.$u->id,
            'coach.bio'               => 'nullable|string',
            'coach.experience_years'  => 'nullable|integer|min:0|max:100',
            'coach.price_per_session' => 'nullable|numeric|min:0|max:999999',
            'coach.specializations'   => 'nullable|array',
            'coach.specializations.*' => 'string|max:100',
            'coach.avatar_url'        => 'nullable|url|max:1024',
            'coach.city'              => 'nullable|string|max:120',
            'coach.availability_note' => 'nullable|string',
        ]);

        if (array_key_exists('first_name', $data)) $u->first_name = $data['first_name'];
        if (array_key_exists('last_name',  $data)) $u->last_name  = $data['last_name'];
        if (array_key_exists('email',      $data)) $u->email      = $data['email'];
        if ($u->isDirty()) $u->save();

        if ($u->roles()->where('name','coach')->exists() && array_key_exists('coach', $data)) {
            $u->coachProfile()->updateOrCreate(['user_id' => $u->id], $data['coach']);
        }

        $u->load(['roles:id,name', 'coachProfile']);
        return response()->json([
            'user'  => [
                'id'         => $u->id,
                'email'      => $u->email,
                'first_name' => $u->first_name,
                'last_name'  => $u->last_name,
                'full_name'  => trim(($u->first_name ?? '').' '.($u->last_name ?? '')),
                'roles'      => $u->roles->map(fn($x) => ['id'=>$x->id,'name'=>$x->name]),
            ],
            'coach' => $u->coachProfile,
        ]);
    }
}