<?php

namespace App\Http\Controllers;

use App\Models\StoreCoupon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class StoreCouponController extends BaseController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);
        
        $query = StoreCoupon::where('store_id', $currentStoreId);

        // Apply search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        // Apply filters
        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Lifecycle view (derived from status + schedule)
        $view = in_array($request->get('view'), ['active', 'scheduled', 'expired', 'paused'], true) ? $request->get('view') : 'all';
        $this->applyStateScope($query, $view);

        $perPage = (int) $request->get('per_page', 10);
        $perPage = $perPage > 0 && $perPage <= 100 ? $perPage : 10;
        $coupons = $query->latest()->paginate($perPage)->withQueryString();

        // Real per-coupon performance from orders that used each code
        $performance = $this->performanceByCode($currentStoreId, $coupons->getCollection()->pluck('code')->all());
        $coupons->getCollection()->transform(function ($coupon) use ($performance) {
            $perf = $performance[$coupon->code] ?? ['orders' => 0, 'discount' => 0, 'revenue' => 0];
            $coupon->setAttribute('performance', $perf);
            $coupon->setAttribute('state', $this->couponState($coupon));
            $coupon->setAttribute('days_left', $coupon->expiry_date ? (int) floor(now()->diffInDays($coupon->expiry_date, false)) : null);
            return $coupon;
        });

        // Get statistics
        $totalCoupons = StoreCoupon::where('store_id', $currentStoreId)->count();
        $activeCoupons = StoreCoupon::where('store_id', $currentStoreId)->where('status', true)->count();
        $percentageCoupons = StoreCoupon::where('store_id', $currentStoreId)->where('type', 'percentage')->count();
        $flatCoupons = StoreCoupon::where('store_id', $currentStoreId)->where('type', 'flat')->count();

        $viewCounts = ['all' => $totalCoupons];
        foreach (['active', 'scheduled', 'expired', 'paused'] as $state) {
            $viewCounts[$state] = $this->applyStateScope(StoreCoupon::where('store_id', $currentStoreId), $state)->count();
        }

        return Inertia::render('coupon-system/index', [
            'coupons' => $coupons,
            'filters' => array_merge($request->only(['search', 'type', 'status', 'per_page']), ['view' => $view]),
            'stats' => [
                'total' => $totalCoupons,
                'active' => $activeCoupons,
                'percentage' => $percentageCoupons,
                'flat' => $flatCoupons
            ],
            'viewCounts' => $viewCounts,
        ]);
    }

    /**
     * Scope a coupon query to a derived lifecycle state.
     * paused = switched off; expired = past expiry; scheduled = starts later; active = running now.
     */
    private function applyStateScope($query, string $state)
    {
        $now = now();
        switch ($state) {
            case 'paused':
                return $query->where('status', false);
            case 'expired':
                return $query->where('status', true)->whereNotNull('expiry_date')->where('expiry_date', '<', $now);
            case 'scheduled':
                return $query->where('status', true)
                    ->where(fn ($q) => $q->whereNull('expiry_date')->orWhere('expiry_date', '>=', $now))
                    ->whereNotNull('start_date')->where('start_date', '>', $now);
            case 'active':
                return $query->where('status', true)
                    ->where(fn ($q) => $q->whereNull('expiry_date')->orWhere('expiry_date', '>=', $now))
                    ->where(fn ($q) => $q->whereNull('start_date')->orWhere('start_date', '<=', $now));
        }
        return $query;
    }

    private function couponState(StoreCoupon $coupon): string
    {
        if (!$coupon->status) {
            return 'paused';
        }
        if ($coupon->expiry_date && $coupon->expiry_date->lt(now())) {
            return 'expired';
        }
        if ($coupon->start_date && $coupon->start_date->gt(now())) {
            return 'scheduled';
        }
        return 'active';
    }

    /**
     * Orders, discount given and sales (excluding cancelled/refunded orders) per coupon code.
     */
    private function performanceByCode($storeId, array $codes): array
    {
        if (empty($codes)) {
            return [];
        }

        return \App\Models\Order::where('store_id', $storeId)
            ->whereIn('coupon_code', $codes)
            ->groupBy('coupon_code')
            ->selectRaw('coupon_code, COUNT(*) as orders, COALESCE(SUM(coupon_discount), 0) as discount')
            ->selectRaw("COALESCE(SUM(CASE WHEN status NOT IN ('cancelled', 'refunded') THEN total_amount ELSE 0 END), 0) as revenue")
            ->get()
            ->mapWithKeys(fn ($r) => [$r->coupon_code => [
                'orders' => (int) $r->orders,
                'discount' => round((float) $r->discount, 2),
                'revenue' => round((float) $r->revenue, 2),
            ]])
            ->all();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);

        return \DB::transaction(function () use ($request, $currentStoreId) {
            $request->validate([
                'name' => 'required|string|max:255',
                'code' => 'required|string|max:50|unique:store_coupons,code',
                'description' => 'nullable|string',
                'type' => 'required|in:percentage,flat',
                'discount_amount' => 'required|numeric|min:0',
                'minimum_spend' => 'nullable|numeric|min:0',
                'maximum_spend' => 'nullable|numeric|min:0',
                'use_limit_per_coupon' => 'nullable|integer|min:1',
                'use_limit_per_user' => 'nullable|integer|min:1',
                'start_date' => 'nullable|date',
                'expiry_date' => 'nullable|date|after_or_equal:today',
                'status' => 'boolean',
            ]);

            $data = $request->all();
            $data['store_id'] = $currentStoreId;
            $data['created_by'] = Auth::id();

            // Generate code if auto-generate is selected
            if ($request->code_type === 'auto') {
                do {
                    $data['code'] = strtoupper(Str::random(10));
                } while (StoreCoupon::where('code', $data['code'])->exists());
            }

            $coupon = StoreCoupon::create($data);

            return redirect()->route('coupon-system.index')->with('success', __('Coupon created successfully!'));
        });
    }

    /**
     * Display the specified resource.
     */
    public function show(StoreCoupon $storeCoupon)
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);
        
        if ($storeCoupon->store_id !== $currentStoreId) {
            abort(403, 'Unauthorized action.');
        }
        
        // Calculate dynamic coupon statistics
        $orders = \App\Models\Order::where('store_id', $currentStoreId)
                                  ->where('coupon_code', $storeCoupon->code)
                                  ->get();
        
        $totalUsage = $orders->count();
        $totalSavings = 0;
        $uniqueUsers = $orders->pluck('customer_id')->unique()->count();
        $recentUsage = $orders->where('created_at', '>=', now()->subDays(30))->count();
        
        // Calculate total savings based on coupon type
        foreach ($orders as $order) {
            if ($storeCoupon->type === 'percentage') {
                $savings = ($order->subtotal * $storeCoupon->discount_amount) / 100;
                // Cap at maximum discount if set
                if ($storeCoupon->maximum_spend && $savings > $storeCoupon->maximum_spend) {
                    $savings = $storeCoupon->maximum_spend;
                }
            } else {
                $savings = $storeCoupon->discount_amount;
            }
            $totalSavings += $savings;
        }
        
        // Update used_count if it's different
        if ($storeCoupon->used_count != $totalUsage) {
            $storeCoupon->update(['used_count' => $totalUsage]);
            $storeCoupon->refresh();
        }
        
        $stats = [
            'total_usage' => $totalUsage,
            'total_savings' => $totalSavings,
            'unique_users' => $uniqueUsers,
            'recent_usage' => $recentUsage,
            'avg_savings_per_use' => $totalUsage > 0 ? $totalSavings / $totalUsage : 0,
            'is_expired' => $storeCoupon->expiry_date && $storeCoupon->expiry_date < now(),
            'days_until_expiry' => $storeCoupon->expiry_date ? now()->diffInDays($storeCoupon->expiry_date, false) : null,
            'usage_percentage' => $storeCoupon->use_limit_per_coupon ? ($totalUsage / $storeCoupon->use_limit_per_coupon) * 100 : 0,
        ];
        
        // Real performance from the orders themselves (read-only)
        $countedOrders = $orders->whereNotIn('status', ['cancelled', 'refunded']);
        $stats['discount_given'] = round((float) $orders->sum('coupon_discount'), 2);
        $stats['revenue'] = round((float) $countedOrders->sum('total_amount'), 2);
        $stats['avg_order_value'] = $countedOrders->count() > 0 ? round((float) $countedOrders->avg('total_amount'), 2) : null;
        $stats['state'] = $this->couponState($storeCoupon);
        $stats['last_used_at'] = optional($orders->max('created_at'))->toIso8601String();

        // Get recent orders using this coupon (newest first)
        $recentOrders = $orders->sortByDesc('created_at')->take(10)->values()->map(function($order) {
            return [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'customer_name' => $order->customer_first_name . ' ' . $order->customer_last_name,
                'total' => $order->total_amount,
                'date' => $order->created_at->format('M j, Y'),
                'created_at' => $order->created_at->toIso8601String(),
                'status' => $order->status,
                'payment_status' => $order->payment_status,
                'coupon_discount' => (float) $order->coupon_discount,
            ];
        });
        
        return Inertia::render('coupon-system/show', [
            'coupon' => $storeCoupon,
            'stats' => $stats,
            'recentOrders' => $recentOrders
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, StoreCoupon $storeCoupon)
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);
        
        if ($storeCoupon->store_id !== $currentStoreId) {
            abort(403, 'Unauthorized action.');
        }
        
        return \DB::transaction(function () use ($request, $storeCoupon) {
            $request->validate([
                'name' => 'required|string|max:255',
                'code' => 'required|string|max:50|unique:store_coupons,code,' . $storeCoupon->id,
                'description' => 'nullable|string',
                'type' => 'required|in:percentage,flat',
                'discount_amount' => 'required|numeric|min:0',
                'minimum_spend' => 'nullable|numeric|min:0',
                'maximum_spend' => 'nullable|numeric|min:0',
                'use_limit_per_coupon' => 'nullable|integer|min:1',
                'use_limit_per_user' => 'nullable|integer|min:1',
                'start_date' => 'nullable|date',
                'expiry_date' => 'nullable|date',
                'status' => 'boolean',
            ]);

            $data = $request->all();

            // Generate new code if switching to auto-generate
            if ($request->code_type === 'auto' && $storeCoupon->code_type !== 'auto') {
                do {
                    $data['code'] = strtoupper(Str::random(10));
                } while (StoreCoupon::where('code', $data['code'])->where('id', '!=', $storeCoupon->id)->exists());
            }

            $storeCoupon->update($data);

            return redirect()->route('coupon-system.index')->with('success', __('Coupon updated successfully!'));
        });
    }

    /**
     * Toggle the status of the specified coupon.
     */
    public function toggleStatus(Request $request, StoreCoupon $storeCoupon)
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);
        
        if ($storeCoupon->store_id !== $currentStoreId) {
            abort(403, 'Unauthorized action.');
        }
        
        $storeCoupon->update([
            'status' => !$storeCoupon->status
        ]);

        if ($request->ajax() || $request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => __('Coupon status updated successfully!'),
                'status' => $storeCoupon->status
            ]);
        }
        
        return redirect()->route('coupon-system.index')->with('success', __('Coupon status updated successfully!'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(StoreCoupon $storeCoupon)
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);
        
        if ($storeCoupon->store_id !== $currentStoreId) {
            abort(403, 'Unauthorized action.');
        }
        
        return \DB::transaction(function () use ($storeCoupon) {
            $storeCoupon->delete();

            return redirect()->route('coupon-system.index')->with('success', __('Coupon deleted successfully!'));
        });
    }

    /**
     * Validate coupon code
     */
    public function validate(Request $request)
    {
        $request->validate([
            'coupon_code' => 'required|string',
            'amount' => 'required|numeric|min:0'
        ]);
        
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);
        
        $coupon = StoreCoupon::where('code', $request->coupon_code)
            ->where('store_id', $currentStoreId)
            ->where('status', 1)
            ->first();
            
        if (!$coupon) {
            return response()->json([
                'valid' => false,
                'message' => __('Invalid or inactive coupon code')
            ], 400);
        }
        
        // Check if coupon is expired
        if ($coupon->expiry_date && $coupon->expiry_date < now()) {
            return response()->json([
                'valid' => false,
                'message' => __('Coupon has expired')
            ], 400);
        }
        
        // Check usage limit
        if ($coupon->use_limit_per_coupon && $coupon->used_count >= $coupon->use_limit_per_coupon) {
            return response()->json([
                'valid' => false,
                'message' => __('Coupon usage limit exceeded')
            ], 400);
        }
        
        // Check minimum amount
        if ($coupon->minimum_spend && $request->amount < $coupon->minimum_spend) {
            return response()->json([
                'valid' => false,
                'message' => __('Minimum spend requirement not met')
            ], 400);
        }
        
        // Check maximum amount
        if ($coupon->maximum_spend && $request->amount > $coupon->maximum_spend) {
            return response()->json([
                'valid' => false,
                'message' => __('Maximum spend limit exceeded')
            ], 400);
        }
        
        return response()->json([
            'valid' => true,
            'coupon' => [
                'id' => $coupon->id,
                'code' => $coupon->code,
                'type' => $coupon->type,
                'value' => $coupon->discount_amount
            ]
        ]);
    }
    
    /**
     * Export coupons data as CSV.
     */
    public function export()
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);
        
        $coupons = StoreCoupon::where('store_id', $currentStoreId)
            ->orderBy('created_at', 'desc')
            ->get();
        
        $csvData = [];
        $csvData[] = ['Coupon Name', 'Code', 'Type', 'Discount Amount', 'Minimum Spend', 'Maximum Spend', 'Usage Limit', 'Used Count', 'Start Date', 'Expiry Date', 'Status', 'Created Date'];
        
        foreach ($coupons as $coupon) {
            $csvData[] = [
                $coupon->name,
                $coupon->code,
                ucfirst($coupon->type),
                $coupon->type === 'percentage' ? $coupon->discount_amount . '%' : formatStoreCurrency($coupon->discount_amount, $user->id, $currentStoreId),
                $coupon->minimum_spend ? formatStoreCurrency($coupon->minimum_spend, $user->id, $currentStoreId) : 'No minimum',
                $coupon->maximum_spend ? formatStoreCurrency($coupon->maximum_spend, $user->id, $currentStoreId) : 'No maximum',
                $coupon->use_limit_per_coupon ?: 'Unlimited',
                $coupon->used_count ?: 0,
                $coupon->start_date ? $coupon->start_date->format('Y-m-d') : 'No start date',
                $coupon->expiry_date ? $coupon->expiry_date->format('Y-m-d') : 'No expiry',
                $coupon->status ? 'Active' : 'Inactive',
                $coupon->created_at->format('Y-m-d H:i:s')
            ];
        }
        
        $filename = 'coupons-export-' . now()->format('Y-m-d') . '.csv';
        
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
