<?php

namespace App\Http\Middleware;

use Closure;

class RoleMiddleware
{
    public function handle($request, Closure $next, ...$roles)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        if (!$user->hasAnyRole($roles)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        return $next($request);
    }
}