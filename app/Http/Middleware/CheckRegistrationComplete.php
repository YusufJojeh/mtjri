<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRegistrationComplete
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();
        
        // Only check for company users
        if ($user && $user->type === 'company') {
            // Check session variables first
            $step1Complete = session('registration_step_1_complete', false);
            $step2Complete = session('registration_step_2_complete', false);
            $step3Complete = session('registration_step_3_complete', false);
            
            // If session variables are missing, check database to see if registration is actually complete
            if (!($step1Complete && $step2Complete && $step3Complete)) {
                // Check if user has at least one store with a theme set (indicates step 3 is complete)
                $hasStoreWithTheme = $user->stores()
                    ->whereNotNull('theme')
                    ->where('theme', '!=', '')
                    ->exists();
                
                if ($hasStoreWithTheme) {
                    // User has completed registration, restore session variables
                    $store = $user->stores()->whereNotNull('theme')->where('theme', '!=', '')->first();
                    session([
                        'registration_step_1_complete' => true,
                        'registration_step_2_complete' => true,
                        'registration_step_3_complete' => true,
                        'registration_complete' => true,
                        'registration_store_id' => $store->id,
                    ]);
                } else {
                    // User hasn't completed registration
                    return redirect()->route('dashboard')
                        ->with('error', __('Please complete the registration process before accessing this page.'));
                }
            }
        }
        
        return $next($request);
    }
}

