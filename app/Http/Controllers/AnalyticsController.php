<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Customer;
use App\Models\Product;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class AnalyticsController extends BaseController
{
    /** Orders in these statuses never count towards sales. */
    private const EXCLUDED_STATUSES = ['cancelled', 'refunded'];

    public function index(Request $request)
    {
        $validated = $request->validate([
            'range' => 'nullable|in:7d,30d,90d,mtd,custom',
            'from' => 'nullable|required_if:range,custom|date_format:Y-m-d',
            'to' => 'nullable|required_if:range,custom|date_format:Y-m-d|after_or_equal:from',
        ]);

        $user = Auth::user();
        $storeId = getCurrentStoreId($user);
        $range = $this->resolveRange($validated);

        if (!$storeId) {
            return Inertia::render('analytics/index', [
                'analytics' => null,
                'range' => $range['meta'],
                'hasStore' => false,
            ]);
        }

        return Inertia::render('analytics/index', [
            'analytics' => $this->buildReport($storeId, $range),
            'range' => $range['meta'],
            'hasStore' => true,
        ]);
    }

    /**
     * Resolve the requested period and the previous period of equal length.
     */
    private function resolveRange(array $input): array
    {
        $key = $input['range'] ?? '30d';
        $today = Carbon::today();

        switch ($key) {
            case '7d':
                $start = $today->copy()->subDays(6);
                $end = $today->copy()->endOfDay();
                break;
            case '90d':
                $start = $today->copy()->subDays(89);
                $end = $today->copy()->endOfDay();
                break;
            case 'mtd':
                $start = $today->copy()->startOfMonth();
                $end = $today->copy()->endOfDay();
                break;
            case 'custom':
                $start = Carbon::createFromFormat('Y-m-d', $input['from'])->startOfDay();
                $end = Carbon::createFromFormat('Y-m-d', $input['to'])->endOfDay();
                // Keep daily series bounded (one year).
                if ($start->diffInDays($end) > 366) {
                    $start = $end->copy()->subDays(365)->startOfDay();
                }
                break;
            default:
                $key = '30d';
                $start = $today->copy()->subDays(29);
                $end = $today->copy()->endOfDay();
        }

        $days = (int) $start->copy()->startOfDay()->diffInDays($end->copy()->startOfDay()) + 1;
        $prevEnd = $start->copy()->subSecond();
        $prevStart = $start->copy()->subDays($days)->startOfDay();

        return [
            'start' => $start,
            'end' => $end,
            'prevStart' => $prevStart,
            'prevEnd' => $prevEnd,
            'days' => $days,
            'meta' => [
                'key' => $key,
                'from' => $start->toDateString(),
                'to' => $end->toDateString(),
                'previous_from' => $prevStart->toDateString(),
                'previous_to' => $prevEnd->toDateString(),
                'days' => $days,
            ],
        ];
    }

    private function salesQuery($storeId, Carbon $from, Carbon $to)
    {
        return Order::where('store_id', $storeId)
            ->whereBetween('created_at', [$from, $to])
            ->whereNotIn('status', self::EXCLUDED_STATUSES);
    }

    private function periodTotals($storeId, Carbon $from, Carbon $to): array
    {
        $row = $this->salesQuery($storeId, $from, $to)
            ->selectRaw('COUNT(*) as orders, COALESCE(SUM(total_amount), 0) as revenue, COALESCE(SUM(coupon_discount), 0) as discount')
            ->selectRaw('COUNT(DISTINCT LOWER(customer_email)) as customers')
            ->first();

        $orders = (int) ($row->orders ?? 0);
        $revenue = (float) ($row->revenue ?? 0);

        return [
            'revenue' => round($revenue, 2),
            'orders' => $orders,
            'aov' => $orders > 0 ? round($revenue / $orders, 2) : null,
            'customers' => (int) ($row->customers ?? 0),
            'discount' => round((float) ($row->discount ?? 0), 2),
            'all_orders' => Order::where('store_id', $storeId)->whereBetween('created_at', [$from, $to])->count(),
        ];
    }

    private function buildReport($storeId, array $range): array
    {
        $current = $this->periodTotals($storeId, $range['start'], $range['end']);
        $previous = $this->periodTotals($storeId, $range['prevStart'], $range['prevEnd']);
        $hasPreviousData = Order::where('store_id', $storeId)->where('created_at', '<', $range['start'])->exists();

        return [
            'totals' => $current,
            'previous' => $hasPreviousData ? $previous : null,
            'series' => $this->dailySeries($storeId, $range),
            'topProducts' => [
                'by_revenue' => $this->rangeTopProducts($storeId, $range, 'revenue'),
                'by_units' => $this->rangeTopProducts($storeId, $range, 'units'),
            ],
            'customers' => $this->customerMix($storeId, $range),
            'topCustomers' => $this->rangeTopCustomers($storeId, $range),
            'statusBreakdown' => $this->statusBreakdown($storeId, $range),
            'discounts' => $this->discountUsage($storeId, $range, $current),
        ];
    }

    /**
     * One row per day of the selected period, aligned with the same day-offset
     * of the previous period so both can be drawn on one time axis.
     */
    private function dailySeries($storeId, array $range): array
    {
        $bucket = function (Carbon $from, Carbon $to) use ($storeId) {
            return $this->salesQuery($storeId, $from, $to)
                ->selectRaw('DATE(created_at) as day, COUNT(*) as orders, COALESCE(SUM(total_amount), 0) as revenue')
                ->groupBy('day')
                ->get()
                ->keyBy(fn ($r) => (string) $r->day);
        };

        $cur = $bucket($range['start'], $range['end']);
        $prev = $bucket($range['prevStart'], $range['prevEnd']);

        $rows = [];
        for ($i = 0; $i < $range['days']; $i++) {
            $d = $range['start']->copy()->addDays($i)->toDateString();
            $p = $range['prevStart']->copy()->addDays($i)->toDateString();
            $rows[] = [
                'date' => $d,
                'previous_date' => $p,
                'revenue' => round((float) ($cur[$d]->revenue ?? 0), 2),
                'orders' => (int) ($cur[$d]->orders ?? 0),
                'previous_revenue' => round((float) ($prev[$p]->revenue ?? 0), 2),
                'previous_orders' => (int) ($prev[$p]->orders ?? 0),
            ];
        }

        return $rows;
    }

    private function rangeTopProducts($storeId, array $range, string $by): array
    {
        return OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.store_id', $storeId)
            ->whereBetween('orders.created_at', [$range['start'], $range['end']])
            ->whereNotIn('orders.status', self::EXCLUDED_STATUSES)
            ->groupBy('order_items.product_id', 'order_items.product_name')
            ->selectRaw('order_items.product_id as product_id, order_items.product_name as name')
            ->selectRaw('SUM(order_items.quantity) as units, SUM(order_items.total_price) as revenue, COUNT(DISTINCT orders.id) as orders')
            ->orderByDesc($by === 'units' ? 'units' : 'revenue')
            ->limit(8)
            ->get()
            ->map(fn ($r) => [
                'product_id' => $r->product_id,
                'name' => $r->name,
                'units' => (int) $r->units,
                'revenue' => round((float) $r->revenue, 2),
                'orders' => (int) $r->orders,
            ])
            ->values()
            ->all();
    }

    /**
     * New vs returning buyers, keyed by (lower-cased) order email so guest
     * checkouts are counted too. "Returning" = ordered before the period.
     */
    private function customerMix($storeId, array $range): array
    {
        $buyers = $this->salesQuery($storeId, $range['start'], $range['end'])
            ->selectRaw('LOWER(customer_email) as buyer, COUNT(*) as orders, COALESCE(SUM(total_amount), 0) as revenue')
            ->groupBy('buyer')
            ->get();

        if ($buyers->isEmpty()) {
            return ['new' => 0, 'returning' => 0, 'new_revenue' => 0, 'returning_revenue' => 0];
        }

        $returningKeys = Order::where('store_id', $storeId)
            ->where('created_at', '<', $range['start'])
            ->whereNotIn('status', self::EXCLUDED_STATUSES)
            ->whereIn(DB::raw('LOWER(customer_email)'), $buyers->pluck('buyer')->all())
            ->selectRaw('DISTINCT LOWER(customer_email) as buyer')
            ->pluck('buyer')
            ->flip();

        $out = ['new' => 0, 'returning' => 0, 'new_revenue' => 0.0, 'returning_revenue' => 0.0];
        foreach ($buyers as $b) {
            $kind = isset($returningKeys[$b->buyer]) ? 'returning' : 'new';
            $out[$kind]++;
            $out[$kind . '_revenue'] += (float) $b->revenue;
        }
        $out['new_revenue'] = round($out['new_revenue'], 2);
        $out['returning_revenue'] = round($out['returning_revenue'], 2);

        return $out;
    }

    private function rangeTopCustomers($storeId, array $range): array
    {
        return $this->salesQuery($storeId, $range['start'], $range['end'])
            ->selectRaw('LOWER(customer_email) as email, MAX(customer_id) as customer_id')
            ->selectRaw('MAX(customer_first_name) as first_name, MAX(customer_last_name) as last_name')
            ->selectRaw('COUNT(*) as orders, COALESCE(SUM(total_amount), 0) as revenue')
            ->groupBy('email')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get()
            ->map(fn ($r) => [
                'customer_id' => $r->customer_id ? (int) $r->customer_id : null,
                'name' => trim(($r->first_name ?? '') . ' ' . ($r->last_name ?? '')),
                'email' => $r->email,
                'orders' => (int) $r->orders,
                'revenue' => round((float) $r->revenue, 2),
            ])
            ->values()
            ->all();
    }

    private function statusBreakdown($storeId, array $range): array
    {
        return Order::where('store_id', $storeId)
            ->whereBetween('created_at', [$range['start'], $range['end']])
            ->selectRaw('status, COUNT(*) as orders, COALESCE(SUM(total_amount), 0) as amount')
            ->groupBy('status')
            ->orderByDesc('orders')
            ->get()
            ->map(fn ($r) => [
                'status' => (string) $r->status,
                'orders' => (int) $r->orders,
                'amount' => round((float) $r->amount, 2),
            ])
            ->values()
            ->all();
    }

    private function discountUsage($storeId, array $range, array $totals): array
    {
        $codes = $this->salesQuery($storeId, $range['start'], $range['end'])
            ->whereNotNull('coupon_code')
            ->where('coupon_code', '!=', '')
            ->selectRaw('coupon_code as code, COUNT(*) as orders, COALESCE(SUM(coupon_discount), 0) as discount, COALESCE(SUM(total_amount), 0) as revenue')
            ->groupBy('coupon_code')
            ->orderByDesc('orders')
            ->get();

        $couponIds = \App\Models\StoreCoupon::where('store_id', $storeId)
            ->whereIn('code', $codes->pluck('code')->all())
            ->pluck('id', 'code');

        $ordersWithCode = (int) $codes->sum('orders');

        return [
            'orders' => $ordersWithCode,
            'discount' => round((float) $codes->sum('discount'), 2),
            'revenue' => round((float) $codes->sum('revenue'), 2),
            'share' => $totals['orders'] > 0 ? round($ordersWithCode / $totals['orders'] * 100, 1) : null,
            'codes' => $codes->take(8)->map(fn ($r) => [
                'code' => $r->code,
                'coupon_id' => $couponIds[$r->code] ?? null,
                'orders' => (int) $r->orders,
                'discount' => round((float) $r->discount, 2),
                'revenue' => round((float) $r->revenue, 2),
            ])->values()->all(),
        ];
    }

    private function getKeyMetrics($storeId)
    {
        $currentMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();

        $currentRevenue = Order::where('store_id', $storeId)
            ->where('created_at', '>=', $currentMonth)
            ->sum('total_amount');

        $lastMonthRevenue = Order::where('store_id', $storeId)
            ->whereBetween('created_at', [$lastMonth, $currentMonth])
            ->sum('total_amount');

        $currentOrders = Order::where('store_id', $storeId)
            ->where('created_at', '>=', $currentMonth)
            ->count();

        $lastMonthOrders = Order::where('store_id', $storeId)
            ->whereBetween('created_at', [$lastMonth, $currentMonth])
            ->count();

        $totalCustomers = Customer::where('store_id', $storeId)->count();
        $newCustomers = Customer::where('store_id', $storeId)
            ->where('created_at', '>=', $currentMonth)
            ->count();

        return [
            'revenue' => [
                'current' => $currentRevenue,
                'change' => $lastMonthRevenue > 0 ? (($currentRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100 : 0
            ],
            'orders' => [
                'current' => $currentOrders,
                'change' => $currentOrders - $lastMonthOrders
            ],
            'customers' => [
                'total' => $totalCustomers,
                'new' => $newCustomers
            ],

        ];
    }

    private function getTopProducts($storeId)
    {
        return OrderItem::select('product_name', 'product_id')
            ->selectRaw('SUM(quantity) as total_sold')
            ->selectRaw('SUM(total_price) as total_revenue')
            ->whereHas('order', function($query) use ($storeId) {
                $query->where('store_id', $storeId);
            })
            ->groupBy('product_id', 'product_name')
            ->orderBy('total_revenue', 'desc')
            ->limit(4)
            ->get()
            ->map(function($item) use ($storeId) {
                $user = Auth::user();
                return [
                    'name' => $item->product_name,
                    'sales' => $item->total_sold,
                    'revenue' => formatStoreCurrency($item->total_revenue, $user->id, $storeId)
                ];
            });
    }

    private function getTopCustomers($storeId)
    {
        return Customer::select('customers.*')
            ->selectRaw('COUNT(orders.id) as order_count')
            ->selectRaw('SUM(orders.total_amount) as total_spent')
            ->leftJoin('orders', 'customers.id', '=', 'orders.customer_id')
            ->where('customers.store_id', $storeId)
            ->groupBy('customers.id')
            ->orderBy('total_spent', 'desc')
            ->limit(4)
            ->get()
            ->map(function($customer) use ($storeId) {
                $user = Auth::user();
                return [
                    'name' => $customer->first_name . ' ' . $customer->last_name,
                    'orders' => $customer->order_count ?: 0,
                    'spent' => formatStoreCurrency($customer->total_spent ?: 0, $user->id, $storeId)
                ];
            });
    }

    private function getRecentActivity($storeId)
    {
        return Order::where('store_id', $storeId)
            ->with('customer')
            ->orderBy('created_at', 'desc')
            ->limit(4)
            ->get()
            ->map(function($order) use ($storeId) {
                $user = Auth::user();
                return [
                    'type' => 'Order',
                    'description' => "New order {$order->order_number} from {$order->customer_first_name} {$order->customer_last_name}",
                    'amount' => formatStoreCurrency($order->total_amount, $user->id, $storeId),
                    'time' => $order->created_at->diffForHumans()
                ];
            });
    }

    private function getRevenueChartData($storeId)
    {
        return Order::where('store_id', $storeId)
            ->selectRaw('DATE(created_at) as date, SUM(total_amount) as revenue')
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function($item) {
                return [
                    'date' => Carbon::parse($item->date)->format('M d'),
                    'revenue' => (float) $item->revenue
                ];
            });
    }

    private function getSalesChartData($storeId)
    {
        return Order::where('store_id', $storeId)
            ->selectRaw('DATE(created_at) as date, COUNT(*) as orders')
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function($item) {
                return [
                    'date' => Carbon::parse($item->date)->format('M d'),
                    'orders' => (int) $item->orders
                ];
            });
    }

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
    
    /**
     * Export analytics data as CSV.
     */
    public function export()
    {
        $user = Auth::user();
        $storeId = getCurrentStoreId($user);
        
        if (!$storeId) {
            return response()->json(['error' => 'No store selected'], 400);
        }
        
        $analytics = [
            'metrics' => $this->getKeyMetrics($storeId),
            'topProducts' => $this->getTopProducts($storeId),
            'topCustomers' => $this->getTopCustomers($storeId),
            'revenueChart' => $this->getRevenueChartData($storeId)
        ];
        
        $csvData = [];
        $csvData[] = ['Analytics Export - Store ID: ' . $storeId];
        $csvData[] = ['Generated on: ' . now()->format('Y-m-d H:i:s')];
        $csvData[] = [];
        
        // Key Metrics
        $csvData[] = ['KEY METRICS'];
        $csvData[] = ['Metric', 'Current Value', 'Change'];
        $csvData[] = ['Revenue', formatStoreCurrency($analytics['metrics']['revenue']['current'], $user->id, $storeId), number_format($analytics['metrics']['revenue']['change'], 1) . '%'];
        $csvData[] = ['Orders', $analytics['metrics']['orders']['current'], $analytics['metrics']['orders']['change']];
        $csvData[] = ['Total Customers', $analytics['metrics']['customers']['total'], ''];
        $csvData[] = ['New Customers', $analytics['metrics']['customers']['new'], ''];
        $csvData[] = [];
        
        // Top Products
        $csvData[] = ['TOP PRODUCTS'];
        $csvData[] = ['Product Name', 'Units Sold', 'Revenue'];
        foreach ($analytics['topProducts'] as $product) {
            $csvData[] = [$product['name'], $product['sales'], $product['revenue']];
        }
        $csvData[] = [];
        
        // Top Customers
        $csvData[] = ['TOP CUSTOMERS'];
        $csvData[] = ['Customer Name', 'Orders', 'Total Spent'];
        foreach ($analytics['topCustomers'] as $customer) {
            $csvData[] = [$customer['name'], $customer['orders'], $customer['spent']];
        }
        $csvData[] = [];
        
        // Revenue Chart Data
        $csvData[] = ['DAILY REVENUE (Last 30 Days)'];
        $csvData[] = ['Date', 'Revenue'];
        foreach ($analytics['revenueChart'] as $data) {
            $csvData[] = [$data['date'], formatStoreCurrency($data['revenue'], $user->id, $storeId)];
        }
        
        $filename = 'analytics-export-' . now()->format('Y-m-d') . '.csv';
        
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