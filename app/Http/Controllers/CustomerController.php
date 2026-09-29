<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\CustomerAddress;
use Illuminate\Http\Request;
use App\Http\Requests\CustomerRequest;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CustomerController extends BaseController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);

        // Optional, validated list filters (invalid values are ignored).
        $validator = \Validator::make($request->only(['q', 'status', 'group', 'sort', 'per_page']), [
            'q' => 'nullable|string|max:100',
            'status' => 'nullable|in:all,active,inactive',
            'group' => 'nullable|string|max:50',
            'sort' => 'nullable|in:newest,oldest,name,orders,spend,last_order',
            'per_page' => 'nullable|integer|min:5|max:100',
        ]);
        $valid = $validator->valid();
        $filters = [
            'q' => trim((string) ($valid['q'] ?? '')),
            'status' => $valid['status'] ?? 'all',
            'group' => $valid['group'] ?? '',
            'sort' => $valid['sort'] ?? 'newest',
        ];
        $perPage = (int) ($valid['per_page'] ?? 25);

        // Read-only aggregate from real orders (the customers.total_* columns can be stale).
        $orderAgg = \App\Models\Order::where('store_id', $currentStoreId)
            ->whereNotNull('customer_id')
            ->groupBy('customer_id')
            ->selectRaw("customer_id,
                COUNT(*) as orders_count,
                SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as lifetime_spend,
                MAX(created_at) as last_order_at");

        $base = Customer::where('customers.store_id', $currentStoreId);
        if ($filters['q'] !== '') {
            $term = '%' . $filters['q'] . '%';
            $fullName = in_array(\DB::connection()->getDriverName(), ['sqlite', 'pgsql'])
                ? "(COALESCE(customers.first_name, '') || ' ' || COALESCE(customers.last_name, ''))"
                : "CONCAT(COALESCE(customers.first_name, ''), ' ', COALESCE(customers.last_name, ''))";
            $base->where(function ($q) use ($term, $fullName) {
                $q->where('customers.first_name', 'like', $term)
                    ->orWhere('customers.last_name', 'like', $term)
                    ->orWhere('customers.email', 'like', $term)
                    ->orWhere('customers.phone', 'like', $term)
                    ->orWhereRaw($fullName . ' LIKE ?', [$term]);
            });
        }
        if ($filters['group'] !== '') {
            $base->where('customers.customer_group', $filters['group']);
        }

        $statusCounts = [
            'all' => (clone $base)->count(),
            'active' => (clone $base)->where('customers.is_active', true)->count(),
            'inactive' => (clone $base)->where('customers.is_active', false)->count(),
        ];

        if ($filters['status'] === 'active') {
            $base->where('customers.is_active', true);
        } elseif ($filters['status'] === 'inactive') {
            $base->where('customers.is_active', false);
        }

        $list = $base->leftJoinSub($orderAgg, 'oa', 'oa.customer_id', '=', 'customers.id')
            ->select('customers.*', 'oa.orders_count', 'oa.lifetime_spend', 'oa.last_order_at');

        switch ($filters['sort']) {
            case 'oldest':
                $list->orderBy('customers.created_at', 'asc');
                break;
            case 'name':
                $list->orderBy('customers.first_name')->orderBy('customers.last_name');
                break;
            case 'orders':
                $list->orderByRaw('COALESCE(oa.orders_count, 0) DESC');
                break;
            case 'spend':
                $list->orderByRaw('COALESCE(oa.lifetime_spend, 0) DESC');
                break;
            case 'last_order':
                $list->orderByRaw('CASE WHEN oa.last_order_at IS NULL THEN 1 ELSE 0 END')->orderBy('oa.last_order_at', 'desc');
                break;
            default:
                $list->orderBy('customers.created_at', 'desc');
        }
        $list->orderBy('customers.id', 'desc');

        $customers = $list->paginate($perPage)->withQueryString();

        $rows = collect($customers->items())->map(function ($c) {
            return [
                'id' => $c->id,
                'first_name' => $c->first_name,
                'last_name' => $c->last_name,
                'full_name' => trim($c->first_name . ' ' . $c->last_name),
                'initials' => strtoupper(mb_substr((string) $c->first_name, 0, 1) . mb_substr((string) $c->last_name, 0, 1)),
                'email' => $c->email,
                'phone' => $c->phone,
                'avatar' => $c->avatar,
                'is_active' => (bool) $c->is_active,
                'customer_group' => $c->customer_group,
                'created_at' => optional($c->created_at)->toIso8601String(),
                'orders_count' => (int) ($c->orders_count ?? 0),
                'lifetime_spend' => round((float) ($c->lifetime_spend ?? 0), 2),
                'last_order_at' => $c->last_order_at ? \Carbon\Carbon::parse($c->last_order_at)->toIso8601String() : null,
            ];
        })->values();

        // Get statistics
        $totalCustomers = Customer::where('store_id', $currentStoreId)->count();
        $activeCustomers = Customer::where('store_id', $currentStoreId)->where('is_active', true)->count();
        $newThisMonth = Customer::where('store_id', $currentStoreId)
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();
        // Real, order-derived facts (store-scoped).
        $customersWithOrders = \App\Models\Order::where('store_id', $currentStoreId)
            ->whereNotNull('customer_id')
            ->distinct('customer_id')
            ->count('customer_id');
        $repeatCustomers = \DB::query()->fromSub(
            \App\Models\Order::where('store_id', $currentStoreId)
                ->whereNotNull('customer_id')
                ->groupBy('customer_id')
                ->havingRaw('COUNT(*) >= 2')
                ->select('customer_id'),
            'rc'
        )->count();

        $groups = Customer::where('store_id', $currentStoreId)
            ->whereNotNull('customer_group')
            ->where('customer_group', '!=', '')
            ->distinct()
            ->orderBy('customer_group')
            ->pluck('customer_group')
            ->values();

        return Inertia::render('customers/index', [
            'customers' => $rows,
            'pagination' => [
                'current_page' => $customers->currentPage(),
                'last_page' => $customers->lastPage(),
                'per_page' => $customers->perPage(),
                'total' => $customers->total(),
                'from' => $customers->firstItem(),
                'to' => $customers->lastItem(),
            ],
            'counts' => $statusCounts,
            'groups' => $groups,
            'stats' => [
                'totalCustomers' => $totalCustomers,
                'activeCustomers' => $activeCustomers,
                'newThisMonth' => $newThisMonth,
                'customersWithOrders' => $customersWithOrders,
                'repeatCustomers' => $repeatCustomers,
            ],
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('customers/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CustomerRequest $request)
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);

        $validatedData = $request->validated();

        // DATABASE TRANSACTION ADDED - Data Integrity Fix
        return \DB::transaction(function () use ($validatedData, $currentStoreId, $request) {
            // Create customer
            $customer = Customer::create([
                'store_id' => $currentStoreId,
                'first_name' => $validatedData['first_name'],
                'last_name' => $validatedData['last_name'],
                'email' => $validatedData['email'],
                'phone' => $validatedData['phone'] ?? null,
                'date_of_birth' => $validatedData['date_of_birth'] ?? null,
                'gender' => $validatedData['gender'] ?? null,
                'notes' => $validatedData['notes'] ?? null,
                'avatar' => $validatedData['avatar'] ?? null,
                'is_active' => $validatedData['is_active'] ?? true,
                'preferred_language' => $validatedData['preferred_language'] ?? 'en',
                'customer_group' => $validatedData['customer_group'] ?? 'regular',
                'email_marketing' => $validatedData['email_marketing'] ?? false,
                'sms_notifications' => $validatedData['sms_notifications'] ?? false,
                'order_updates' => $validatedData['order_updates'] ?? false
            ]);

            // Create billing address if provided
            if (isset($validatedData['billing_address'])) {
                $billingAddress = $validatedData['billing_address'];
                CustomerAddress::create([
                    'customer_id' => $customer->id,
                    'type' => 'billing',
                    'address' => $billingAddress['address'] ?? '',
                    'city' => $billingAddress['city'] ?? '',
                    'state' => $billingAddress['state'] ?? '',
                    'postal_code' => $billingAddress['postal_code'] ?? '',
                    'country' => $billingAddress['country'] ?? '',
                    'is_default' => true
                ]);
            }

            // Create shipping address if provided
            if (isset($validatedData['shipping_address']) && !$request->boolean('same_as_billing')) {
                $shippingAddress = $validatedData['shipping_address'];
                CustomerAddress::create([
                    'customer_id' => $customer->id,
                    'type' => 'shipping',
                    'address' => $shippingAddress['address'] ?? '',
                    'city' => $shippingAddress['city'] ?? '',
                    'state' => $shippingAddress['state'] ?? '',
                    'postal_code' => $shippingAddress['postal_code'] ?? '',
                    'country' => $shippingAddress['country'] ?? '',
                    'is_default' => true
                ]);
            } elseif ($request->boolean('same_as_billing') && isset($validatedData['billing_address'])) {
                // Use billing address as shipping address
                $billingAddress = $validatedData['billing_address'];
                CustomerAddress::create([
                    'customer_id' => $customer->id,
                    'type' => 'shipping',
                    'address' => $billingAddress['address'] ?? '',
                    'city' => $billingAddress['city'] ?? '',
                    'state' => $billingAddress['state'] ?? '',
                    'postal_code' => $billingAddress['postal_code'] ?? '',
                    'country' => $billingAddress['country'] ?? '',
                    'is_default' => true
                ]);
            }

            return redirect()->route('customers.index')
                ->with('success', 'Customer created successfully!');
        });
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);

        $customer = Customer::where('store_id', $currentStoreId)
            ->with(['addresses'])
            ->findOrFail($id);

        // Calculate customer statistics from actual orders (newest first)
        $orders = \App\Models\Order::where('customer_id', $customer->id)
            ->where('store_id', $currentStoreId)
            ->withCount('items')
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        $totalOrders = $orders->count();
        $paidOrders = $orders->where('payment_status', 'paid');
        $totalSpent = (float) $paidOrders->sum('total_amount');
        // Average over paid orders only, so unpaid/cancelled orders don't dilute it.
        $avgOrderValue = $paidOrders->count() > 0 ? $totalSpent / $paidOrders->count() : 0;
        $lastOrderDate = $orders->max('created_at');
        $pendingOrders = $orders->where('status', 'pending')->count();

        // Add calculated stats to customer data
        $customer->total_orders = $totalOrders;
        $customer->total_spent = $totalSpent;
        $customer->avg_order_value = $avgOrderValue;
        $customer->paid_orders = $paidOrders->count();
        $customer->last_order_date = $lastOrderDate ? $lastOrderDate->toIso8601String() : null;
        $customer->pending_orders = $pendingOrders;
        $customer->full_name = $customer->first_name . ' ' . $customer->last_name;
        $customer->initials = strtoupper(mb_substr((string) $customer->first_name, 0, 1) . mb_substr((string) $customer->last_name, 0, 1));

        $billingAddress = $customer->addresses->where('type', 'billing')->first();
        $shippingAddress = $customer->addresses->where('type', 'shipping')->first();

        return Inertia::render('customers/show', [
            'customer' => $customer,
            'billingAddress' => $billingAddress,
            'shippingAddress' => $shippingAddress,
            'recentOrders' => $orders->take(50)->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'total' => (float) $order->total_amount,
                    'status' => strtolower((string) $order->status),
                    'payment_status' => strtolower((string) $order->payment_status),
                    'items_count' => (int) $order->items_count,
                    'created_at' => optional($order->created_at)->toIso8601String(),
                    'date' => $order->created_at->format('M j, Y'),
                ];
            })->values(),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);
        
        $customer = Customer::where('store_id', $currentStoreId)
            ->with(['addresses'])
            ->findOrFail($id);
        
        $billingAddress = $customer->addresses->where('type', 'billing')->first();
        $shippingAddress = $customer->addresses->where('type', 'shipping')->first();
        
        return Inertia::render('customers/edit', [
            'customer' => $customer,
            'billingAddress' => $billingAddress,
            'shippingAddress' => $shippingAddress,
            'sameAsBilling' => $billingAddress && $shippingAddress && 
                $billingAddress->address === $shippingAddress->address &&
                $billingAddress->city === $shippingAddress->city &&
                $billingAddress->postal_code === $shippingAddress->postal_code
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(CustomerRequest $request, $id)
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);
        
        $customer = Customer::where('store_id', $currentStoreId)->findOrFail($id);
        
        return \DB::transaction(function () use ($request, $customer, $currentStoreId) {
            $validatedData = $request->validated();

            // Update customer
            $customer->update([
                'first_name' => $validatedData['first_name'],
                'last_name' => $validatedData['last_name'],
                'email' => $validatedData['email'],
                'phone' => $validatedData['phone'] ?? null,
                'date_of_birth' => $validatedData['date_of_birth'] ?? null,
                'gender' => $validatedData['gender'] ?? null,
                'notes' => $validatedData['notes'] ?? null,
                'avatar' => $validatedData['avatar'] ?? null,
                'is_active' => $validatedData['is_active'] ?? true,
                'preferred_language' => $validatedData['preferred_language'] ?? 'en',
                'customer_group' => $validatedData['customer_group'] ?? 'regular',
                'email_marketing' => $validatedData['email_marketing'] ?? false,
                'sms_notifications' => $validatedData['sms_notifications'] ?? false,
                'order_updates' => $validatedData['order_updates'] ?? false
            ]);

            // Update or create billing address
            if (isset($validatedData['billing_address'])) {
                $billingAddress = $validatedData['billing_address'];
                CustomerAddress::updateOrCreate(
                    [
                        'customer_id' => $customer->id,
                        'type' => 'billing',
                        'is_default' => true
                    ],
                    [
                        'address' => $billingAddress['address'] ?? '',
                        'city' => $billingAddress['city'] ?? '',
                        'state' => $billingAddress['state'] ?? '',
                        'postal_code' => $billingAddress['postal_code'] ?? '',
                        'country' => $billingAddress['country'] ?? ''
                    ]
                );
            }

            // Update or create shipping address
            if (isset($validatedData['shipping_address']) && !$request->boolean('same_as_billing')) {
                $shippingAddress = $validatedData['shipping_address'];
                CustomerAddress::updateOrCreate(
                    [
                        'customer_id' => $customer->id,
                        'type' => 'shipping',
                        'is_default' => true
                    ],
                    [
                        'address' => $shippingAddress['address'] ?? '',
                        'city' => $shippingAddress['city'] ?? '',
                        'state' => $shippingAddress['state'] ?? '',
                        'postal_code' => $shippingAddress['postal_code'] ?? '',
                        'country' => $shippingAddress['country'] ?? ''
                    ]
                );
            } elseif ($request->boolean('same_as_billing') && isset($validatedData['billing_address'])) {
                // Use billing address as shipping address
                $billingAddress = $validatedData['billing_address'];
                CustomerAddress::updateOrCreate(
                    [
                        'customer_id' => $customer->id,
                        'type' => 'shipping',
                        'is_default' => true
                    ],
                    [
                        'address' => $billingAddress['address'] ?? '',
                        'city' => $billingAddress['city'] ?? '',
                        'state' => $billingAddress['state'] ?? '',
                        'postal_code' => $billingAddress['postal_code'] ?? '',
                        'country' => $billingAddress['country'] ?? ''
                    ]
                );
            }

            return redirect()->route('customers.index')
                ->with('success', 'Customer updated successfully!');
        });
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);
        
        $customer = Customer::where('store_id', $currentStoreId)->findOrFail($id);

        // Authorization check
        $this->authorize('delete', $customer);

        return \DB::transaction(function () use ($customer) {
            $customer->delete();

            return redirect()->route('customers.index')
                ->with('success', 'Customer deleted successfully!');
        });
    }
    
    /**
     * Export customers data as CSV.
     */
    public function export()
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);
        
        $customers = Customer::where('store_id', $currentStoreId)
            ->with(['addresses'])
            ->orderBy('created_at', 'desc')
            ->get();
        
        $csvData = [];
        $csvData[] = ['First Name', 'Last Name', 'Email', 'Phone', 'Gender', 'Customer Group', 'Total Orders', 'Total Spent', 'Status', 'Email Marketing', 'Registration Date'];
        
        foreach ($customers as $customer) {
            $csvData[] = [
                $customer->first_name,
                $customer->last_name,
                $customer->email,
                $customer->phone ?: 'Not provided',
                $customer->gender ? ucfirst($customer->gender) : 'Not specified',
                $customer->customer_group ?: 'Regular',
                $customer->total_orders ?: 0,
                formatStoreCurrency($customer->total_spent ?: 0, $user->id, $currentStoreId),
                $customer->is_active ? 'Active' : 'Inactive',
                $customer->email_marketing ? 'Yes' : 'No',
                $customer->created_at->format('Y-m-d H:i:s')
            ];
        }
        
        $filename = 'customers-export-' . now()->format('Y-m-d') . '.csv';
        
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