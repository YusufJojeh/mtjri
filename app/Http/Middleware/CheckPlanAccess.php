<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Plan;
use App\Models\User;

class CheckPlanAccess
{
    public function handle(Request $request, Closure $next)
    {
        if (app()->environment('local')) {
            return $next($request);
        }

        $user = auth()->user();
        
        if (!$user) {
            return $next($request);
        }

        // Super admin has full access
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        // Only company users need plan checks
        if ($user->type !== 'company') {
            $company = User::find($user->created_by);
            if ($company && $company->type === 'company' && $company->isPlanExpired()) {
                auth()->logout();
                return redirect()->route('login')->with('error', __('Access denied. Only company users can access this area.'));
            }
        }

        // Check if registration is complete but checkout is not completed
        $registrationComplete = false;
        $step3Complete = session('registration_step_3_complete', false);
        
        // If session variable is missing, check database for store with theme (indicates step 3 complete)
        if (!$step3Complete) {
            $hasStoreWithTheme = \App\Models\Store::where('user_id', $user->id)
                ->whereNotNull('theme')
                ->where('theme', '!=', '')
                ->exists();
            
            if ($hasStoreWithTheme) {
                $registrationComplete = true;
                // Restore session for consistency
                session(['registration_step_3_complete' => true, 'registration_complete' => true]);
            }
        } else {
            $registrationComplete = true;
        }
        
        // If registration is complete but checkout is not (no active plan)
        if ($registrationComplete && (!$user->plan_is_active || $user->plan_is_active == 0)) {
            // Allow access to plans page and registration routes
            $allowedRoutes = ['plans.index', 'register', 'login', 'register.stepper.index', 'register.stepper.step1', 'register.stepper.step2', 'register.stepper.step3', 'register.stepper.check-completion', 'register.stepper.content-status', 'plans.request', 'plans.subscribe', 'coupons.validate', 'stripe.payment', 'paypal.payment.web', 'bank.payment.web', 'paystack.payment', 'flutterwave.payment'];
            $routeName = $request->route() ? $request->route()->getName() : null;
            
            if ($routeName && in_array($routeName, $allowedRoutes)) {
                return $next($request);
            }
            
            // Prevent redirect and show toaster message
            return redirect()->route('plans.index')->with('error', __('Complete your checkout'));
        }

        // Check if user needs plan subscription
        if ($user->needsPlanSubscription()) {
            // Check if a free plan exists
            $freePlan = Plan::where('price', 0)
                ->where(function($query) {
                    $query->whereNull('yearly_price')
                        ->orWhere('yearly_price', 0);
                })
                ->where('is_plan_enable', 'on')
                ->first();
            
            // Allow access to plans page, registration, and login pages
            $allowedRoutes = ['plans.index', 'register', 'login', 'register.stepper.index', 'register.stepper.step1', 'register.stepper.step2', 'register.stepper.step3', 'register.stepper.check-completion', 'register.stepper.content-status'];
            $routeName = $request->route() ? $request->route()->getName() : null;
            
            if ($routeName && in_array($routeName, $allowedRoutes)) {
                return $next($request);
            }
            
            // If no free plan exists and user has no plan, block access
            if (!$freePlan && !$user->plan_id) {
                $message = __('You must subscribe to a plan to continue. No free plan is available.');
                return redirect()->route('plans.index')->with('error', $message);
            }
            
            $message = __('Please subscribe to a plan to continue.');
            
            if ($user->isTrialExpired()) {
                $message = __('Your trial period has expired. Please subscribe to a plan to continue.');
                // Assign default plan instead of null
                $defaultPlan = Plan::getDefaultPlan();
                $user->update([
                    'plan_id' => $defaultPlan ? $defaultPlan->id : null,
                    'is_trial' => 0,
                    'trial_expire_date' => null,
                    'plan_is_active' => $defaultPlan ? 1 : 0
                ]);
            } elseif ($user->isPlanExpired()) {
                $message = __('Your plan has expired. Please renew your subscription.');
                // Assign default plan instead of null
                $defaultPlan = Plan::getDefaultPlan();
                $user->update([
                    'plan_id' => $defaultPlan ? $defaultPlan->id : null,
                    'plan_expire_date' => null,
                    'plan_is_active' => $defaultPlan ? 1 : 0
                ]);
            }
            
            return redirect()->route('plans.index')->with('error', $message);
        }

        return $next($request);
    }
    
