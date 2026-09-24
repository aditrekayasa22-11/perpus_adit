<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Aplikasi ini murni API (tanpa route "login" web), jadi request yang
        // belum login tidak boleh di-redirect → biarkan jadi JSON 401.
        $middleware->redirectGuestsTo(function () {
            return request()->is('api/*') ? null : url('/');
        });

        // Guard role: ->middleware('role:admin') / 'role:petugas,admin'
        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Request API yang belum login → selalu balas JSON 401
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson()
        );

        // Pesan 401 dalam Bahasa Indonesia
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Anda belum login. Silakan login terlebih dahulu.',
                ], 401);
            }
        });
    })->create();
