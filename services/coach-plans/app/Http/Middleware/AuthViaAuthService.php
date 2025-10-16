<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AuthViaAuthService
{
    public function handle(Request $request, Closure $next)
    {
        $auth = $request->headers->get('Authorization');
        if (!$auth || !str_starts_with($auth, 'Bearer ')) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $base = rtrim(config('services.auth.base'), '/');

        try {
            $res = Http::withHeaders(['Authorization' => $auth])
                ->acceptJson()
                ->get($base . '/me');

            if (!$res->ok()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            $payload = $res->json();

            $user = $payload['user'] ?? $payload;

            $request->attributes->set('auth_user', $user);
            $request->setUserResolver(fn () => (object) $user);

            return $next($request);
        } catch (\Throwable $e) {
            report($e);
            return response()->json(['message' => 'Auth service unavailable'], 502);
        }
    }
}