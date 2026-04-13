<?php

namespace App\Http\Controllers;

use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class StoreController extends BaseController
{
    /**
     * Display a listing of the stores.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $perPage = $request->input('per_page', 10);

        $query = Store::query();

        // If user is company type, show their own stores
        if ($user->type === 'company') {
            $query->where('user_id', $user->id);
        }
        // If user has store permissions, show creator's stores
        elseif ($user->can('view-stores') && $user->created_by) {
            $query->where('user_id', $user->created_by);
        }
        // Otherwise, show user's own stores (if any)
        else {
            $query->where('user_id', $user->id);
        }

        $stores = $query->latest()->paginate($perPage);

        // Calculate aggregated statistics
        $storeIds = $stores->pluck('id');
        $totalCustomers = \App\Models\Customer::whereIn('store_id', $storeIds)->count();
        $totalRevenue = \App\Models\Order::whereIn('store_id', $storeIds)->where('payment_status', 'paid')->sum('total_amount');

        // Add individual store statistics
        $formattedStores = $stores->map(function ($store) {
            $store->total_orders = \App\Models\Order::where('store_id', $store->id)->count();
            $store->total_customers = \App\Models\Customer::where('store_id', $store->id)->count();
            $store->total_revenue = \App\Models\Order::where('store_id', $store->id)->where('payment_status', 'paid')->sum('total_amount');
            $store->formatted_revenue = formatStoreCurrency($store->total_revenue, Auth::id(), $store->id);
            return $store;
        });

        return Inertia::render('stores/index', [
            'stores' => $formattedStores,
            'aggregatedStats' => [
                'totalCustomers' => $totalCustomers,
                'totalRevenue' => $totalRevenue,
                'formattedRevenue' => formatStoreCurrency($totalRevenue, Auth::id())
            ],
            'filters' => $request->only(['per_page'])
        ]);
    }
    /**
     * Show the form for creating a new store.
     */
    public function create()
    {
        $user = Auth::user();

        // Get available themes based on user's plan
        $availableThemes = $user->getAvailableThemes();

        // Get plan permissions for domain features
        $plan = $user->getCurrentPlan();
        $planPermissions = [
            'enable_custdomain' => $plan ? $plan->enable_custdomain === 'on' : false,
            'enable_custsubdomain' => $plan ? $plan->enable_custsubdomain === 'on' : false,
        ];

        return Inertia::render('stores/create', [
            'availableThemes' => $availableThemes,
            'planPermissions' => $planPermissions
        ]);
    }

    /**
     * Store a newly created store in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // Check if user can create more stores
        $storeCheck = $user->canCreateStore();
        if (!$storeCheck['allowed']) {
            return redirect()->back()->with('error', $storeCheck['message']);
        }

        return \DB::transaction(function () use ($request, $user) {
            // Validate theme against user's plan
            $availableThemes = $user->getAvailableThemes();
            $themeValidation = 'required|string';
            if ($availableThemes !== null) {
                $themeValidation .= '|in:' . implode(',', $availableThemes);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'slug' => 'nullable|string|max:255|regex:/^[a-z0-9-]+$/|unique:stores,slug',
                'description' => 'nullable|string',
                'theme' => $themeValidation,
                'enable_custom_domain' => 'boolean',
                'enable_custom_subdomain' => 'boolean',
                'custom_domain' => 'nullable|string|max:255',
                'custom_subdomain' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return redirect()->back()->withErrors($validator)->withInput();
            }

            // Validate plan permissions for domain features
            $plan = $user->getCurrentPlan();
            if ($request->enable_custom_domain && (!$plan || $plan->enable_custdomain !== 'on')) {
                return redirect()->back()->with('error', 'Custom domain feature is not available in your current plan.');
            }
            if ($request->enable_custom_subdomain && (!$plan || $plan->enable_custsubdomain !== 'on')) {
                return redirect()->back()->with('error', 'Custom subdomain feature is not available in your current plan.');
            }

            // Ensure only one domain type is enabled
            if ($request->enable_custom_domain && $request->enable_custom_subdomain) {
                return redirect()->back()->with('error', 'You can enable either Custom Domain or Custom Subdomain, not both.');
            }

            $store = new Store();
            $store->name = $request->name;
            $store->slug = $request->slug ? $request->slug : Store::generateUniqueSlug($request->name);
            $store->description = $request->description;
            $store->theme = $request->theme;
            $store->user_id = Auth::id();
            $store->email = $request->email ?? null;
            $store->enable_custom_domain = $request->enable_custom_domain ?? false;
            $store->enable_custom_subdomain = $request->enable_custom_subdomain ?? false;
            $store->custom_domain = $request->enable_custom_domain ? $request->custom_domain : null;
            $store->custom_subdomain = $request->enable_custom_subdomain ? $request->custom_subdomain : null;
            $store->save();

            // Set this as the current store for the user if they don't have one set
            if (!getCurrentStoreId($user)) {
                $user->current_store = $store->id;
                $user->save();
            }

            return redirect()->route('stores.index')->with('success', __('Store created successfully'));
        });
    }

    /**
     * Display the specified store.
     */
    public function show($id)
    {
        $user = Auth::user();

        // Build query based on user type and permissions
        $query = Store::where('id', $id);

        if ($user->type === 'company') {
            $query->where('user_id', $user->id);
        } elseif ($user->can('view-stores') && $user->created_by) {
            $query->where('user_id', $user->created_by);
        } else {
            $query->where('user_id', $user->id);
        }

        $store = $query->firstOrFail();

        // Get dynamic statistics
        $stats = [
            'total_products' => \App\Models\Product::where('store_id', $store->id)->count(),
            'total_orders' => \App\Models\Order::where('store_id', $store->id)->count(),
            'total_customers' => \App\Models\Customer::where('store_id', $store->id)->count(),
            'total_revenue' => \App\Models\Order::where('store_id', $store->id)->where('payment_status', 'paid')->sum('total_amount')
        ];

        // Format revenue for display
        $stats['formatted_revenue'] = formatStoreCurrency($stats['total_revenue'], Auth::id(), $store->id);

        return Inertia::render('stores/view', [
            'store' => $store,
            'stats' => $stats
        ]);
    }

    /**
     * Show the form for editing the specified store.
     */
    public function edit($id)
    {
        $user = Auth::user();

        // Build query based on user type and permissions
        $query = Store::where('id', $id);

        if ($user->type === 'company') {
            $query->where('user_id', $user->id);
        } elseif ($user->can('edit-stores') && $user->created_by) {
            $query->where('user_id', $user->created_by);
        } else {
            $query->where('user_id', $user->id);
        }

        $store = $query->firstOrFail();

        // Get available themes based on user's plan (use creator's plan if user is not company)
        $planUser = $user->type === 'company' ? $user : ($user->creator ?? $user);
        $availableThemes = $planUser->getAvailableThemes();

        // Get plan permissions for domain features
        $plan = $planUser->getCurrentPlan();
        $planPermissions = [
            'enable_custdomain' => $plan ? $plan->enable_custdomain === 'on' : false,
            'enable_custsubdomain' => $plan ? $plan->enable_custsubdomain === 'on' : false,
        ];

        return Inertia::render('stores/edit', [
            'store' => $store,
            'availableThemes' => $availableThemes,
            'planPermissions' => $planPermissions
        ]);
    }

    /**
     * Update the specified store in storage.
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();

        // Build query based on user type and permissions
        $query = Store::where('id', $id);

        if ($user->type === 'company') {
            $query->where('user_id', $user->id);
        } elseif ($user->can('edit-stores') && $user->created_by) {
            $query->where('user_id', $user->created_by);
        } else {
            $query->where('user_id', $user->id);
        }

        $store = $query->firstOrFail();

        return \DB::transaction(function () use ($request, $user, $store) {
            // Validate theme against user's plan
            $availableThemes = $user->getAvailableThemes();
            $themeValidation = 'required|string';
            if ($availableThemes !== null) {
                $themeValidation .= '|in:' . implode(',', $availableThemes);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'slug' => 'required|string|max:255|regex:/^[a-z0-9-]+$/|unique:stores,slug,' . $store->id,
                'description' => 'nullable|string',
                'theme' => $themeValidation,
                'enable_custom_domain' => 'boolean',
                'enable_custom_subdomain' => 'boolean',
                'custom_domain' => 'nullable|string|max:255',
                'custom_subdomain' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return redirect()->back()->withErrors($validator)->withInput();
            }

            // Validate plan permissions for domain features
            $plan = $user->getCurrentPlan();
            if ($request->enable_custom_domain && (!$plan || $plan->enable_custdomain !== 'on')) {
                return redirect()->back()->with('error', 'Custom domain feature is not available in your current plan.');
            }
            if ($request->enable_custom_subdomain && (!$plan || $plan->enable_custsubdomain !== 'on')) {
                return redirect()->back()->with('error', 'Custom subdomain feature is not available in your current plan.');
            }

            // Ensure only one domain type is enabled
            if ($request->enable_custom_domain && $request->enable_custom_subdomain) {
                return redirect()->back()->with('error', 'You can enable either Custom Domain or Custom Subdomain, not both.');
            }

            $store->name = $request->name;
            $store->slug = $request->slug;
            $store->description = $request->description;
            $store->theme = $request->theme;
            $store->email = $request->email ?? $store->email;
            $store->enable_custom_domain = $request->enable_custom_domain ?? false;
            $store->enable_custom_subdomain = $request->enable_custom_subdomain ?? false;
            $store->custom_domain = $request->enable_custom_domain ? $request->custom_domain : null;
            $store->custom_subdomain = $request->enable_custom_subdomain ? $request->custom_subdomain : null;
            $store->save();

            return redirect()->route('stores.index')->with('success', __('Store updated successfully'));
        });
    }

    /**
     * Remove the specified store from storage.
     */
    public function destroy($id)
    {
        $user = Auth::user();

        // Build query based on user type and permissions
        $query = Store::where('id', $id);

        if ($user->type === 'company') {
            $query->where('user_id', $user->id);
        } elseif ($user->can('delete-stores') && $user->created_by) {
            $query->where('user_id', $user->created_by);
        } else {
            $query->where('user_id', $user->id);
        }

        $store = $query->firstOrFail();

        return \DB::transaction(function () use ($store) {
            $store->delete();
            return redirect()->route('stores.index')->with('success', __('Store deleted successfully'));
        });
    }

    /**
     * Export stores data as CSV.
     */
    public function export()
    {
        $user = Auth::user();

        // Get stores based on user type and permissions
        if ($user->type === 'company') {
            $stores = Store::where('user_id', $user->id)->get();
        } elseif ($user->can('export-stores') && $user->created_by) {
            $stores = Store::where('user_id', $user->created_by)->get();
        } else {
            $stores = Store::where('user_id', $user->id)->get();
        }

        $csvData = [];
        $csvData[] = ['Store Name', 'Slug', 'Domain', 'Email', 'Theme', 'Status', 'Created Date'];

        foreach ($stores as $store) {
            $csvData[] = [
                $store->name,
                $store->slug,
                $store->domain ?: 'Not set',
                $store->email ?: 'Not set',
                $store->theme,
                $store->is_active ? 'Active' : 'Inactive',
                $store->created_at->format('Y-m-d H:i:s')
            ];
        }

        $filename = 'stores-export-' . now()->format('Y-m-d') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function() use ($csvData) {
            $file = fopen('php://output', 'w');
            foreach ($csvData as $row) {
                fputcsv($file, $row);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
