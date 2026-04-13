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
        
        $perPage = $request->input('per_page', 10);

        $customers = Customer::where('store_id', $currentStoreId)
            ->with(['addresses'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
            
        // Get statistics
        $totalCustomers = Customer::where('store_id', $currentStoreId)->count();
        $activeCustomers = Customer::where('store_id', $currentStoreId)->where('is_active', true)->count();
        $newThisMonth = Customer::where('store_id', $currentStoreId)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();
        $totalSpent = Customer::where('store_id', $currentStoreId)
            ->where('total_orders', '>', 0)
            ->sum('total_spent');
        $totalOrders = Customer::where('store_id', $currentStoreId)
            ->where('total_orders', '>', 0)
            ->sum('total_orders');
        $avgOrderValue = $totalOrders > 0 ? $totalSpent / $totalOrders : 0;

        return Inertia::render('customers/index', [
            'customers' => $customers,
            'stats' => [
                'totalCustomers' => $totalCustomers,
                'activeCustomers' => $activeCustomers,
                'newThisMonth' => $newThisMonth,
                'avgOrderValue' => round($avgOrderValue, 2)
            ],
            'filters' => $request->only(['per_page'])
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
        
        // Calculate dynamic customer statistics from actual orders
        $orders = \App\Models\Order::where('customer_id', $customer->id)
                                  ->where('store_id', $currentStoreId)
                                  ->get();
        
        $totalOrders = $orders->count();
        $totalSpent = $orders->where('payment_status', 'paid')->sum('total_amount');
        $avgOrderValue = $totalOrders > 0 ? $totalSpent / $totalOrders : 0;
        $lastOrderDate = $orders->max('created_at');
        $pendingOrders = $orders->where('status', 'pending')->count();
        
        // Add calculated stats to customer data
        $customer->total_orders = $totalOrders;
        $customer->total_spent = $totalSpent;
        $customer->avg_order_value = $avgOrderValue;
        $customer->last_order_date = $lastOrderDate;
        $customer->pending_orders = $pendingOrders;
        $customer->full_name = $customer->first_name . ' ' . $customer->last_name;
        $customer->initials = strtoupper(substr($customer->first_name, 0, 1) . substr($customer->last_name, 0, 1));
        
        $billingAddress = $customer->addresses->where('type', 'billing')->first();
        $shippingAddress = $customer->addresses->where('type', 'shipping')->first();
        
        return Inertia::render('customers/show', [
            'customer' => $customer,
            'billingAddress' => $billingAddress,
            'shippingAddress' => $shippingAddress,
            'recentOrders' => $orders->take(5)->map(function($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'total' => $order->total_amount,
                    'status' => $order->status,
                    'date' => $order->created_at->format('M j, Y')
                ];
            })
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