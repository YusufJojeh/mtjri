<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LocalBypassMiddleware
{
    public function handle(Request $request, Closure $next, ...$args): Response
    {
        if (app()->environment('local')) {
            return $next($request);
        }

        // If not local, we need to decide what to do.
        // This middleware is meant to be a wrapper OR a replacement.
        return $next($request);
    }
}

