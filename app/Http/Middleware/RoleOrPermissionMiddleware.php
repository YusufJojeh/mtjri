<?php

namespace App\Http\Middleware;

use Closure;
use Spatie\Permission\Middleware\RoleOrPermissionMiddleware as SpatieRoleOrPermissionMiddleware;

class RoleOrPermissionMiddleware extends SpatieRoleOrPermissionMiddleware
{
    public function handle($request, Closure $next, $roleOrPermission, $guard = null)
    {
        if (app()->environment('local')) {
            return $next($request);
        }

        return parent::handle($request, $next, $roleOrPermission, $guard);
    }
}

