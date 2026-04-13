<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;
use App\Jobs\GenerateStoreContentJob;
use Illuminate\Support\Facades\Log;

class RegistrationStepperController extends Controller
{
    /**
     * Show the registration stepper page
     */
    public function index(Request $request): Response
    {
        $referralCode = $request->get('ref');
        $encryptedPlanId = $request->get('plan');
        $planId = null;
        $referrer = null;

        // Decrypt and validate plan ID
        if ($encryptedPlanId) {
            $planId = $this->decryptPlanId($encryptedPlanId);
            if ($planId && !\App\Models\Plan::find($planId)) {
                $planId = null; // Invalid plan ID
            }
        }

        if ($referralCode) {
            $referrer = User::where('referral_code', $referralCode)
                ->where('type', 'company')
                ->first();
        }

        $user = Auth::user();
        $store = null;
        $availableThemes = null;
        $planPermissions = null;
        $currentStep = 1;

        if ($user) {
            // Check which step user is on
            $step1Complete = session('registration_step_1_complete', false);
            $step2Complete = session('registration_step_2_complete', false);
            $step3Complete = session('registration_step_3_complete', false);
            $storeId = session('registration_store_id');

            if ($step1Complete && $storeId) {
                $store = Store::find($storeId);
                if ($store) {
                    $planUser = $user->type === 'company' ? $user : ($user->creator ?? $user);
                    $availableThemes = $planUser->getAvailableThemes();

                    $plan = $planUser->getCurrentPlan();
                    $planPermissions = [
                        'enable_custdomain' => $plan ? $plan->enable_custdomain === 'on' : false,
                        'enable_custsubdomain' => $plan ? $plan->enable_custsubdomain === 'on' : false,
                    ];

                    if ($step2Complete) {
                        $currentStep = 3;
                    } else {
                        $currentStep = 2;
                    }
                }
            }
        }

        return Inertia::render('auth/register-stepper', [
            'referralCode' => $referralCode,
            'planId' => $planId,
            'referrer' => $referrer ? $referrer->name : null,
            'store' => $store,
            'availableThemes' => $availableThemes,
            'planPermissions' => $planPermissions,
            'currentStep' => $currentStep,
            'settings' => settings(),
        ]);
    }

