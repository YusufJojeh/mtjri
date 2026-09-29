<?php

namespace App\Services\Commerce;

use App\Models\Blog;
use App\Models\Customer;
use App\Models\CustomPage;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Setting;
use App\Models\Store;
use App\Models\StoreCoupon;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Authoritative, store-scoped commerce figures. Every number the Copilot,
 * Commerce Intelligence or dashboard shows comes from here.
 *
 * "Sales" = order totals excluding cancelled orders and failed/refunded
 * payments (consistent with the dashboard and analytics).
 */
class StoreAnalytics
{
    public function __construct(private readonly Store $store) {}

    public static function for(Store|int $store): self
    {
        return new self($store instanceof Store ? $store : Store::findOrFail($store));
    }

    public function store(): Store
    {
        return $this->store;
    }

    public function salesQuery(): Builder
    {
        return Order::query()
            ->where('store_id', $this->store->id)
            ->where('status', '!=', 'cancelled')
            ->whereNotIn('payment_status', ['failed', 'refunded']);
    }

    public function lowStockThreshold(): int
    {
        return (int) Setting::getSetting('low_stock_threshold', $this->store->user_id, $this->store->id, 20);
    }

    /** @return array{orders:int,sales:float,aov:float} */
    public function totals(Carbon $from, Carbon $to): array
    {
        $row = $this->salesQuery()->whereBetween('created_at', [$from, $to])
            ->selectRaw('COUNT(*) as orders, COALESCE(SUM(total_amount),0) as sales')->first();
        $orders = (int) $row->orders;
        $sales = round((float) $row->sales, 2);

        return ['orders' => $orders, 'sales' => $sales, 'aov' => $orders ? round($sales / $orders, 2) : 0.0];
    }

    /** Current period vs the equal-length previous period. */
    public function periodComparison(int $days): array
    {
        $now = now();
        $start = $now->copy()->subDays($days - 1)->startOfDay();
        $prevStart = $start->copy()->subDays($days);
        $current = $this->totals($start, $now);
        $previous = $this->totals($prevStart, $start->copy()->subSecond());
        $change = fn (float $c, float $p) => $p > 0 ? round((($c - $p) / $p) * 100, 1) : null;

        return [
            'days' => $days,
            'from' => $start->toDateString(),
            'to' => $now->toDateString(),
            'current' => $current,
            'previous' => $previous,
            'change_pct' => [
                'sales' => $change($current['sales'], $previous['sales']),
                'orders' => $change($current['orders'], $previous['orders']),
                'aov' => $change($current['aov'], $previous['aov']),
            ],
        ];
    }

    /** Daily (or weekly) series with the aligned previous period. */
    public function trend(int $days, string $granularity = 'day'): array
    {
        $now = now();
        $start = $now->copy()->subDays($days - 1)->startOfDay();
        $prevStart = $start->copy()->subDays($days);
        $rows = $this->salesQuery()->whereBetween('created_at', [$prevStart, $now])->get(['created_at', 'total_amount'])
            ->groupBy(fn ($o) => $o->created_at->toDateString());
        $points = [];
        for ($i = 0; $i < $days; $i++) {
            $d = $start->copy()->addDays($i)->toDateString();
            $p = $prevStart->copy()->addDays($i)->toDateString();
            $points[] = [
                'date' => $d,
                'sales' => round((float) $rows->get($d, collect())->sum('total_amount'), 2),
                'orders' => $rows->get($d, collect())->count(),
                'previous_sales' => round((float) $rows->get($p, collect())->sum('total_amount'), 2),
            ];
        }
        if ($granularity === 'week') {
            $points = collect($points)->chunk(7)->map(fn ($c) => [
                'week_start' => $c->first()['date'],
                'sales' => round($c->sum('sales'), 2),
                'orders' => $c->sum('orders'),
                'previous_sales' => round($c->sum('previous_sales'), 2),
            ])->values()->all();
        }

        return $points;
    }

