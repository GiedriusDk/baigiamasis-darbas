<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AuthViaAuthService
{
    public function handle(Request $request, Closure $next)
    {
        \Log::info('AUTH H', ['auth' => $request->header('Authorization')]);

        // 1) Paimam token'ą
        $auth = $request->header('Authorization'); // "Bearer <token>"
        if (!$auth || !str_starts_with($auth, 'Bearer ')) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }
        $token = substr($auth, 7);

        // 2) Skambinam į AUTH servisą (/me)
        $base = rtrim(config('services.auth.base'), '/'); // pvz. http://gateway/api/auth
        $url  = $base.'/me'; // NEbe /auth/me

        $resp = Http::withToken($token)->acceptJson()->get($url);
        if ($resp->failed()) {
            return response()->json([
                'message' => $resp->json('message') ?? 'Unauthenticated.',
            ], 401);
        }

        $me = $resp->json();   // { id, name, email, roles: [...] }

        // 3) Užregistruojam user resolverį
        $request->setUserResolver(function () use ($me) {
            return (object) [
                'id'    => $me['id']    ?? null,
                'name'  => $me['name']  ?? null,
                'email' => $me['email'] ?? null,
                'roles' => $me['roles'] ?? [],
            ];
        });

        // Patogiai pasiekti visą json
        $request->attributes->set('auth_user', $me);

        return $next($request);
    }
}