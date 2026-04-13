<?php

namespace App\Http\Middleware;

use Closure;
use Spatie\Permission\Middleware\PermissionMiddleware as SpatiePermissionMiddleware;

class PermissionMiddleware extends SpatiePermissionMiddleware
{
    public function handle($request, Closure $next, $permission, $guard = null)
    {
        if (app()->environment('local')) {
            return $next($request);
        }

        return parent::handle($request, $next, $permission, $guard);
    }
}