    /**
     * Check if user can create a new store
     */
    public static function checkStoreLimit($user)
    {
        if (app()->environment('local')) {
            return ['allowed' => true];
        }

        if (!$user->plan) {
            return ['allowed' => false, 'message' => __('No active plan found.')];
        }
        
        $currentStores = $user->stores()->count();
        $maxStores = $user->plan->max_stores ?? $user->plan->business ?? 0;
        
        if ($currentStores >= $maxStores) {
            return [
                'allowed' => false, 
                'message' => __('You have reached your store limit (:current/:max). Please upgrade your plan.', [
                    'current' => $currentStores,
                    'max' => $maxStores
                ])
            ];
        }
        
        return ['allowed' => true];
    }
    
    /**
     * Check if user can create more AI stores
     */
    public static function checkAIStoreLimit($user)
    {
        if (app()->environment('local')) {
            return ['allowed' => true];
        }

        $aiStoresCount = $user->ai_stores_count ?? 0;
        $maxAIStores = 3; // Maximum 3 AI stores per user

        if ($aiStoresCount >= $maxAIStores) {
            return [
                'allowed' => false,
                'message' => __('You have reached your AI store creation limit (:current/:max). You cannot create more stores using AI.', [
                    'current' => $aiStoresCount,
                    'max' => $maxAIStores
                ])
            ];
        }

        return ['allowed' => true];
    }
    
    /**
     * Check if user can add more users to a store
     */
    public static function checkUserLimit($user, $storeId)
    {
        if (app()->environment('local')) {
            return ['allowed' => true];
        }

        if (!$user->plan) {
            return ['allowed' => false, 'message' => __('No active plan found.')];
        }
        
        // Count users excluding company users (type = 'company')
        $currentUsers = \App\Models\User::where('current_store', $storeId)
            ->where('type', '!=', 'company')
            ->count();
        $maxUsers = $user->plan->max_users_per_store ?? $user->plan->max_users ?? 0;
        
        if ($currentUsers >= $maxUsers) {
            return [
                'allowed' => false,
                'message' => __('You have reached your user limit for this store (:current/:max). Please upgrade your plan.', [
                    'current' => $currentUsers,
                    'max' => $maxUsers
                ])
            ];
        }
        
        return ['allowed' => true];
    }
    
    /**
     * Check if user can add more products to a store
     */
    public static function checkProductLimit($user, $storeId)
    {
        if (app()->environment('local')) {
            return ['allowed' => true];
        }

        if (!$user->plan) {
            return ['allowed' => false, 'message' => __('No active plan found.')];
        }
        
        $currentProducts = \App\Models\Product::where('store_id', $storeId)->count();
        $maxProducts = $user->plan->max_products_per_store ?? 0;
        
        if ($maxProducts > 0 && $currentProducts >= $maxProducts) {
            return [
                'allowed' => false,
                'message' => __('You have reached your product limit for this store (:current/:max). Please upgrade your plan.', [
                    'current' => $currentProducts,
                    'max' => $maxProducts
                ])
            ];
        }
        
        return ['allowed' => true];
    }
    
    /**
     * Check if user has access to a specific feature
     */
    public static function checkFeatureAccess($user, $feature)
    {
        if (app()->environment('local')) {
            return ['allowed' => true];
        }

        if (!$user->plan) {
            return ['allowed' => false, 'message' => __('No active plan found.')];
        }
        
        $featureMap = [
            'blog' => 'enable_blog',
            'custom_pages' => 'enable_custom_pages',
            'shipping_method' => 'enable_shipping_method'
        ];
        
        if (!isset($featureMap[$feature])) {
            return ['allowed' => true]; // Unknown feature, allow by default
        }
        
        $planFeature = $featureMap[$feature];
        $isEnabled = $user->plan->$planFeature === 'on';
        
        if (!$isEnabled) {
            return [
                'allowed' => false,
                'message' => __('This feature is not included in your current plan. Please upgrade to access :feature.', [
                    'feature' => ucfirst(str_replace('_', ' ', $feature))
                ])
            ];
        }
        
        return ['allowed' => true];
    }
}