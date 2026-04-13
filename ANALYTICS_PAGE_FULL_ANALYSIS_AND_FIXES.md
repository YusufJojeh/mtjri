# Analytics Page - Full Analysis & Issue Resolution

**Analysis Date:** 2026-01-12
**Page URL:** `/analytics`
**Controller:** `App\Http\Controllers\AnalyticsController`
**View:** `resources/js/pages/analytics/index.tsx`

---

## EXECUTIVE SUMMARY

### ✅ Current Status: **WORKING CORRECTLY**

The analytics page is functioning as designed with proper handling for:
- ✅ Users with stores
- ✅ Users without stores (empty state)
- ✅ Permission-based access control
- ✅ Demo mode with sample data

### ⚠️ Potential Issues Identified

1. **DomainResolver Middleware Redirect** (CRITICAL)
2. **Permission Requirements** (moderate)
3. **Empty State UX** (minor)
4. **No visual feedback for "no store" scenario** (minor)

---

## 1. COMPLETE FLOW ANALYSIS

### Route Definition

**File:** `routes/web.php:557-558`

```php
Route::get('analytics', [\App\Http\Controllers\AnalyticsController::class, 'index'])
    ->middleware('permission:view-analytics')
    ->name('analytics.index');

Route::get('analytics/export', [\App\Http\Controllers\AnalyticsController::class, 'export'])
    ->middleware('permission:export-analytics')
    ->name('analytics.export');
```

**Middlewares Applied:**
- ✅ `auth` (from route group)
- ✅ `permission:view-analytics` (explicit)
- ⚠️ **DomainResolver** (PROBLEM - from global middleware)

---

## 2. CRITICAL ISSUE: DomainResolver Middleware

### The Problem

**File:** `app/Http/Middleware/DomainResolver.php:46-47`

```php
// For web requests, redirect to store home if not already on store route
elseif (!$request->is('store/*')) {
    return redirect()->route('store.home', ['storeSlug' => $store->slug]);
}
```

### When This Triggers

**Scenario:**
1. User accesses application via **custom domain** (e.g., `mystore.com`)
2. Custom domain is linked to a specific store
3. User navigates to `/analytics`
4. **DomainResolver detects custom domain**
5. **REDIRECT:** User is forced to `/store/{slug}` (storefront)

### Impact

❌ **Users CANNOT access analytics page from custom domains**
- Admin panel routes become inaccessible
- Users get redirected to storefront
- Analytics page unreachable from branded domains

### Why It Happens

The DomainResolver middleware is designed to:
- Detect custom domains/subdomains
- Redirect ALL non-store routes to the storefront

**Problem:** It doesn't exclude admin panel routes like `/analytics`

---

## 3. CONTROLLER ANALYSIS

### Entry Point: `index()` Method

**File:** `app/Http/Controllers/AnalyticsController.php:16-56`

```php
public function index()
{
    $user = Auth::user();
    $storeId = getCurrentStoreId($user);

    if (!$storeId) {
        // No store selected → return empty analytics
        return Inertia::render('analytics/index', [
            'analytics' => $this->getEmptyAnalytics()
        ]);
    }

    // Load analytics data for selected store
    $analytics = [
        'metrics' => $this->getKeyMetrics($storeId),
        'topProducts' => $this->getTopProducts($storeId),
        'topCustomers' => $this->getTopCustomers($storeId),
        'recentActivity' => $this->getRecentActivity($storeId),
        'revenueChart' => $this->getRevenueChartData($storeId),
        'salesChart' => $this->getSalesChartData($storeId)
    ];

    // Demo mode: add dummy data if real data is empty
    if (config('app.is_demo', false)) {
        // ... populate demo data
    }

    return Inertia::render('analytics/index', [
        'analytics' => $analytics
    ]);
}
```

### ✅ Proper Handling

1. **No Store Selected:**
   - Returns empty analytics structure
   - Page still renders
   - No errors thrown

2. **Store Selected:**
   - Loads real data from database
   - Calculates metrics for last 30 days
   - Formats currency properly

3. **Demo Mode:**
   - Adds dummy data when real data is zero
   - Only fills empty metrics/charts
   - Doesn't override real data

