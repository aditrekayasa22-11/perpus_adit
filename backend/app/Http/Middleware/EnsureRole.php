<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guard berbasis role: dipakai sebagai ->middleware('role:admin'),
 * ->middleware('role:siswa'), atau ->middleware('role:petugas,admin').
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ($roles && ! in_array($user->role, $roles, true))) {
            return new JsonResponse([
                'status'  => 'error',
                'message' => 'Anda tidak memiliki akses untuk fitur ini.',
            ], 403);
        }

        return $next($request);
    }
}
