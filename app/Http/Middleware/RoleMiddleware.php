<?php

namespace App\Http\Middleware;

use Closure;
use Spatie\Permission\Middleware\RoleMiddleware as SpatieRoleMiddleware;

class RoleMiddleware extends SpatieRoleMiddleware
{
    public function handle($request, Closure $next, $role, $guard = null)
    {
        if (app()->environment('local')) {
            return $next($request);
        }

        return parent::handle($request, $next, $role, $guard);
    }
}