---

## 4. STORE DETECTION LOGIC

### `getCurrentStoreId()` Function

**File:** `app/Helpers/helper.php:1085-1117`

```php
function getCurrentStoreId($user = null)
{
    if (!$user) {
        $user = auth()->user();
    }

    if (!$user) {
        return null; // No user = no store
    }

    // Demo mode: check cookie first
    if (config('app.is_demo', false) && request()->cookie('demo_store_id')) {
        $storeId = (int) request()->cookie('demo_store_id');

        // Verify store belongs to user or their creator
        $storeExists = false;
        if ($user->type === 'company') {
            $storeExists = $user->stores->contains('id', $storeId);
        } elseif ($user->type === 'user' && $user->created_by) {
            $creator = \App\Models\User::find($user->created_by);
            if ($creator) {
                $storeExists = $creator->stores->contains('id', $storeId);
            }
        }

        if ($storeExists) {
            return $storeId;
        }
    }

    // Fallback to database current_store
    return $user->current_store;
}
```

### Detection Priority

1. **Demo Mode Cookie** (if `is_demo=true`)
   - Check `demo_store_id` cookie
   - Verify store ownership
   - Return if valid

2. **User's Current Store** (always)
   - From `users.current_store` column
   - Selected store in user session
   - Can be `null` if no store selected

### Scenarios

| User Type | Has Stores | current_store | Result |
|-----------|------------|---------------|--------|
| Company | Yes | 123 | ✅ Returns 123 |
| Company | Yes | NULL | ❌ Returns NULL |
| Company | No | NULL | ❌ Returns NULL |
| User (sub-user) | N/A | 123 | ✅ Returns 123 |
| User (sub-user) | N/A | NULL | ❌ Returns NULL |

---

## 5. EMPTY ANALYTICS STRUCTURE

### `getEmptyAnalytics()` Method

```php
private function getEmptyAnalytics()
{
    return [
        'metrics' => [
            'revenue' => ['current' => 0, 'change' => 0],
            'orders' => ['current' => 0, 'change' => 0],
            'customers' => ['total' => 0, 'new' => 0],
        ],
        'topProducts' => [],
        'topCustomers' => [],
        'recentActivity' => [],
        'revenueChart' => [],
        'salesChart' => []
    ];
}
```

### Result

- Page renders with all sections
- All metrics show `0`
- Charts display empty
- No "no store selected" message shown

---

## 6. FRONTEND COMPONENT ANALYSIS

### Component Structure

**File:** `resources/js/pages/analytics/index.tsx` (209 lines)

```tsx
export default function Analytics({ analytics }: Props) {
  const { t } = useTranslation();
  const formatCurrency = useCurrencyFormatter();
  const { hasPermission } = usePermissions();

  const pageActions = hasPermission('export-analytics') ? [
    {
      label: t('Export Report'),
      icon: <Download className='h-4 w-4' />,
      variant: 'default' as const,
      onClick: () => window.open(route('analytics.export'), '_blank')
    }
  ] : [];

  return (
    <PageTemplate
      title={t('Analytics & Reporting')}
      url='/analytics'
      actions={pageActions}
      breadcrumbs={[...]}
    >
      {/* Key Metrics Cards */}
      {/* Revenue & Sales Charts */}
      {/* Top Products & Customers */}
      {/* Recent Activity */}
    </PageTemplate>
  );
}
```

### Sections Rendered

1. **Key Metrics (3 cards)**
   - Total Revenue (with % change)
   - Total Orders (with month-over-month)
   - Total Customers (with new count)

2. **Charts (2)**
   - Revenue Overview (Bar chart - last 30 days)
   - Sales Trend (Line chart - last 30 days)

3. **Top Lists (2)**
   - Top Selling Products (4 items)
   - Top Customers (4 items)

4. **Recent Activity**
   - Last 4 orders/events

### ⚠️ UX Issue: No Empty State Message

**Problem:**
- When `analytics.topProducts = []`, section renders empty
- When `analytics.recentActivity = []`, section renders empty
- No "No data available" or "Create your first store" message

**User Experience:**
- Confusing for new users
- Looks broken rather than intentionally empty
- No guidance on next steps

