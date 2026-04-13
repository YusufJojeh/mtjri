---
name: Implement registration redirect to plans after free analysis
overview: This plan modifies the registration flow to redirect users to the plans page after they complete the store setup and use their free AI content generation (analysis). This encourages users to upgrade to a paid plan immediately after seeing the initial results.
todos:
  - id: backend-redirect-flag
    content: Modify RegistrationStepperController@step3 to return redirect_to_plans flag
    status: pending
  - id: frontend-redirect-logic
    content: Update Step3ChooseTheme.tsx to redirect to plans page upon completion
    status: pending
  - id: db-starter-plan
    content: Add $3 Starter plan to PlanSeeder.php and run migration/seeder
    status: pending
  - id: verify-flow
    content: Verify redirect flow from registration to plans page
    status: pending
---

# Plan for Registration Redirect after Free Analysis

The goal is to force a redirect to the subscription plans page after a new user completes the registration stepper and triggers the initial store content generation (referred to as "analysis").

### 1. Backend: Update Registration Stepper Response
Modify `[app/Http/Controllers/Auth/RegistrationStepperController.php](app/Http/Controllers/Auth/RegistrationStepperController.php)` to include a redirection flag in the final step of registration.

```php
// app/Http/Controllers/Auth/RegistrationStepperController.php

public function step3(Request $request)
{
    // ... existing logic ...
    
    return response()->json([
        'success' => true,
        'message' => 'Registration completed successfully! Content generation is in progress.',
        'storeId' => $storeId,
        'redirect_to_plans' => true, // New flag to force redirect
    ]);
}
```

### 2. Frontend: Handle Redirection in Stepper
Update `[resources/js/pages/auth/steps/Step3ChooseTheme.tsx](resources/js/pages/auth/steps/Step3ChooseTheme.tsx)` to use the new redirection flag.

```tsx
// resources/js/pages/auth/steps/Step3ChooseTheme.tsx

if (response.data.success) {
    toast.success(t(response.data.message));
    
    if (response.data.redirect_to_plans) {
        router.visit(route('plans.index'));
    } else {
        const storeId = response.data.storeId || store.id;
        router.visit(route('stores.content.show', storeId));
    }
    
    onSuccess(storeId);
}
```

### 3. Database: Add/Update Starter Plan
Modify `[database/seeders/PlanSeeder.php](database/seeders/PlanSeeder.php)` to include a $3 plan if it doesn't exist, or update the Free plan to reflect the "3$ (Free Analysis)" branding if desired. I will add a new "Starter" plan priced at $3.00.

```php
// database/seeders/PlanSeeder.php

[
    'name' => 'Starter',
    'price' => 3.00,
    'yearly_price' => 30.00,
    'duration' => 'monthly',
    'description' => 'Perfect for testing with one full AI analysis.',
    'max_stores' => 1,
    // ... other limits ...
    'is_default' => false,
]
```

### 4. Middleware: Ensure Plan Access
The `[app/Http/Middleware/CheckPlanAccess.php](app/Http/Middleware/CheckPlanAccess.php)` already handles redirection to plans for users with expired or missing plans. No changes needed here unless specific "analysis limits" are required.

### 5. UI: Update Plans Page Message
Optionally update `[resources/js/pages/plans/index.tsx](resources/js/pages/plans/index.tsx)` to show a welcoming message for users redirected from registration.