    /** @return Collection<int, array> */
    public function topProducts(int $days, string $by = 'revenue', int $limit = 5): Collection
    {
        $from = now()->subDays($days - 1)->startOfDay();
        $rows = OrderItem::query()
            ->select('product_id', 'product_name')
            ->selectRaw('SUM(quantity) as units, SUM(total_price) as revenue, COUNT(DISTINCT order_id) as orders')
            ->whereHas('order', fn ($o) => $o->where('store_id', $this->store->id)->where('status', '!=', 'cancelled')->whereNotIn('payment_status', ['failed', 'refunded'])->where('created_at', '>=', $from))
            ->groupBy('product_id', 'product_name')
            ->orderByDesc($by === 'units' ? 'units' : 'revenue')
            ->limit($limit)
            ->get();
        $products = Product::where('store_id', $this->store->id)->whereIn('id', $rows->pluck('product_id'))->get(['id', 'stock', 'is_active'])->keyBy('id');

        return $rows->map(fn ($r) => [
            'product_id' => (int) $r->product_id,
            'name' => $r->product_name,
            'units' => (int) $r->units,
            'revenue' => round((float) $r->revenue, 2),
            'orders' => (int) $r->orders,
            'stock' => isset($products[$r->product_id]) ? (int) $products[$r->product_id]->stock : null,
        ])->values();
    }

    /** Units/revenue for one product: current vs previous equal period. */
    public function productPerformance(int $productId, int $days = 30): array
    {
        $now = now();
        $start = $now->copy()->subDays($days - 1)->startOfDay();
        $prevStart = $start->copy()->subDays($days);
        $sum = function (Carbon $from, Carbon $to) use ($productId) {
            $row = OrderItem::query()->where('product_id', $productId)
                ->whereHas('order', fn ($o) => $o->where('store_id', $this->store->id)->where('status', '!=', 'cancelled')->whereNotIn('payment_status', ['failed', 'refunded'])->whereBetween('created_at', [$from, $to]))
                ->selectRaw('COALESCE(SUM(quantity),0) as units, COALESCE(SUM(total_price),0) as revenue, COUNT(DISTINCT order_id) as orders')->first();

            return ['units' => (int) $row->units, 'revenue' => round((float) $row->revenue, 2), 'orders' => (int) $row->orders];
        };

        return ['days' => $days, 'current' => $sum($start, $now), 'previous' => $sum($prevStart, $start->copy()->subSecond())];
    }

    /**
     * Products whose unit sales dropped sharply vs the previous period
     * (only where the previous period had meaningful volume).
     */
    public function decliningProducts(int $days = 30, int $minPreviousUnits = 4, float $dropPct = 40): Collection
    {
        $now = now();
        $start = $now->copy()->subDays($days - 1)->startOfDay();
        $prevStart = $start->copy()->subDays($days);
        $units = function (Carbon $from, Carbon $to) {
            return OrderItem::query()
                ->selectRaw('product_id, SUM(quantity) as units')
                ->whereHas('order', fn ($o) => $o->where('store_id', $this->store->id)->where('status', '!=', 'cancelled')->whereNotIn('payment_status', ['failed', 'refunded'])->whereBetween('created_at', [$from, $to]))
                ->groupBy('product_id')->pluck('units', 'product_id');
        };
        $cur = $units($start, $now);
        $prev = $units($prevStart, $start->copy()->subSecond());
        $products = Product::where('store_id', $this->store->id)->where('is_active', true)->whereIn('id', $prev->keys())->get(['id', 'name', 'price', 'sale_price', 'stock'])->keyBy('id');

        return $prev->filter(fn ($p) => $p >= $minPreviousUnits)
            ->map(function ($p, $id) use ($cur, $products, $dropPct) {
                $c = (int) ($cur[$id] ?? 0);
                $drop = (($p - $c) / $p) * 100;
                $product = $products[$id] ?? null;
                if (! $product || $drop < $dropPct) {
                    return null;
                }

                return [
                    'product_id' => (int) $id,
                    'name' => $product->name,
                    'previous_units' => (int) $p,
                    'current_units' => $c,
                    'drop_pct' => round($drop, 1),
                    'stock' => (int) $product->stock,
                    'price' => (float) ($product->sale_price && $product->sale_price < $product->price ? $product->sale_price : $product->price),
                ];
            })->filter()->sortByDesc('drop_pct')->values();
    }