---

## 7. PERMISSION SYSTEM

### Required Permissions

**To View Page:**
```php
->middleware('permission:view-analytics')
```

**To Export:**
```php
->middleware('permission:export-analytics')
```

### Permission Check Flow

1. User must have `view-analytics` permission
2. Permission checked via Laravel's permission middleware
3. If missing → 403 Forbidden (or redirect based on config)

### ⚠️ Default Permissions

**Question:** Do new company users automatically get `view-analytics` permission?

If not:
- Users might not see analytics even with stores
- Need to check role/permission seeding

---

## 8. DEMO MODE BEHAVIOR

### Configuration

**Check:** `config('app.is_demo', false)`

### Demo Data

**File:** `AnalyticsController.php:211-239`

```php
private function getDemoRevenueChart()
{
    $data = [];
    $baseRevenue = 800;
    for ($i = 29; $i >= 0; $i--) {
        $date = Carbon::now()->subDays($i);
        $revenue = $baseRevenue + rand(-200, 400) + ($i < 15 ? rand(100, 300) : 0);
        $data[] = [
            'date' => $date->format('M d'),
            'revenue' => (float) $revenue
        ];
    }
    return $data;
}

private function getDemoSalesChart()
{
    $data = [];
    $baseOrders = 8;
    for ($i = 29; $i >= 0; $i--) {
        $date = Carbon::now()->subDays($i);
        $orders = $baseOrders + rand(-3, 7) + ($i < 15 ? rand(2, 5) : 0);
        $data[] = [
            'date' => $date->format('M d'),
            'orders' => max(0, (int) $orders)
        ];
    }
    return $data;
}
```

### When Demo Data Appears

**Condition (Line 38):**
```php
if ($analytics['metrics']['revenue']['current'] == 0 && $analytics['metrics']['orders']['current'] == 0)
```

**Fills:**
- Metrics: Revenue, Orders, Customers
- Charts: Revenue chart, Sales chart

**Does NOT fill:**
- Top Products
- Top Customers
- Recent Activity

---

## 9. IDENTIFIED ISSUES & SOLUTIONS

### 🔴 ISSUE 1: DomainResolver Redirect (CRITICAL)

**Problem:**
Users accessing from custom domains get redirected away from analytics page.

**Affected Routes:**
- `/analytics` and ALL admin panel routes
- Only affects users with custom domains enabled

**Solution:**

**Option A: Exclude Admin Routes from DomainResolver**

**File:** `app/Http/Middleware/DomainResolver.php`

```php
public function handle(Request $request, Closure $next)
{
    // Skip during installation
    if (!$request->is('install/*') && !$request->is('update/*') && file_exists(storage_path('installed'))) {

        // ✅ ADD: Skip for admin panel routes
        $adminRoutes = [
            'analytics', 'analytics/*',
            'dashboard', 'settings', 'settings/*',
            'products', 'products/*',
            'orders', 'orders/*',
            'customers', 'customers/*',
            // Add all admin routes here
        ];

        foreach ($adminRoutes as $pattern) {
            if ($request->is($pattern)) {
                return $next($request);
            }
        }

        $host = $request->getHost();
        $store = null;

        // ... rest of middleware logic
    }
    return $next($request);
}
```

**Option B: Check URL Path Before Redirect** (BETTER)

```php
// For web requests, redirect to store home ONLY if on landing/public pages
elseif ($request->is('/') || $request->is('welcome') || $request->is('plans') || $request->is('pricing')) {
    return redirect()->route('store.home', ['storeSlug' => $store->slug]);
}
```

**Option C: Separate Domains** (BEST)

- Admin panel: `app.yourdomain.com`
- Storefronts: `{slug}.yourdomain.com` or custom domains
- DomainResolver only applies to storefront domains

---

### 🟡 ISSUE 2: No Empty State UI (MODERATE)

**Problem:**
When no store is selected or no data exists, page shows zeros with no explanation.

**Solution:**

Add empty state component to frontend:

