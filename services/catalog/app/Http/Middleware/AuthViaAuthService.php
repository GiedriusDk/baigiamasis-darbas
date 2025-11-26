<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AuthViaAuthService
{
    public function handle(Request $request, Closure $next, ...$requiredRoles)
    {
        $auth = $request->headers->get('Authorization');
        if (!$auth || !str_starts_with($auth, 'Bearer ')) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }
        $base = rtrim(config('services.auth.base'), '/');
        $url  = $base . '/me';

        try {
            $res = Http::withHeaders(['Authorization' => $auth])
                ->acceptJson()
                ->timeout((int) config('services.auth.timeout', 5))
                ->get($url);

            if (!$res->ok()) {
                return response()->json(['message' => $res->json('message') ?? 'Unauthenticated.'], 401);
            }

            $payload = $res->json();
            $user    = $payload['user'] ?? $payload;

            $request->attributes->set('auth_user', $user);
            $request->setUserResolver(fn () => (object) $user);

            if (!empty($requiredRoles)) {
                $names = collect($user['roles'] ?? [])
                    ->map(function ($r) {
                        if (is_array($r))  return strtolower((string)($r['name'] ?? ''));
                        if (is_object($r)) return strtolower((string)($r->name ?? ''));
                        return strtolower((string)$r);
                    })
                    ->filter()
                    ->values()
                    ->all();

                $required = collect($requiredRoles)->map(fn($v) => strtolower((string)$v))->all();

                $ok = collect($required)->intersect($names)->isNotEmpty();
                if (!$ok) {
                    return response()->json(['message' => 'Forbidden: insufficient role'], 403);
                }
            }

            return $next($request);

        } catch (\Throwable $e) {
            report($e);
            return response()->json(['message' => 'Auth service unavailable'], 502);
        }
    }
}