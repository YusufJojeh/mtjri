<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Store;

class DomainResolver
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        // Skip during installation
        if (!$request->is('install/*') && !$request->is('update/*') && file_exists(storage_path('installed'))) {
            $host = $request->getHost();
            $store = null;
            
            // Check for custom domain first
            $store = Store::where('custom_domain', $host)
                        ->where('enable_custom_domain', true)
                        ->where('is_active', true)
                        ->first();
            
            // Check for custom subdomain if no custom domain found
            if (!$store && str_contains($host, '.')) {
                $subdomain = explode('.', $host)[0];
                $store = Store::where('custom_subdomain', $subdomain)
                            ->where('enable_custom_subdomain', true)
                            ->where('is_active', true)
                            ->first();
            }
            
            if ($store) {
                // Set store context
                $request->attributes->set('resolved_store', $store);
                $request->attributes->set('store_theme', $store->theme);

                // For API requests, add store_id to request
                if ($request->is('api/*')) {
                    $request->merge(['store_id' => $store->id]);
                }
                // For web requests, redirect to store home ONLY for landing/public pages
                // Do NOT redirect admin panel routes (dashboard, analytics, settings, etc.)
                elseif (!$request->is('store/*') && ($request->is('/') || $request->is('welcome') || $request->is('plans') || $request->is('pricing'))) {
                    return redirect()->route('store.home', ['storeSlug' => $store->slug]);
                }
                // For admin panel routes: just set context, don't redirect
            }
        }
        return $next($request);
    }
}