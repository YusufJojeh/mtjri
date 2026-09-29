<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Shipping;
use App\Models\Country;
use App\Models\State;
use App\Models\City;
use Illuminate\Http\Request;
use App\Http\Requests\OrderRequest;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OrderController extends BaseController
{
    /** Allowed list filters for the orders index (read-only query params). */
    private const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    private const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];
    private const ORDER_VIEWS = ['all', 'open', 'unpaid', 'to_ship', 'shipped', 'cancelled'];
    private const ORDER_SORTS = ['newest', 'oldest', 'total'];

    /**
     * Display a listing of orders.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $storeId = getCurrentStoreId($user);

        // Optional, validated list filters. Invalid values are ignored rather than
        // redirecting, so a stale bookmarked URL still renders the list.
        $validator = \Validator::make($request->only(['q', 'status', 'payment', 'view', 'sort']), [
            'q' => 'nullable|string|max:100',
            'status' => 'nullable|in:' . implode(',', self::ORDER_STATUSES),
            'payment' => 'nullable|in:' . implode(',', self::PAYMENT_STATUSES),
            'view' => 'nullable|in:' . implode(',', self::ORDER_VIEWS),
            'sort' => 'nullable|in:' . implode(',', self::ORDER_SORTS),
        ]);
        $valid = $validator->valid();
        $filters = [
            'q' => trim((string) ($valid['q'] ?? '')),
            'status' => $valid['status'] ?? '',
            'payment' => $valid['payment'] ?? '',
            'view' => $valid['view'] ?? 'all',
            'sort' => $valid['sort'] ?? 'newest',
        ];

        // Base query: store scope + search + explicit status/payment filters.
        $base = Order::where('store_id', $storeId);
        if ($filters['q'] !== '') {
            $term = '%' . $filters['q'] . '%';
            $fullName = in_array(\DB::connection()->getDriverName(), ['sqlite', 'pgsql'])
                ? "(COALESCE(customer_first_name, '') || ' ' || COALESCE(customer_last_name, ''))"
                : "CONCAT(COALESCE(customer_first_name, ''), ' ', COALESCE(customer_last_name, ''))";
            $base->where(function ($q) use ($term, $fullName) {
                $q->where('order_number', 'like', $term)
                    ->orWhere('customer_email', 'like', $term)
                    ->orWhere('customer_first_name', 'like', $term)
                    ->orWhere('customer_last_name', 'like', $term)
                    ->orWhereRaw($fullName . ' LIKE ?', [$term]);
            });
        }
        if ($filters['status'] !== '') {
            $base->where('status', $filters['status']);
        }
        if ($filters['payment'] !== '') {
            $base->where('payment_status', $filters['payment']);
        }

        // Per-view counts in one aggregate query (respecting search/filters).
        $countRow = (clone $base)->selectRaw("
            COUNT(*) as all_count,
            SUM(CASE WHEN status IN ('pending','processing') THEN 1 ELSE 0 END) as open_count,
            SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as unpaid_count,
            SUM(CASE WHEN payment_status = 'paid' AND status IN ('pending','processing') THEN 1 ELSE 0 END) as to_ship_count,
            SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped_count,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count
        ")->first();
        $counts = [
            'all' => (int) ($countRow->all_count ?? 0),
            'open' => (int) ($countRow->open_count ?? 0),
            'unpaid' => (int) ($countRow->unpaid_count ?? 0),
            'to_ship' => (int) ($countRow->to_ship_count ?? 0),
            'shipped' => (int) ($countRow->shipped_count ?? 0),
            'cancelled' => (int) ($countRow->cancelled_count ?? 0),
        ];

        $list = clone $base;
        switch ($filters['view']) {
            case 'open':
                $list->whereIn('status', ['pending', 'processing']);
                break;
            case 'unpaid':
                $list->where('payment_status', 'pending');
                break;
            case 'to_ship':
                $list->where('payment_status', 'paid')->whereIn('status', ['pending', 'processing']);
                break;
            case 'shipped':
                $list->where('status', 'shipped');
                break;
            case 'cancelled':
                $list->where('status', 'cancelled');
                break;
        }
        switch ($filters['sort']) {
            case 'oldest':
                $list->orderBy('created_at', 'asc')->orderBy('id', 'asc');
                break;
            case 'total':
                $list->orderBy('total_amount', 'desc')->orderBy('id', 'desc');
                break;
            default:
                $list->orderBy('created_at', 'desc')->orderBy('id', 'desc');
        }

        $orders = $list->withCount('items')->paginate(25)->withQueryString();

        // Calculate stats from ALL orders (not just paginated)
        $totalOrders = Order::where('store_id', $storeId)->count();
        $pendingOrders = Order::where('store_id', $storeId)->where('status', 'pending')->count();
        $totalRevenue = Order::where('store_id', $storeId)->where('payment_status', 'paid')->sum('total_amount');
        $avgOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;

        $formattedOrders = collect($orders->items())->map(function ($order) {
            return [
                'id' => $order->id,
                'orderNumber' => $order->order_number,
                'customer' => trim($order->customer_first_name . ' ' . $order->customer_last_name),
                'email' => $order->customer_email,
                'total' => (float) $order->total_amount,
                'status' => strtolower((string) $order->status),
                'paymentStatus' => strtolower((string) $order->payment_status),
                'items' => (int) $order->items_count,
                'createdAt' => optional($order->created_at)->toIso8601String(),
                'paymentMethod' => $order->payment_method,
            ];
        })->values();

        return Inertia::render('orders/index', [
            'orders' => $formattedOrders,
            'pagination' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
                'from' => $orders->firstItem(),
                'to' => $orders->lastItem(),
            ],
            'counts' => $counts,
            'filters' => $filters,
            'stats' => [
                'totalOrders' => $totalOrders,
                'pendingOrders' => $pendingOrders,
                'totalRevenue' => $totalRevenue,
                'avgOrderValue' => $avgOrderValue,
            ]
        ]);
    }

    /** Resolve a location column that may hold either a name or a numeric id. */
    private function locationName(?string $value, string $model): ?string
    {
        if ($value === null || $value === '' || !is_numeric($value)) {
            return $value;
        }
        $row = $model::find($value);
        return $row ? $row->name : $value;
    }

    /**
     * Display the specified order.
     */
    public function show($id)
    {
        $user = Auth::user();
        $storeId = getCurrentStoreId($user);

        $order = Order::where('store_id', $storeId)
            ->where('id', $id)
            ->with(['items.product', 'shippingMethod'])
            ->firstOrFail();

        $name = trim($order->customer_first_name . ' ' . $order->customer_last_name);

        // Only link to the customer profile when that customer exists in this store.
        $customerId = null;
        if ($order->customer_id) {
            $customerId = Customer::where('store_id', $storeId)->where('id', $order->customer_id)->value('id');
        }

        $hasBilling = $order->billing_address || $order->billing_city || $order->billing_postal_code || $order->billing_country;

        $formattedOrder = [
            'id' => $order->id,
            'orderNumber' => $order->order_number,
            // Raw backend enums (lowercase) — presentation happens in the UI.
            'status' => strtolower((string) $order->status),
            'paymentStatus' => strtolower((string) $order->payment_status),
            'paymentMethod' => $order->payment_method,
            'paymentGateway' => $order->payment_gateway,
            'transactionId' => $order->payment_transaction_id,
            'customerId' => $customerId,
            'customer' => [
                'name' => $name,
                'email' => $order->customer_email,
                'phone' => $order->customer_phone,
            ],
            'shippingAddress' => [
                'name' => $name,
                'street' => $order->shipping_address,
                'city' => $this->locationName($order->shipping_city, City::class),
                'state' => $this->locationName($order->shipping_state, State::class),
                'zip' => $order->shipping_postal_code,
                'country' => $this->locationName($order->shipping_country, Country::class),
            ],
            'billingAddress' => $hasBilling ? [
                'name' => $name,
                'street' => $order->billing_address,
                'city' => $this->locationName($order->billing_city, City::class),
                'state' => $this->locationName($order->billing_state, State::class),
                'zip' => $order->billing_postal_code,
                'country' => $this->locationName($order->billing_country, Country::class),
            ] : null,
            'items' => $order->items->map(function ($item) {
                $variants = $item->product_variants;
                if (is_string($variants)) {
                    $variants = json_decode($variants, true);
                }
                return [
                    'id' => $item->id,
                    'productId' => $item->product_id,
                    'name' => $item->product_name,
                    'sku' => $item->product_sku,
                    'quantity' => (int) $item->quantity,
                    'price' => (float) $item->unit_price,
                    'lineTotal' => (float) ($item->total_price ?? ($item->unit_price * $item->quantity)),
                    'variants' => is_array($variants) && count($variants) ? $variants : null,
                    'image' => $item->product->cover_image ?? null,
                ];
            })->values(),
            'summary' => [
                'subtotal' => (float) $order->subtotal,
                'shipping' => (float) $order->shipping_amount,
                'tax' => (float) $order->tax_amount,
                'discount' => (float) $order->discount_amount,
                'couponCode' => $order->coupon_code,
                'total' => (float) $order->total_amount,
            ],
            'shippingMethod' => $order->shippingMethod->name ?? null,
            'trackingNumber' => $order->tracking_number,
            'notes' => $order->notes,
            // Real timestamps only (ISO 8601). Null when the event has not happened.
            'createdAt' => optional($order->created_at)->toIso8601String(),
            'updatedAt' => optional($order->updated_at)->toIso8601String(),
            'shippedAt' => optional($order->shipped_at)->toIso8601String(),
            'deliveredAt' => optional($order->delivered_at)->toIso8601String(),
        ];

        return Inertia::render('orders/show', [
            'order' => $formattedOrder
        ]);
    }

    /**
     * Show the form for editing the specified order.
     */
    public function edit($id)
    {
        $user = Auth::user();
        $storeId = getCurrentStoreId($user);
        
        $order = Order::where('store_id', $storeId)
            ->where('id', $id)
            ->with(['items.product', 'shippingMethod'])
            ->firstOrFail();
            
        // Get customers for dropdown
        $customers = Customer::where('store_id', $storeId)
            ->select('id', 'first_name', 'last_name', 'email')
            ->get()
            ->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'name' => $customer->first_name . ' ' . $customer->last_name,
                    'email' => $customer->email,
                ];
            });
            
        // If order has no customer_id but has email, try to find matching customer
        if (!$order->customer_id && $order->customer_email) {
            $matchingCustomer = $customers->firstWhere('email', $order->customer_email);
            if ($matchingCustomer) {
                $order->customer_id = $matchingCustomer['id'];
            }
        }
            
        // Get products for dropdown
        $products = Product::where('store_id', $storeId)
            ->where('is_active', true)
            ->select('id', 'name', 'price', 'sale_price')
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'price' => (float) ($product->sale_price ?? $product->price),
                ];
            });
            
        // Get shipping methods
        $shippingMethods = Shipping::where('store_id', $storeId)
            ->where('is_active', true)
            ->select('id', 'name', 'cost')
            ->get();
            
        // Update products to include variants
        $products = Product::where('store_id', $storeId)
            ->where('is_active', true)
            ->select('id', 'name', 'price', 'sale_price', 'variants')
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'price' => (float) ($product->sale_price ?? $product->price),
                    'variants' => is_string($product->variants) ? json_decode($product->variants, true) : ($product->variants ?? []),
                ];
            });
        
        $formattedOrder = [
            'id' => $order->id,
            'orderNumber' => $order->order_number,
            'status' => $order->status,
            'paymentStatus' => $order->payment_status,
            'paymentMethod' => $order->payment_method,
            'customer' => [
                'id' => $order->customer_id,
                'name' => $order->customer_first_name . ' ' . $order->customer_last_name,
                'email' => $order->customer_email,
                'phone' => $order->customer_phone,
            ],
            'shippingAddress' => [
                'address' => $order->shipping_address,
                'city' => \App\Models\City::find($order->shipping_city)->name ?? $order->shipping_city,
                'state' => \App\Models\State::find($order->shipping_state)->name ?? $order->shipping_state,
                'postalCode' => $order->shipping_postal_code,
                'country' => \App\Models\Country::find($order->shipping_country)->name ?? $order->shipping_country,
            ],
            'items' => $order->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'productId' => $item->product_id,
                    'name' => $item->product_name,
                    'quantity' => $item->quantity,
                    'price' => (float) $item->unit_price,
                ];
            }),
            'summary' => [
                'subtotal' => (float) $order->subtotal,
                'shipping' => (float) $order->shipping_amount,
                'tax' => (float) $order->tax_amount,
                'total' => (float) $order->total_amount,
            ],
            'shippingMethodId' => $order->shipping_method_id,
            'trackingNumber' => $order->tracking_number,
            'notes' => $order->notes,
        ];
        
        return Inertia::render('orders/edit', [
            'order' => $formattedOrder,
            'customers' => $customers,
            'products' => $products,
            'shippingMethods' => $shippingMethods,
        ]);
    }

    /**
     * Update the specified order.
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $storeId = getCurrentStoreId($user);

        $order = Order::where('store_id', $storeId)
            ->where('id', $id)
            ->firstOrFail();

        return \DB::transaction(function () use ($request, $order) {
            // VALIDATION ADDED - Security Fix
            $validated = $request->validate([
                'status' => 'required|in:pending,processing,shipped,delivered,cancelled',
                'payment_status' => 'required|in:pending,paid,failed,refunded',
                'tracking_number' => 'nullable|string|max:255',
                'notes' => 'nullable|string|max:1000',
                'items' => 'nullable|array',
                'items.*.id' => 'required_with:items|integer',
                'items.*.variants' => 'nullable|array',
            ]);

            $order->update([
                'status' => $validated['status'],
                'payment_status' => $validated['payment_status'],
                'tracking_number' => $validated['tracking_number'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);
            
            // Update order items if provided
            if ($request->has('items')) {
                foreach ($request->items as $itemData) {
                    if (isset($itemData['id'])) {
                        $orderItem = $order->items()->find($itemData['id']);
                        if ($orderItem && isset($itemData['variants'])) {
                            $orderItem->update([
                                'product_variants' => json_encode($itemData['variants'])
                            ]);
                        }
                    }
                }
            }
            
            return redirect()->route('orders.show', $order->id)->with('success', 'Order updated successfully.');
        });
    }

    /**
     * Remove the specified order.
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $storeId = getCurrentStoreId($user);
        
        $order = Order::where('store_id', $storeId)
            ->where('id', $id)
            ->firstOrFail();
            
        // Authorization check
        $this->authorize('delete', $order);

        return \DB::transaction(function () use ($order) {
            $order->delete();
            
            return redirect()->route('orders.index')->with('success', 'Order deleted successfully.');
        });
    }
    
    /**
     * Export orders data as CSV.
     */
    public function export()
    {
        $user = Auth::user();
        $storeId = getCurrentStoreId($user);
        
        $orders = Order::where('store_id', $storeId)
            ->with(['customer', 'items.product'])
            ->orderBy('created_at', 'desc')
            ->get();
        
        $csvData = [];
        $csvData[] = ['Order Number', 'Customer Name', 'Email', 'Phone', 'Status', 'Payment Status', 'Payment Method', 'Items Count', 'Subtotal', 'Tax', 'Shipping', 'Total', 'Shipping Address', 'Order Date'];
        
        foreach ($orders as $order) {
            $shippingAddress = $order->shipping_address . ', ' . 
                (City::find($order->shipping_city)->name ?? $order->shipping_city) . ', ' . 
                (State::find($order->shipping_state)->name ?? $order->shipping_state) . ' ' . 
                $order->shipping_postal_code . ', ' . 
                (Country::find($order->shipping_country)->name ?? $order->shipping_country);
                
            $csvData[] = [
                $order->order_number,
                $order->customer_first_name . ' ' . $order->customer_last_name,
                $order->customer_email,
                $order->customer_phone ?: 'Not provided',
                ucfirst($order->status),
                ucfirst($order->payment_status),
                $order->payment_method === 'cod' ? 'Cash on Delivery' : ucfirst(str_replace('_', ' ', $order->payment_method)),
                $order->items->count(),
                formatStoreCurrency($order->subtotal, $user->id, $storeId),
                formatStoreCurrency($order->tax_amount, $user->id, $storeId),
                formatStoreCurrency($order->shipping_amount, $user->id, $storeId),
                formatStoreCurrency($order->total_amount, $user->id, $storeId),
                $shippingAddress,
                $order->created_at->format('Y-m-d H:i:s')
            ];
        }
        
        $filename = 'orders-export-' . now()->format('Y-m-d') . '.csv';
        
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