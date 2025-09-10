<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Configuration\Exceptions;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // jei norite – globalus arba grupinis middleware:
        // $middleware->append(\App\Http\Middleware\TrustProxies::class);

        // API grupė (palikite pagal poreikį)
        $middleware->group('api', [
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ]);

        // ČIA yra esmė: aliasai maršrutams
        $middleware->alias([
            'auth.proxy' => \App\Http\Middleware\AuthViaAuthService::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->create();