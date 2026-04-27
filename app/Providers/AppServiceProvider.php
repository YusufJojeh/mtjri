<?php

namespace App\Providers;

use App\Models\User;
use App\Models\Plan;
use App\Observers\UserObserver;
use App\Observers\PlanObserver;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(\App\Services\WebhookService::class);
        $this->app->singleton(\App\Services\AIProviderManager::class);
        $this->app->singleton(\App\Services\AIOrchestratorService::class);
        $this->app->bind(\App\Contracts\OpenAIContentGenerator::class, \App\Services\OpenAIContentGeneratorService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Avoid <link rel="preload" as="style"> for Vite CSS: Chrome warns when preload is not
        // matched to a stylesheet quickly enough; stylesheet tags alone are sufficient.
        // Laravel may pass null for $src / $chunk when resolving CSS chunks from the manifest.
        Vite::usePreloadTagAttributes(function (?string $src, ?string $url, ?array $chunk, ?array $manifest) {
            if ($url === null || $url === '') {
                return [];
            }

            return Str::of($url)->before('?')->endsWith('.css') ? false : [];
        });

        // Register the UserObserver
        User::observe(UserObserver::class);
        
        // Register the PlanObserver
        Plan::observe(PlanObserver::class);
        


        // Configure dynamic storage disks
        try {
            \App\Services\DynamicStorageService::configureDynamicDisks();
        } catch (\Exception $e) {
            // Silently fail during migrations or when database is not ready
        }
    }
}
