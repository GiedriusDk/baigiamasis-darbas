<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AuthProxy
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->header('Authorization');
        if (!$token) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $auth = rtrim(config('services.auth.base', env('AUTH_BASE', 'http://auth:9000')), '/');
        $res = Http::withHeaders(['Authorization' => $token])->get("$auth/api/auth/me");

        if (!$res->ok()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $request->attributes->set('auth_user', $res->json());
        return $next($request);
    }
}