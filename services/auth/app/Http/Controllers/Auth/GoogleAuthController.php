<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Tymon\JWTAuth\Facades\JWTAuth;
use App\Models\Role;

class GoogleAuthController extends Controller
{
    public function redirect()
    {
        $url = Socialite::driver('google')
            ->stateless()
            ->redirect()
            ->getTargetUrl();

        return response()->json(['url' => $url]);
    }

    public function callback()
    {
        $g = Socialite::driver('google')->stateless()->user();

        $fullName = trim((string) $g->getName());
        $parts = preg_split('/\s+/', $fullName, -1, PREG_SPLIT_NO_EMPTY);

        $firstName = $parts[0] ?? 'Google';
        $lastName  = count($parts) > 1 ? implode(' ', array_slice($parts, 1)) : 'User';

        $user = User::where('google_id', $g->getId())->first();

        if (!$user && $g->getEmail()) {
            $user = User::where('email', $g->getEmail())->first();
        }

        if (!$user) {
            $user = User::create([
                'first_name' => $firstName,
                'last_name'  => $lastName,
                'email'      => $g->getEmail(),
                'password'   => bcrypt(Str::random(32)),
                'google_id'  => $g->getId(),
                'avatar'     => $g->getAvatar(),
            ]);
        } else {
            if (!$user->google_id) {
                $user->google_id = $g->getId();
            }

            if (!$user->first_name) {
                $user->first_name = $firstName;
            }

            if (!$user->last_name) {
                $user->last_name = $lastName;
            }

            if ($g->getAvatar()) {
                $user->avatar = $g->getAvatar();
            }

            $user->save();
        }

        if ($user->roles()->count() === 0) {
            $defaultRole = Role::where('name', 'user')->first();
            if ($defaultRole) {
                $user->roles()->syncWithoutDetaching([$defaultRole->id]);
            }
        }

        $token = JWTAuth::fromUser($user);

        $front = rtrim(config('app.frontend_url', env('FRONTEND_URL')), '/');

        return redirect()->away($front . '/oauth/callback?token=' . urlencode($token));
    }
}