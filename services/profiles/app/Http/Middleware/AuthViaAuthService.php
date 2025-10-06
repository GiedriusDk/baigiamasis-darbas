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

        $auth = $request->header('Authorization');
        if (!$auth || !str_starts_with($auth, 'Bearer ')) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }
        $token = substr($auth, 7);

        $base = rtrim(config('services.auth.base'), '/');
        $url  = $base.'/me';

        $resp = Http::withToken($token)->acceptJson()->get($url);
        if ($resp->failed()) {
            return response()->json([
                'message' => $resp->json('message') ?? 'Unauthenticated.',
            ], 401);
        }

        $me = $resp->json();  

        $request->setUserResolver(function () use ($me) {
            return (object) [
                'id'    => $me['id']    ?? null,
                'name'  => $me['name']  ?? null,
                'email' => $me['email'] ?? null,
                'roles' => $me['roles'] ?? [],
            ];
        });

        $request->attributes->set('auth_user', $me);

        return $next($request);
    }
}