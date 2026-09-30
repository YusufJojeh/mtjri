<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Store;
use App\Models\Order;
use App\Models\Product;
use App\Models\Customer;
use App\Models\OrderItem;
use App\Models\User;
use App\Models\Plan;
use App\Models\PlanOrder;
use App\Models\PlanRequest;
use App\Models\Coupon;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        
        // Super admin always gets full dashboard
        if ($user->type === 'superadmin' || $user->type === 'super admin') {
            return $this->renderDashboard(true);
        }
        
        // Company users always get full dashboard
        if ($user->type === 'company') {
            return $this->renderDashboard(true);
        }
        
        // Check if user has dashboard permission
        if ($user->can('manage-dashboard')) {
            return $this->renderDashboard(true);
        }
        
        // Show default dashboard for users without permission
        return $this->renderDefaultDashboard();
    }
    
    public function redirectToFirstAvailablePage()
    {
        $user = auth()->user();
        
        // Define available routes with their permissions
        $routes = [
            ['route' => 'users.index', 'permission' => 'manage-users'],
            ['route' => 'roles.index', 'permission' => 'manage-roles'],





            ['route' => 'plans.index', 'permission' => 'manage-plans'],
            ['route' => 'referral.index', 'permission' => 'manage-referral'],
            ['route' => 'settings.index', 'permission' => 'manage-settings'],
        ];
        
        // Find first available route
        foreach ($routes as $routeData) {
            if ($user->hasPermissionTo($routeData['permission'])) {
                return redirect()->route($routeData['route']);
            }
        }
        
        // If no permissions found, logout user
        auth()->logout();
        return redirect()->route('login')->with('error', __('No access permissions found.'));
    }
    
    private function renderDashboard($hasPermission = true)
    {
        $user = auth()->user();
        
        // Super Admin gets system-wide dashboard
        if ($user->isSuperAdmin()) {
            return Inertia::render('dashboard', [
                'dashboardData' => $this->getSuperAdminDashboardData(),
                'currentStore' => null,
                'isSuperAdmin' => true,
                'hasPermission' => true
            ]);
        }
        
        // Regular users get store-based dashboard
        $storeId = getCurrentStoreId($user);
        
        if (!$storeId) {
            return Inertia::render('dashboard', [
                'dashboardData' => $this->getEmptyDashboard(),
                'currentStore' => null,
                'isSuperAdmin' => false,
                'hasPermission' => $hasPermission
            ]);
        }
        
        $currentStore = Store::find($storeId);
        $dashboardData = $this->getDashboardData($storeId);
        $dashboardData['commandCenter'] = $this->getCommandCenter($storeId, $user);
        $dashboardData['tijraa'] = $this->getTijraaSummary($currentStore, $user);
        
        return Inertia::render('dashboard', [
            'dashboardData' => $dashboardData,
            'currentStore' => $currentStore,
            'storeUrl' => url('/store/' . $currentStore->slug),
            'isSuperAdmin' => false,
            'hasPermission' => $hasPermission
        ]);
    }
    
    private function renderDefaultDashboard()
    {
        return Inertia::render('default-dashboard', [
            'message' => 'Welcome! You have limited access to the system.',
            'availableActions' => $this->getAvailableActions()
        ]);
    }
    
    private function getAvailableActions()
    {
        $user = auth()->user();
        $actions = [];
        
        // Check available permissions and suggest actions
        if ($user->can('view-stores')) {
            $actions[] = ['title' => 'Stores', 'route' => 'stores.index', 'description' => 'Manage your stores'];
        }
        if ($user->can('view-products')) {
            $actions[] = ['title' => 'Products', 'route' => 'products.index', 'description' => 'Manage products'];
        }
        if ($user->can('view-orders')) {
            $actions[] = ['title' => 'Orders', 'route' => 'orders.index', 'description' => 'View orders'];
        }
        if ($user->can('view-customers')) {
            $actions[] = ['title' => 'Customers', 'route' => 'customers.index', 'description' => 'Manage customers'];
        }
        
        return $actions;
    }
    
    private function getDashboardData($storeId)
    {
        $currentMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();
        
        $totalOrders = Order::where('store_id', $storeId)->count();
        $totalProducts = Product::where('store_id', $storeId)->count();
        $totalCustomers = Customer::where('store_id', $storeId)->count();
        $totalRevenue = Order::where('store_id', $storeId)->sum('total_amount');
        
        $recentOrders = Order::where('store_id', $storeId)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer' => $order->customer_first_name . ' ' . $order->customer_last_name,
                    'amount' => $order->total_amount,
                    'status' => $order->status,
                    'date' => $order->created_at->diffForHumans()
                ];
            });
            
        $topProducts = OrderItem::select('product_id', 'product_name')
            ->selectRaw('SUM(quantity) as total_sold')
            ->whereHas('order', function($query) use ($storeId) {
                $query->where('store_id', $storeId);
            })
            ->groupBy('product_id', 'product_name')
            ->orderBy('total_sold', 'desc')
            ->limit(5)
            ->get()
            ->map(function($item) {
                $product = Product::find($item->product_id);
                return [
                    'id' => $item->product_id,
                    'name' => $item->product_name,
                    'sold' => $item->total_sold,
                    'price' => $product ? $product->price : 0
                ];
            });
        
        return [
            'metrics' => [
                'orders' => $totalOrders,
                'products' => $totalProducts,
                'customers' => $totalCustomers,
                'revenue' => $totalRevenue
            ],
            'recentOrders' => $recentOrders,
            'topProducts' => $topProducts
        ];
    }
    
    /**
     * Merchant command center: everything the home screen needs to answer
     * "how is the store doing, what needs attention, what next?".
     * Read-only; every figure is derived from real store records.
     *
     * "Sales" = order totals excluding cancelled orders and failed/refunded
     * payments, consistently across KPIs, trend and top products.
     */
    private function getCommandCenter(int $storeId, $user): array
    {
        $now = Carbon::now();
        $days = 30;
        $start = $now->copy()->subDays($days - 1)->startOfDay();
        $prevStart = $start->copy()->subDays($days);
        $todayStart = $now->copy()->startOfDay();
        $yesterdayStart = $todayStart->copy()->subDay();

        $salesScope = function ($q) use ($storeId) {
            $q->where('store_id', $storeId)
                ->where('status', '!=', 'cancelled')
                ->whereNotIn('payment_status', ['failed', 'refunded']);
        };

        $periodTotals = function (Carbon $from, Carbon $to) use ($salesScope) {
            $row = Order::query()->where($salesScope)
                ->whereBetween('created_at', [$from, $to])
                ->selectRaw('COUNT(*) as orders, COALESCE(SUM(total_amount),0) as sales')
                ->first();
            return ['orders' => (int) $row->orders, 'sales' => round((float) $row->sales, 2)];
        };

        $current = $periodTotals($start, $now);
        $previous = $periodTotals($prevStart, $start->copy()->subSecond());
        $today = $periodTotals($todayStart, $now);
        $yesterdaySameTime = $periodTotals($yesterdayStart, $now->copy()->subDay());

        $newCustomers = Customer::where('store_id', $storeId)->whereBetween('created_at', [$start, $now])->count();
        $prevNewCustomers = Customer::where('store_id', $storeId)->whereBetween('created_at', [$prevStart, $start->copy()->subSecond()])->count();

        // Daily series (current + previous period aligned by day index).
        $dailyRows = Order::query()->where($salesScope)
            ->whereBetween('created_at', [$prevStart, $now])
            ->get(['created_at', 'total_amount'])
            ->groupBy(fn ($o) => $o->created_at->toDateString());
        $series = [];
        for ($i = 0; $i < $days; $i++) {
            $d = $start->copy()->addDays($i)->toDateString();
            $pd = $prevStart->copy()->addDays($i)->toDateString();
            $cur = $dailyRows->get($d, collect());
            $prev = $dailyRows->get($pd, collect());
            $series[] = [
                'date' => $d,
                'sales' => round((float) $cur->sum('total_amount'), 2),
                'orders' => $cur->count(),
                'prevSales' => round((float) $prev->sum('total_amount'), 2),
            ];
        }

        // Top products by sales in the period.
        $topProducts = OrderItem::query()
            ->select('product_id', 'product_name')
            ->selectRaw('SUM(quantity) as units, SUM(total_price) as revenue')
            ->whereHas('order', fn ($o) => $o->where($salesScope)->whereBetween('created_at', [$start, $now]))
            ->groupBy('product_id', 'product_name')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get();
        $productInfo = Product::whereIn('id', $topProducts->pluck('product_id'))->get(['id', 'cover_image', 'stock'])->keyBy('id');
        $topProducts = $topProducts->map(fn ($r) => [
            'id' => $r->product_id,
            'name' => $r->product_name,
            'units' => (int) $r->units,
            'revenue' => round((float) $r->revenue, 2),
            'image' => $productInfo[$r->product_id]->cover_image ?? null,
            'stock' => isset($productInfo[$r->product_id]) ? (int) $productInfo[$r->product_id]->stock : null,
        ])->values();

        $recentOrders = Order::where('store_id', $storeId)
            ->latest()
            ->limit(6)
            ->get(['id', 'order_number', 'customer_first_name', 'customer_last_name', 'total_amount', 'status', 'payment_status', 'created_at'])
            ->map(fn ($o) => [
                'id' => $o->id,
                'number' => $o->order_number,
                'customer' => trim($o->customer_first_name . ' ' . $o->customer_last_name),
                'total' => (float) $o->total_amount,
                'status' => $o->status,
                'paymentStatus' => $o->payment_status,
                'createdAt' => optional($o->created_at)->toIso8601String(),
            ]);

        // ---- Needs attention (only counts > 0 are returned) -------------------
        $threshold = (int) \App\Models\Setting::getSetting('low_stock_threshold', $user->id, $storeId, 20);
        $open = fn () => Order::where('store_id', $storeId)->whereIn('status', ['pending', 'processing']);

        $readyToShip = (clone $open())->where('payment_status', 'paid');
        $staleCutoff = $now->copy()->subHours(48);
        $stale = (clone $open())->where('created_at', '<', $staleCutoff);
        $failed = Order::where('store_id', $storeId)->where('payment_status', 'failed')->where('status', '!=', 'cancelled')->where('created_at', '>=', $now->copy()->subDays(30));
        $unpaidShipped = Order::where('store_id', $storeId)->whereIn('status', ['shipped', 'delivered'])->where('payment_status', 'pending');
        $outOfStock = Product::where('store_id', $storeId)->where('is_active', true)->where('is_downloadable', false)->where('stock', '<=', 0);
        $lowStock = Product::where('store_id', $storeId)->where('is_active', true)->where('is_downloadable', false)->where('stock', '>', 0)->where('stock', '<=', $threshold);
        $expiringCoupons = \App\Models\StoreCoupon::where('store_id', $storeId)->where('status', true)
            ->whereNotNull('expiry_date')->whereBetween('expiry_date', [$todayStart, $now->copy()->addDays(7)->endOfDay()]);

        $attention = [];
        $push = function (string $id, string $severity, int $count, ?float $amount, string $href, array $extra = []) use (&$attention) {
            if ($count > 0) {
                $attention[] = array_merge(['id' => $id, 'severity' => $severity, 'count' => $count, 'amount' => $amount === null ? null : round($amount, 2), 'href' => $href], $extra);
            }
        };
        $push('payment_failed', 'critical', $failed->count(), (float) $failed->sum('total_amount'), route('orders.index', ['view' => 'all', 'payment' => 'failed']));
        $push('ready_to_ship', 'high', $readyToShip->count(), (float) $readyToShip->sum('total_amount'), route('orders.index', ['view' => 'to_ship']));
        $push('stale_orders', 'high', $stale->count(), (float) $stale->sum('total_amount'), route('orders.index', ['view' => 'open', 'sort' => 'oldest']), ['hours' => 48]);
        $push('unpaid_fulfilled', 'medium', $unpaidShipped->count(), (float) $unpaidShipped->sum('total_amount'), route('orders.index', ['view' => 'unpaid']));
        $push('out_of_stock', 'high', $outOfStock->count(), null, route('inventory.index', ['view' => 'out']), [
            'items' => $outOfStock->limit(3)->pluck('name'),
        ]);
        $push('low_stock', 'medium', $lowStock->count(), null, route('inventory.index', ['view' => 'low']), [
            'threshold' => $threshold,
            'items' => $lowStock->orderBy('stock')->limit(3)->pluck('name'),
        ]);
        $push('coupons_expiring', 'low', $expiringCoupons->count(), null, route('coupon-system.index'), [
            'items' => $expiringCoupons->orderBy('expiry_date')->limit(3)->pluck('code'),
        ]);

        // ---- Setup progress ---------------------------------------------------
        $productCount = Product::where('store_id', $storeId)->count();
        $setup = [
            ['id' => 'product', 'done' => $productCount > 0, 'href' => route('products.create')],
            ['id' => 'shipping', 'done' => \App\Models\Shipping::where('store_id', $storeId)->where('is_active', true)->exists(), 'href' => route('shipping.index')],
            ['id' => 'discount', 'done' => \App\Models\StoreCoupon::where('store_id', $storeId)->exists(), 'href' => route('coupon-system.create')],
            ['id' => 'first_order', 'done' => Order::where('store_id', $storeId)->exists(), 'href' => null],
        ];

        // ---- Customers ---------------------------------------------------------
        $buyerOrders = Order::query()->where($salesScope)->whereBetween('created_at', [$start, $now])
            ->get(['customer_email', 'customer_id'])
            ->map(fn ($o) => $o->customer_id ?: strtolower((string) $o->customer_email))
            ->filter();
        $buyers = $buyerOrders->unique()->count();
        $repeatBuyers = $buyerOrders->countBy()->filter(fn ($c) => $c > 1)->count();

        return [
            'periodDays' => $days,
            'today' => $today,
            'yesterdaySameTime' => $yesterdaySameTime,
            'kpis' => [
                'sales' => ['current' => $current['sales'], 'previous' => $previous['sales']],
                'orders' => ['current' => $current['orders'], 'previous' => $previous['orders']],
                'aov' => [
                    'current' => $current['orders'] ? round($current['sales'] / $current['orders'], 2) : 0,
                    'previous' => $previous['orders'] ? round($previous['sales'] / $previous['orders'], 2) : 0,
                ],
                'newCustomers' => ['current' => $newCustomers, 'previous' => $prevNewCustomers],
            ],
            'series' => $series,
            'openOrders' => $open()->count(),
            'attention' => $attention,
            'topProducts' => $topProducts,
            'recentOrders' => $recentOrders,
            'buyers' => ['total' => $buyers, 'repeat' => $repeatBuyers],
            'setup' => $setup,
            'catalog' => [
                'products' => $productCount,
                'active' => Product::where('store_id', $storeId)->where('is_active', true)->count(),
                'lowStockThreshold' => $threshold,
            ],
            'generatedAt' => $now->toIso8601String(),
        ];
    }

    private function getSuperAdminDashboardData()
    {
        $currentMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();
        
        // System-wide metrics
        $totalCompanies = User::where('type', 'company')->count();
        $totalPlans = Plan::count();
        $activePlans = Plan::where('is_plan_enable', 'on')->count();
        $totalRevenue = PlanOrder::where('status', 'approved')->sum('final_price');
        $monthlyRevenue = PlanOrder::where('status', 'approved')
            ->where('created_at', '>=', $currentMonth)
            ->sum('final_price');
        $lastMonthRevenue = PlanOrder::where('status', 'approved')
            ->whereBetween('created_at', [$lastMonth, $currentMonth])
            ->sum('final_price');
        
        $monthlyGrowth = $lastMonthRevenue > 0 
            ? (($monthlyRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100 
            : 0;
        
        // In demo mode, show only positive growth values
        if (config('app.is_demo', false) && $monthlyGrowth < 0) {
            $monthlyGrowth = abs($monthlyGrowth);
        }
        
        // Plan orders
        $pendingOrders = PlanOrder::where('status', 'pending')->count();
        $approvedOrders = PlanOrder::where('status', 'approved')->count();
        $totalOrders = PlanOrder::count();
        
        // Plan requests
        $pendingRequests = PlanRequest::where('status', 'pending')->count();
        
        // Coupons
        $activeCoupons = Coupon::where('status', true)
            ->where(function($query) {
                $query->whereNull('expiry_date')
                      ->orWhere('expiry_date', '>=', now());
            })
            ->count();
        $totalCoupons = Coupon::count();
        
        // Recent activities (plan orders) - Get diverse activities from different companies
        $recentOrders = PlanOrder::with(['user', 'plan'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('user_id')
            ->map(function($userOrders) {
                return $userOrders->first(); // Get the most recent order for each user
            })
            ->take(5)
            ->map(function($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'company' => $order->user->name,
                    'plan' => $order->plan->name,
                    'amount' => $order->final_price,
                    'status' => $order->status,
                    'date' => $order->created_at->diffForHumans()
                ];
            })
            ->values();
        
        // Top performing plans
        $topPlans = PlanOrder::select('plan_id')
            ->selectRaw('COUNT(*) as order_count, SUM(final_price) as total_revenue')
            ->where('status', 'approved')
            ->with('plan')
            ->groupBy('plan_id')
            ->orderBy('total_revenue', 'desc')
            ->limit(5)
            ->get()
            ->map(function($item) {
                return [
                    'id' => $item->plan_id,
                    'name' => $item->plan->name,
                    'orders' => $item->order_count,
                    'revenue' => $item->total_revenue,
                    'price' => $item->plan->price
                ];
            });
        
        return [
            'metrics' => [
                'totalCompanies' => $totalCompanies,
                'totalPlans' => $totalPlans,
                'activePlans' => $activePlans,
                'totalRevenue' => $totalRevenue,
                'monthlyRevenue' => $monthlyRevenue,
                'monthlyGrowth' => round($monthlyGrowth, 2),
                'pendingRequests' => $pendingRequests,
                'pendingOrders' => $pendingOrders,
                'approvedOrders' => $approvedOrders,
                'totalOrders' => $totalOrders,
                'activeCoupons' => $activeCoupons,
                'totalCoupons' => $totalCoupons
            ],
            'recentOrders' => $recentOrders,
            'topPlans' => $topPlans,
            'systemStats' => [
                'totalUsers' => User::count(),
                'activeUsers' => User::where('is_enable_login', 1)->count(),
                'totalStores' => \App\Models\Store::count(),
                'activeStores' => \App\Models\Store::where('is_active', true)->count()
            ]
        ];
    }
    
    private function getEmptyDashboard()
    {
        return [
            'metrics' => [
                'orders' => 0,
                'products' => 0,
                'customers' => 0,
                'revenue' => 0
            ],
            'recentOrders' => [],
            'topProducts' => []
        ];
    }
    
    public function export()
    {
        $user = auth()->user();
        
        if ($user->isSuperAdmin()) {
            return $this->exportSuperAdminDashboard();
        }
        
        $storeId = getCurrentStoreId($user);
        
        if (!$storeId) {
            return response()->json(['error' => 'No store selected'], 400);
        }
        
        $store = Store::find($storeId);
        $dashboardData = $this->getDashboardData($storeId);
        
        $csvData = [];
        $csvData[] = ['Dashboard Export - ' . $store->name];
        $csvData[] = ['Generated on: ' . now()->format('Y-m-d H:i:s')];
        $csvData[] = [];
        
        // Metrics
        $csvData[] = ['METRICS'];
        $csvData[] = ['Total Orders', $dashboardData['metrics']['orders']];
        $csvData[] = ['Total Products', $dashboardData['metrics']['products']];
        $csvData[] = ['Total Customers', $dashboardData['metrics']['customers']];
        $csvData[] = ['Total Revenue', formatStoreCurrency($dashboardData['metrics']['revenue'], $user->id, $storeId)];
        $csvData[] = [];
        
        // Recent Orders
        $csvData[] = ['RECENT ORDERS'];
        $csvData[] = ['Order Number', 'Customer', 'Amount', 'Status'];
        foreach ($dashboardData['recentOrders'] as $order) {
            $csvData[] = [$order['order_number'], $order['customer'], formatStoreCurrency($order['amount'], $user->id, $storeId), $order['status']];
        }
        $csvData[] = [];
        
        // Top Products
        $csvData[] = ['TOP PRODUCTS'];
        $csvData[] = ['Product Name', 'Units Sold', 'Price'];
        foreach ($dashboardData['topProducts'] as $product) {
            $csvData[] = [$product['name'], $product['sold'], formatStoreCurrency($product['price'], $user->id, $storeId)];
        }
        
        $filename = 'dashboard-export-' . $store->slug . '-' . now()->format('Y-m-d') . '.csv';
        
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
    
    private function exportSuperAdminDashboard()
    {
        $dashboardData = $this->getSuperAdminDashboardData();
        
        $csvData = [];
        $csvData[] = ['Super Admin Dashboard Export'];
        $csvData[] = ['Generated on: ' . now()->format('Y-m-d H:i:s')];
        $csvData[] = [];
        
        // System Metrics
        $csvData[] = ['SYSTEM OVERVIEW'];
        $csvData[] = ['Total Companies', $dashboardData['metrics']['totalCompanies']];
        $csvData[] = ['Total Revenue', '$' . number_format($dashboardData['metrics']['totalRevenue'], 2)];
        $csvData[] = ['Monthly Growth', $dashboardData['metrics']['monthlyGrowth'] . '%'];
        $csvData[] = ['Monthly Revenue', '$' . number_format($dashboardData['metrics']['monthlyRevenue'], 2)];
        $csvData[] = [];
        
        // Plan Management
        $csvData[] = ['PLAN MANAGEMENT'];
        $csvData[] = ['Active Plans', $dashboardData['metrics']['activePlans']];
        $csvData[] = ['Total Plans', $dashboardData['metrics']['totalPlans']];
        $csvData[] = ['Approved Orders', $dashboardData['metrics']['approvedOrders']];
        $csvData[] = ['Pending Orders', $dashboardData['metrics']['pendingOrders']];
        $csvData[] = ['Pending Requests', $dashboardData['metrics']['pendingRequests']];
        $csvData[] = [];
        
        // System Features
        $csvData[] = ['SYSTEM FEATURES'];
        $csvData[] = ['Active Coupons', $dashboardData['metrics']['activeCoupons']];
        $csvData[] = ['Total Coupons', $dashboardData['metrics']['totalCoupons']];
        if (isset($dashboardData['systemStats'])) {
            $csvData[] = ['Total Users', $dashboardData['systemStats']['totalUsers']];
            $csvData[] = ['Active Users', $dashboardData['systemStats']['activeUsers']];
            $csvData[] = ['Total Stores', $dashboardData['systemStats']['totalStores']];
            $csvData[] = ['Active Stores', $dashboardData['systemStats']['activeStores']];
        }
        $csvData[] = [];
        
        // Recent Orders
        $csvData[] = ['RECENT PLAN ORDERS'];
        $csvData[] = ['Order Number', 'Company', 'Plan', 'Amount', 'Status'];
        foreach ($dashboardData['recentOrders'] as $order) {
            $csvData[] = [$order['order_number'], $order['company'], $order['plan'], '$' . number_format($order['amount'], 2), $order['status']];
        }
        $csvData[] = [];
        
        // Top Plans
        if (!empty($dashboardData['topPlans'])) {
            $csvData[] = ['TOP PERFORMING PLANS'];
            $csvData[] = ['Plan Name', 'Orders', 'Revenue', 'Monthly Price'];
            foreach ($dashboardData['topPlans'] as $plan) {
                $csvData[] = [$plan['name'], $plan['orders'], '$' . number_format($plan['revenue'], 2), '$' . number_format($plan['price'], 2)];
            }
        }
        
        $filename = 'superadmin-dashboard-export-' . now()->format('Y-m-d') . '.csv';
        
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

    /**
     * Tijraa platform summary for the home screen: persisted commerce insights
     * (refreshed at most every 30 minutes), pending AI actions, knowledge
     * health and setup progress. Each part respects the viewer's permissions.
     */
    private function getTijraaSummary(Store $store, $user): array
    {
        $out = ['ai' => app(\App\Ai\AiManager::class)->describe(), 'can_ask' => $user->can('use-ai-copilot')];
        try {
            if (\Illuminate\Support\Facades\Cache::add("tijraa:insights-refreshed:{$store->id}", 1, now()->addMinutes(30))) {
                \App\Services\Commerce\CommerceIntelligence::for($store)->refresh();
            }
            $out['insights'] = \App\Models\Ai\CommerceInsight::forStore($store->id)->open()
                ->orderByRaw("CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END")
                ->orderByDesc('estimated_impact')->limit(6)
                ->get(['id', 'type', 'severity', 'title', 'description', 'params', 'estimated_impact', 'action_url', 'detected_at'])
                ->map(fn ($i) => $i->toArray() + ['action_url' => $i->action_url ? parse_url($i->action_url, PHP_URL_PATH) . (($q = parse_url($i->action_url, PHP_URL_QUERY)) ? '?' . $q : '') : null]);
        } catch (\Throwable $e) {
            report($e);
            $out['insights'] = [];
        }
        if ($user->can('view-ai-actions')) {
            $pending = \App\Models\Ai\AgentAction::forStore($store->id)->where('status', 'pending')->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()));
            $out['pending_actions'] = ['count' => (clone $pending)->count(), 'latest' => (clone $pending)->latest('id')->limit(3)->get(['uuid', 'type', 'resource_label', 'goal', 'created_at'])];
        }
        if ($user->can('view-knowledge')) {
            $docs = \App\Models\Ai\KnowledgeDocument::forStore($store->id)->selectRaw('status, count(*) as c')->groupBy('status')->pluck('c', 'status');
            $out['knowledge'] = ['ready' => (int) ($docs['ready'] ?? 0), 'failed' => (int) ($docs['failed'] ?? 0), 'processing' => (int) (($docs['processing'] ?? 0) + ($docs['uploading'] ?? 0))];
        }
        if ($user->can('manage-onboarding')) {
            $flow = \App\Services\Commerce\StoreOnboarding::for($store);
            $out['onboarding'] = ['progress' => $flow->progress(), 'todo' => collect($flow->steps())->where('status', 'todo')->take(4)->map(fn ($s) => ['id' => $s['id'], 'required' => $s['required']])->values()];
        }

        return $out;
    }
}