    /**
     * Handle Step 1: Register and create store
     */
    public function step1(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:users',
            'password' => ['required', 'confirmed', \Illuminate\Validation\Rules\Password::defaults()],
            'terms' => 'required|accepted',
        ]);

        // Get the plan (either from request or default)
        $planId = $request->plan_id;
        if (!$planId) {
            $defaultPlan = \App\Models\Plan::getDefaultPlan();
            $planId = $defaultPlan ? $defaultPlan->id : null;
        }

        $userData = [
            'name' => $request->name,
            'email' => $request->email,
            'password' => \Illuminate\Support\Facades\Hash::make($request->password),
            'type' => 'company',
            'is_active' => 1,
            'is_enable_login' => 1,
            'created_by' => 0,
            'plan_is_active' => 1,
            'plan_id' => $planId,
        ];

        // Handle referral code
        if ($request->referral_code) {
            $referrer = User::where('referral_code', $request->referral_code)
                ->where('type', 'company')
                ->first();

            if ($referrer) {
                $userData['used_referral_code'] = $request->referral_code;
            }
        }

        $user = User::create($userData);

        // Assign role and settings to the user
        defaultRoleAndSetting($user);

        // Check if email verification is enabled
        $emailVerificationEnabled = getSetting('emailVerification', false);

        // Login the user
        Auth::login($user);

        // Get the store that was created automatically
        $store = Store::where('user_id', $user->id)->first();

        if (!$store) {
            return back()->withErrors(['error' => 'Failed to create store. Please try again.']);
        }

        // Refresh store to ensure we have all fields
        $store->refresh();

        // Ensure store has name and slug (should be set by User model, but double-check)
        if (empty($store->name)) {
            $store->name = $user->name . "'s Store";
            $store->save();
        }
        if (empty($store->slug)) {
            $store->slug = Store::generateUniqueSlug($store->name);
            $store->save();
        }

        // Store step completion in session
        session([
            'registration_step_1_complete' => true,
            'registration_store_id' => $store->id,
        ]);

        // If email verification is enabled
        if ($emailVerificationEnabled) {
            \Illuminate\Auth\Events\Registered::dispatch($user);
            // Continue with stepper - verification can happen later
        }

        // Get plan permissions for Step 2
        $planUser = $user->type === 'company' ? $user : ($user->creator ?? $user);
        $availableThemes = $planUser->getAvailableThemes();
        $plan = $planUser->getCurrentPlan();
        $planPermissions = [
            'enable_custdomain' => $plan ? $plan->enable_custdomain === 'on' : false,
            'enable_custsubdomain' => $plan ? $plan->enable_custsubdomain === 'on' : false,
        ];

        // Return JSON response (not Inertia) to prevent page navigation
        // Frontend will handle updating the stepper state client-side
        return response()->json([
            'success' => true,
            'message' => 'Registration successful',
            'store' => [
                'id' => $store->id,
                'name' => $store->name,
                'slug' => $store->slug,
                'description' => $store->description,
                'email' => $store->email,
                'theme' => $store->theme,
                'enable_custom_domain' => $store->enable_custom_domain,
                'enable_custom_subdomain' => $store->enable_custom_subdomain,
                'custom_domain' => $store->custom_domain,
                'custom_subdomain' => $store->custom_subdomain,
            ],
            'availableThemes' => $availableThemes,
            'planPermissions' => $planPermissions,
        ]);
    }

    /**
     * Handle Step 2: Update store information
     */
    public function step2(Request $request)
    {
        $user = Auth::user();
        $storeId = session('registration_store_id');

        if (!$storeId) {
            return back()->withErrors(['error' => 'Store not found. Please start from Step 1.']);
        }

        $store = Store::where('id', $storeId)
            ->where('user_id', $user->id)
            ->firstOrFail();

        // Validate theme against user's plan
        $availableThemes = $user->getAvailableThemes();
        $themeValidation = 'required|string';
        if ($availableThemes !== null) {
            $themeValidation .= '|in:' . implode(',', $availableThemes);
        }

        $validator = Validator::make($request->all(), [
            'name_ar' => 'nullable|string|max:255',
            'name_en' => 'required|string|max:255', // name_en is required as it will be used for slug
            'industry' => 'nullable|string|max:255',
            'logo' => 'nullable|image|max:2048', // Max 2MB, adjust as needed
            'color' => 'nullable|string|max:7', // Hex color code e.g., #RRGGBB
            'pay_with_whatsapp' => 'boolean',
            'whatsapp_number' => ['nullable', 'string', 'max:20', 'required_if:pay_with_whatsapp,true'],
            'description' => 'nullable|string',
            'email' => 'nullable|email|max:255',
            'enable_custom_domain' => 'boolean',
            'enable_custom_subdomain' => 'boolean',
            'custom_domain' => 'nullable|string|max:255',
            'custom_subdomain' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        // Validate plan permissions for domain features
        $plan = $user->getCurrentPlan();
        if ($request->enable_custom_domain && (!$plan || $plan->enable_custdomain !== 'on')) {
            return back()->withErrors(['error' => 'Custom domain feature is not available in your current plan.']);
        }
        if ($request->enable_custom_subdomain && (!$plan || $plan->enable_custsubdomain !== 'on')) {
            return back()->withErrors(['error' => 'Custom subdomain feature is not available in your current plan.']);
        }

        // Ensure only one domain type is enabled
        if ($request->enable_custom_domain && $request->enable_custom_subdomain) {
            return back()->withErrors(['error' => 'You can enable either Custom Domain or Custom Subdomain, not both.']);
        }

        $store->name_ar = $request->name_ar;
        $store->name_en = $request->name_en;
        $store->name = $request->name_en; // Populate legacy name field with English name
        $store->slug = Store::generateUniqueSlug($request->name_en); // Auto-generate slug from English name
        $store->industry = $request->industry;

        // Handle logo upload
        if ($request->hasFile('logo')) {
            $logoPath = $request->file('logo')->store('stores/logos', 'public');
            $store->logo = $logoPath;
        }

        $store->color = $request->color;
        $store->pay_with_whatsapp = $request->pay_with_whatsapp ?? false;
        $store->whatsapp_number = $request->pay_with_whatsapp ? $request->whatsapp_number : null;

        $store->description = $request->description;
        $store->email = $request->email ?? $store->email;
        $store->enable_custom_domain = $request->enable_custom_domain ?? false;
        $store->enable_custom_subdomain = $request->enable_custom_subdomain ?? false;
        $store->custom_domain = $request->enable_custom_domain ? $request->custom_domain : null;
        $store->custom_subdomain = $request->enable_custom_subdomain ? $request->custom_subdomain : null;
        $store->save();

        // If WhatsApp number is provided, configure payment settings for ALL user stores
        if ($request->pay_with_whatsapp && $request->whatsapp_number) {
            $userStores = Store::where('user_id', $user->id)->get();
            
            foreach ($userStores as $userStore) {
                // Enable WhatsApp payment
                updatePaymentSetting('is_whatsapp_enabled', '1', $user->id, $userStore->id);
                // Set WhatsApp phone number
                updatePaymentSetting('whatsapp_number', $request->whatsapp_number, $user->id, $userStore->id);
            }
        }

        // Mark step 2 as complete
        session(['registration_step_2_complete' => true]);

        // Get updated store and permissions
        $store->refresh();
        $planUser = $user->type === 'company' ? $user : ($user->creator ?? $user);
        $plan = $planUser->getCurrentPlan();
        $availableThemes = $planUser->getAvailableThemes();
        $planPermissions = [
            'enable_custdomain' => $plan ? $plan->enable_custdomain === 'on' : false,
            'enable_custsubdomain' => $plan ? $plan->enable_custsubdomain === 'on' : false,
        ];

        // Prepare plan information for theme labeling
        $planInfo = null;
        if ($plan) {
            $planInfo = [
                'id' => $plan->id,
                'name' => $plan->name,
                'included_themes' => $availableThemes, // null means all themes, array means specific themes
            ];
        }

        return Inertia::render('auth/register-stepper', [
            'store' => $store,
            'availableThemes' => $availableThemes, // Still pass for reference
            'planInfo' => $planInfo, // New: plan information for labeling
            'planPermissions' => $planPermissions,
            'currentStep' => 3,
        ]);
    }

    /**
     * Handle Step 3: Choose and save theme
     */
    public function step3(Request $request)
    {
        $user = Auth::user();
        $storeId = session('registration_store_id');

        if (!$storeId) {
            return response()->json([
                'success' => false,
                'message' => 'Store not found. Please start from Step 1.',
                'errors' => ['error' => 'Store not found. Please start from Step 1.'],
            ], 422);
        }

        $store = Store::where('id', $storeId)
            ->where('user_id', $user->id)
            ->firstOrFail();

        // Remove plan-based theme filtering in Step 3 - allow any theme
        // Validate theme exists in the full theme list instead
        $allThemes = ['home-accessories', 'fashion', 'electronics', 'beauty-cosmetics', 'jewelry', 'watches', 'furniture-interior', 'cars-automotive', 'baby-kids', 'perfume-fragrances'];
        $themeValidation = 'required|string|in:' . implode(',', $allThemes);

        try {
            $request->validate([
                'theme' => $themeValidation,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }

        $store->theme = $request->theme;
        $store->save();

        // Check AI store limit before generating content
        $aiLimitCheck = \App\Http\Middleware\CheckPlanAccess::checkAIStoreLimit($user);
        if (!$aiLimitCheck['allowed']) {
            return response()->json([
                'success' => false,
                'message' => $aiLimitCheck['message'],
                'errors' => ['error' => $aiLimitCheck['message']],
            ], 422);
        }

        // Mark all steps as complete
        session([
            'registration_step_3_complete' => true,
            'registration_complete' => true,
        ]);

        // Always redirect to plans page for checkout after registration
        $checkoutUrl = route('plans.index') . '?checkout=1';
        
        // If user has a paid plan that needs payment, include plan ID
        $plan = $user->getCurrentPlan();
        if ($plan && ($plan->price > 0 || $plan->yearly_price > 0) && (!$user->plan_is_active || $user->plan_is_active == 0)) {
            // Store plan selection in session for checkout
            session(['selected_plan_id' => $plan->id]);
            $checkoutUrl .= '&plan=' . $plan->id;
        }
        
        // Do NOT dispatch content generation - user must complete plan checkout first
        // Content generation will happen after plan is selected/activated
        
        return response()->json([
            'success' => true,
            'message' => 'Registration completed! Please select a plan to continue.',
            'storeId' => $storeId,
            'checkoutUrl' => $checkoutUrl,
            'redirectToPlans' => true,
        ]);
    }

    /**
     * Check content generation status for a store.
     */
    public function checkContentStatus(Request $request)
    {
        $user = Auth::user();
        $storeId = $request->input('store_id');

        if (!$storeId) {
            return response()->json(['status' => 'error', 'message' => 'Store ID required.'], 400);
        }

        $store = Store::where('id', $storeId)
                      ->where('user_id', $user->id)
                      ->first();

        if (!$store) {
            return response()->json(['status' => 'error', 'message' => 'Store not found.'], 404);
        }

        $storeSetting = \App\Models\StoreSetting::where('store_id', $storeId)
                                            ->where('theme', $store->theme)
                                            ->first();

        $status = $storeSetting ? $storeSetting->content_generation_status : 'pending';

        return response()->json(['status' => $status]);
    }

    /**
     * Check if registration is complete
     */
    public function checkCompletion()
    {
        $step1Complete = session('registration_step_1_complete', false);
        $step2Complete = session('registration_step_2_complete', false);
        $step3Complete = session('registration_step_3_complete', false);

        return response()->json([
            'complete' => $step1Complete && $step2Complete && $step3Complete,
            'steps' => [
                'step1' => $step1Complete,
                'step2' => $step2Complete,
                'step3' => $step3Complete,
            ],
        ]);
    }

    /**
     * Decrypt plan ID from encrypted string
     */
    private function decryptPlanId($encryptedPlanId)
    {
        try {
            $key = 'StoreGo2024';
            $encrypted = base64_decode($encryptedPlanId);
            $decrypted = '';

            for ($i = 0; $i < strlen($encrypted); $i++) {
                $decrypted .= chr(ord($encrypted[$i]) ^ ord($key[$i % strlen($key)]));
            }

            return is_numeric($decrypted) ? (int)$decrypted : null;
        } catch (\Exception $e) {
            return null;
        }
    }
}