```tsx
{analytics.topProducts.length === 0 && (
  <div className="text-center py-8 text-muted-foreground">
    <BarChart className="h-12 w-12 mx-auto mb-3 opacity-50" />
    <p className="font-medium">{t('No products data available')}</p>
    <p className="text-sm">{t('Start selling products to see analytics here')}</p>
  </div>
)}
```

Apply to:
- Top Products section
- Top Customers section
- Recent Activity section

---

### 🟡 ISSUE 3: No "No Store Selected" Warning (MODERATE)

**Problem:**
User sees empty analytics without knowing WHY.

**Solution:**

**Backend:** Add flag to analytics response

```php
if (!$storeId) {
    return Inertia::render('analytics/index', [
        'analytics' => $this->getEmptyAnalytics(),
        'hasStore' => false // ✅ ADD
    ]);
}

// ...

return Inertia::render('analytics/index', [
    'analytics' => $analytics,
    'hasStore' => true // ✅ ADD
]);
```

**Frontend:** Show alert banner

```tsx
interface Props {
  analytics: {...};
  hasStore: boolean; // ✅ ADD
}

export default function Analytics({ analytics, hasStore }: Props) {
  // ...

  return (
    <PageTemplate {...}>
      {!hasStore && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('No Store Selected')}</AlertTitle>
          <AlertDescription>
            {t('Please select a store from the header to view analytics data.')}
            <Button variant="link" asChild className="px-0">
              <Link href={route('stores.index')}>{t('Go to Stores')}</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Rest of content */}
    </PageTemplate>
  );
}
```

---

### 🟢 ISSUE 4: Export Fails Silently When No Store (MINOR)

**Problem:**
Export returns JSON error, but user might not see it.

**Current Code:**
```php
if (!$storeId) {
    return response()->json(['error' => 'No store selected'], 400);
}
```

**Solution:**

Show toast notification on frontend before opening export:

```tsx
onClick: () => {
  if (!hasStore) {
    toast.error(t('Please select a store before exporting analytics'));
    return;
  }
  window.open(route('analytics.export'), '_blank');
}
```

---

## 10. COMPLETE SOLUTION IMPLEMENTATION

### Step 1: Fix DomainResolver Middleware

**File:** `app/Http/Middleware/DomainResolver.php`

```php
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
            // ✅ FIX: Only redirect landing/public pages, not admin panel
            elseif ($request->is('/') || $request->is('welcome') || $request->is('plans')) {
                return redirect()->route('store.home', ['storeSlug' => $store->slug]);
            }
            // ✅ For admin panel routes: just set context, don't redirect
        }
    }
    return $next($request);
}
```

### Step 2: Update AnalyticsController

**File:** `app/Http/Controllers/AnalyticsController.php`

```php
public function index()
{
    $user = Auth::user();
    $storeId = getCurrentStoreId($user);

    if (!$storeId) {
        return Inertia::render('analytics/index', [
            'analytics' => $this->getEmptyAnalytics(),
            'hasStore' => false // ✅ ADD
        ]);
    }

    $analytics = [
        'metrics' => $this->getKeyMetrics($storeId),
        'topProducts' => $this->getTopProducts($storeId),
        'topCustomers' => $this->getTopCustomers($storeId),
        'recentActivity' => $this->getRecentActivity($storeId),
        'revenueChart' => $this->getRevenueChartData($storeId),
        'salesChart' => $this->getSalesChartData($storeId)
    ];

    // Demo mode logic...

    return Inertia::render('analytics/index', [
        'analytics' => $analytics,
        'hasStore' => true // ✅ ADD
    ]);
}
```

### Step 3: Update Frontend Component

**File:** `resources/js/pages/analytics/index.tsx`

