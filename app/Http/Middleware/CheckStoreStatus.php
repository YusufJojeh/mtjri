<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Store;
use App\Models\StoreConfiguration;
use Inertia\Inertia;

class CheckStoreStatus
{
    public function handle(Request $request, Closure $next)
    {
        // Get store from route parameter
        $storeSlug = $request->route('storeSlug');
        
        if ($storeSlug) {
            $store = Store::where('slug', $storeSlug)->first();
            
            if ($store) {
                $config = StoreConfiguration::getConfiguration($store->id);
                
                // Check if store is disabled
                if (!($config['store_status'] ?? true)) {
                    return Inertia::render('store/StoreDisabled', [
                        'store' => $store
                    ])->toResponse($request)->setStatusCode(503);
                }
                
                // Check if store is in maintenance mode
                if ($config['maintenance_mode'] ?? false) {
                    return Inertia::render('store/StoreMaintenance', [
                        'store' => $store
                    ])->toResponse($request)->setStatusCode(503);
                }
            }
        }
        
        return $next($request);
    }
}