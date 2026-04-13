<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\User;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        // 'App\Models\Model' => 'App\Policies\ModelPolicy',
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        // Implicitly grant "Super Admin" role all permissions
        // This works for Spatie Permissions
        Gate::before(function ($user, $ability) {
            if (app()->environment('local')) {
                return true;
            }
            return $user->hasRole('superadmin') ? true : null;
        });

        Gate::define('manage-system-settings', function (User $user) {
            return $user->role === 'superadmin';
        });
    }
}