    /** Inventory rows with velocity and cover (product-level stock). */
    public function inventory(): Collection
    {
        $threshold = $this->lowStockThreshold();
        $since = now()->subDays(30);
        $sold = OrderItem::query()->selectRaw('product_id, SUM(quantity) as qty')
            ->whereHas('order', fn ($o) => $o->where('store_id', $this->store->id)->where('created_at', '>=', $since)->where('status', '!=', 'cancelled'))
            ->groupBy('product_id')->pluck('qty', 'product_id');
        $open = OrderItem::query()->selectRaw('product_id, SUM(quantity) as qty')
            ->whereHas('order', fn ($o) => $o->where('store_id', $this->store->id)->whereIn('status', ['pending', 'processing']))
            ->groupBy('product_id')->pluck('qty', 'product_id');

        return Product::with('category:id,name')->where('store_id', $this->store->id)
            ->get(['id', 'name', 'sku', 'stock', 'price', 'cover_image', 'is_active', 'category_id', 'variants', 'is_downloadable', 'updated_at'])
            ->map(function (Product $p) use ($threshold, $sold, $open) {
                $stock = (int) $p->stock;
                $s = (int) ($sold[$p->id] ?? 0);
                $rate = $s / 30;

                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'sku' => $p->sku,
                    'image' => $p->cover_image,
                    'category' => $p->category?->name,
                    'active' => (bool) $p->is_active,
                    'digital' => (bool) $p->is_downloadable,
                    'variantOptions' => collect($p->variants ?: [])->map(fn ($v) => ($v['name'] ?? '') . (isset($v['values']) ? ' (' . count((array) $v['values']) . ')' : ''))->filter()->values(),
                    'stock' => $stock,
                    'onOpenOrders' => (int) ($open[$p->id] ?? 0),
                    'sold30' => $s,
                    'daysOfCover' => $rate > 0 ? (int) floor($stock / $rate) : null,
                    'state' => $stock <= 0 ? 'out_of_stock' : ($stock <= $threshold ? 'low_stock' : 'in_stock'),
                    'price' => (float) $p->price,
                    'stockValue' => round($stock * (float) $p->price, 2),
                    'updatedAt' => optional($p->updated_at)->toIso8601String(),
                ];
            });
    }

    public function orderSummary(int $days = 30): array
    {
        $from = now()->subDays($days - 1)->startOfDay();
        $base = fn () => Order::where('store_id', $this->store->id);
        $byStatus = $base()->where('created_at', '>=', $from)->selectRaw('status, COUNT(*) c')->groupBy('status')->pluck('c', 'status');
        $byPayment = $base()->where('created_at', '>=', $from)->selectRaw('payment_status, COUNT(*) c')->groupBy('payment_status')->pluck('c', 'payment_status');
        $open = $base()->whereIn('status', ['pending', 'processing']);

        return [
            'days' => $days,
            'by_status' => $byStatus,
            'by_payment_status' => $byPayment,
            'open_orders' => (clone $open)->count(),
            'open_older_than_48h' => (clone $open)->where('created_at', '<', now()->subHours(48))->count(),
            'paid_ready_to_ship' => (clone $open)->where('payment_status', 'paid')->count(),
            'failed_payments_30d' => $base()->where('payment_status', 'failed')->where('status', '!=', 'cancelled')->where('created_at', '>=', now()->subDays(30))->count(),
            'failed_payments_value_30d' => round((float) $base()->where('payment_status', 'failed')->where('status', '!=', 'cancelled')->where('created_at', '>=', now()->subDays(30))->sum('total_amount'), 2),
            'shipped_unpaid' => $base()->whereIn('status', ['shipped', 'delivered'])->where('payment_status', 'pending')->count(),
        ];
    }

    public function customerSummary(int $days = 30): array
    {
        $from = now()->subDays($days - 1)->startOfDay();
        $buyers = $this->salesQuery()->where('created_at', '>=', $from)->get(['customer_id', 'customer_email'])
            ->map(fn ($o) => $o->customer_id ? 'c' . $o->customer_id : strtolower((string) $o->customer_email))->filter();
        $top = $this->salesQuery()->whereNotNull('customer_id')->where('created_at', '>=', now()->subDays(365))
            ->selectRaw('customer_id, COUNT(*) as orders, SUM(total_amount) as spend, MAX(created_at) as last_order')
            ->groupBy('customer_id')->orderByDesc('spend')->limit(5)->get();
        $names = Customer::where('store_id', $this->store->id)->whereIn('id', $top->pluck('customer_id'))->get(['id', 'first_name', 'last_name'])->keyBy('id');

        return [
            'days' => $days,
            'customers_total' => Customer::where('store_id', $this->store->id)->count(),
            'new_customers' => Customer::where('store_id', $this->store->id)->where('created_at', '>=', $from)->count(),
            'buyers' => $buyers->unique()->count(),
            'repeat_buyers' => $buyers->countBy()->filter(fn ($c) => $c > 1)->count(),
            'top_customers_12m' => $top->map(fn ($r) => [
                'customer_id' => (int) $r->customer_id,
                'name' => trim(($names[$r->customer_id]->first_name ?? '') . ' ' . ($names[$r->customer_id]->last_name ?? '')),
                'orders' => (int) $r->orders,
                'spend' => round((float) $r->spend, 2),
                'last_order' => (string) $r->last_order,
            ])->values(),
        ];
    }

    public function discountPerformance(?string $code = null): Collection
    {
        $coupons = StoreCoupon::where('store_id', $this->store->id)->when($code, fn ($q) => $q->where('code', $code))->orderByDesc('created_at')->limit(20)->get();
        $stats = Order::where('store_id', $this->store->id)->whereIn('coupon_code', $coupons->pluck('code'))
            ->where('status', '!=', 'cancelled')
            ->selectRaw('coupon_code, COUNT(*) as orders, SUM(total_amount) as revenue, SUM(COALESCE(coupon_discount, discount_amount, 0)) as discount')
            ->groupBy('coupon_code')->get()->keyBy('coupon_code');

        return $coupons->map(function (StoreCoupon $c) use ($stats) {
            $s = $stats[$c->code] ?? null;
            $state = ! $c->status ? 'paused' : ($c->expiry_date && $c->expiry_date->lt(today()) ? 'expired' : ($c->start_date && $c->start_date->gt(today()) ? 'scheduled' : 'active'));

            return [
                'id' => $c->id,
                'name' => $c->name,
                'code' => $c->code,
                'type' => $c->type,
                'value' => (float) $c->discount_amount,
                'minimum_spend' => $c->minimum_spend !== null ? (float) $c->minimum_spend : null,
                'state' => $state,
                'start_date' => optional($c->start_date)->toDateString(),
                'expiry_date' => optional($c->expiry_date)->toDateString(),
                'used' => (int) $c->used_count,
                'limit' => $c->use_limit_per_coupon,
                'orders' => (int) ($s->orders ?? 0),
                'revenue' => round((float) ($s->revenue ?? 0), 2),
                'discount_given' => round((float) ($s->discount ?? 0), 2),
            ];
        });
    }

    /** Catalogue content gaps: missing/short descriptions and missing images. */
    public function contentStatus(): array
    {
        $products = Product::where('store_id', $this->store->id)->where('is_active', true)->get(['id', 'name', 'description', 'cover_image']);
        $short = $products->filter(fn ($p) => mb_strlen(trim(strip_tags((string) $p->description))) < 80);

        return [
            'active_products' => $products->count(),
            'short_or_missing_descriptions' => $short->count(),
            'examples_needing_copy' => $short->take(8)->map(fn ($p) => [
                'product_id' => $p->id,
                'name' => $p->name,
                'description_chars' => mb_strlen(trim(strip_tags((string) $p->description))),
            ])->values(),
            'missing_cover_image' => $products->filter(fn ($p) => empty($p->cover_image))->count(),
        ];
    }

    public function seoStatus(): array
    {
        $blogs = Blog::where('store_id', $this->store->id)->get(['id', 'title', 'meta_title', 'meta_description', 'status']);
        $pages = CustomPage::where('store_id', $this->store->id)->get(['id', 'title', 'meta_title', 'meta_description', 'status']);
        $missing = fn ($c) => $c->filter(fn ($x) => blank($x->meta_title) || blank($x->meta_description));

        return [
            'blog_posts' => $blogs->count(),
            'blog_posts_missing_meta' => $missing($blogs)->count(),
            'blog_examples' => $missing($blogs)->take(5)->map(fn ($b) => ['blog_id' => $b->id, 'title' => $b->title, 'has_meta_title' => filled($b->meta_title), 'has_meta_description' => filled($b->meta_description)])->values(),
            'pages' => $pages->count(),
            'pages_missing_meta' => $missing($pages)->count(),
            'page_examples' => $missing($pages)->take(5)->map(fn ($p) => ['page_id' => $p->id, 'title' => $p->title, 'has_meta_title' => filled($p->meta_title), 'has_meta_description' => filled($p->meta_description)])->values(),
        ];
    }
}
