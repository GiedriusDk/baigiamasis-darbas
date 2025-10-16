<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureCoach
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->attributes->get('auth_user');

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (is_object($user)) $user = (array) $user;

        $roleIds   = collect($user['roles'] ?? [])->pluck('id')->all();
        $roleNames = collect($user['roles'] ?? [])->pluck('name')->map(fn($v) => strtolower((string)$v))->all();

        $isCoach = in_array(2, $roleIds, true) || in_array('coach', $roleNames, true);

        if (!$isCoach) {
            return response()->json(['message' => 'Forbidden: coach only'], 403);
        }

        return $next($request);
    }
}