```tsx
interface Props {
  analytics: {
    metrics: any;
    topProducts: any[];
    topCustomers: any[];
    recentActivity: any[];
    revenueChart: any[];
    salesChart: any[];
  };
  hasStore: boolean; // ✅ ADD
}

export default function Analytics({ analytics, hasStore }: Props) {
  const { t } = useTranslation();
  const formatCurrency = useCurrencyFormatter();
  const { hasPermission } = usePermissions();

  const pageActions = hasPermission('export-analytics') ? [
    {
      label: t('Export Report'),
      icon: <Download className='h-4 w-4' />,
      variant: 'default' as const,
      onClick: () => {
        // ✅ ADD: Check before export
        if (!hasStore) {
          // Show toast or alert
          alert(t('Please select a store before exporting analytics'));
          return;
        }
        window.open(route('analytics.export'), '_blank');
      }
    }
  ] : [];

  return (
    <PageTemplate
      title={t('Analytics & Reporting')}
      url='/analytics'
      actions={pageActions}
      breadcrumbs={[
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Analytics & Reporting' }
      ]}
    >
      {/* ✅ ADD: No Store Alert */}
      {!hasStore && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900">{t('No Store Selected')}</h3>
              <p className="text-sm text-yellow-700 mt-1">
                {t('Please select a store from the header to view analytics data.')}
              </p>
              <a
                href={route('stores.index')}
                className="text-sm text-yellow-900 underline font-medium mt-2 inline-block"
              >
                {t('Go to Stores')} →
              </a>
            </div>
          </div>
        </div>
      )}

      <div className='space-y-4 sm:space-y-6'>
        {/* Existing content... */}

        {/* ✅ ADD: Empty states for sections */}
        <Card>
          <CardHeader className='p-3 sm:p-6'>
            <CardTitle className='text-base sm:text-lg'>{t('Top Selling Products')}</CardTitle>
          </CardHeader>
          <CardContent className='p-3 sm:p-6 pt-0'>
            {analytics.topProducts.length > 0 ? (
              <div className='space-y-3 sm:space-y-4'>
                {analytics.topProducts.map((product, index) => (
                  // Existing product card
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">{t('No products data')}</p>
                <p className="text-sm">{t('Start selling to see top products')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Apply same pattern to other sections */}
      </div>
    </PageTemplate>
  );
}
```

---

## 11. TESTING CHECKLIST

### Pre-Deployment Tests

- [ ] **Test 1:** User with store → Analytics loads with data
- [ ] **Test 2:** User without store → Empty state with alert
- [ ] **Test 3:** Access from main domain → Works
- [ ] **Test 4:** Access from custom domain → Works (no redirect)
- [ ] **Test 5:** Export with store → CSV downloads
- [ ] **Test 6:** Export without store → Error message
- [ ] **Test 7:** Demo mode → Dummy data appears
- [ ] **Test 8:** Permission denied → 403 or redirect
- [ ] **Test 9:** Mobile responsive → All charts render
- [ ] **Test 10:** Multiple stores → Switches correctly

---

## 12. FILES TO MODIFY

| File | Changes | Lines | Priority |
|------|---------|-------|----------|
| `app/Http/Middleware/DomainResolver.php` | Fix redirect logic | ~10 | 🔴 Critical |
| `app/Http/Controllers/AnalyticsController.php` | Add `hasStore` flag | ~4 | 🟡 High |
| `resources/js/pages/analytics/index.tsx` | Add empty states & alert | ~50 | 🟡 High |

**Total Changes:** ~64 lines across 3 files

---

## 13. DEPLOYMENT STEPS

1. **Backup current code**
2. **Modify DomainResolver.php** (fix redirect)
3. **Modify AnalyticsController.php** (add hasStore flag)
4. **Modify analytics/index.tsx** (add UI improvements)
5. **Run:** `npm run build`
6. **Test all scenarios**
7. **Deploy to production**

---

## 14. SUMMARY

### Current State
✅ Analytics page works correctly for users with stores
✅ Proper data calculations and formatting
✅ Demo mode functioning
✅ Permission system in place
✅ Export functionality operational

### Issues Found
🔴 DomainResolver redirects admin panel users on custom domains
🟡 No visual feedback for "no store selected" state
🟡 Empty sections look broken instead of intentionally empty
🟢 Minor UX improvements needed

### Recommended Actions
1. **MUST FIX:** DomainResolver redirect logic
2. **SHOULD ADD:** "No store selected" alert
3. **SHOULD ADD:** Empty state messages for sections
4. **NICE TO HAVE:** Better export error handling

---

**Analysis Completed:** 2026-01-12
**Analyst:** Claude (Sonnet 4.5)
**Status:** ✅ Ready for Implementation
