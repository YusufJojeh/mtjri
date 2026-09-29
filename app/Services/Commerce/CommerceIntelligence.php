<?php

namespace App\Services\Commerce;

use App\Models\Ai\CommerceInsight;
use App\Models\Product;
use App\Models\Store;
use App\Models\StoreCoupon;
use Illuminate\Support\Collection;

/**
 * Deterministic commerce signals. The backend computes every number;
 * language models only explain them.
 *
 * Signals are persisted as CommerceInsight rows keyed by a fingerprint so
 * the same finding is updated (not duplicated) while it persists, and
 * resolved automatically when it no longer holds.
 */
class CommerceIntelligence
{
    private const MIN_ORDERS = 5;

    public function __construct(private readonly StoreAnalytics $analytics) {}

    public static function for(Store|int $store): self
    {
        return new self(StoreAnalytics::for($store));
    }

    /** @return Collection<int, array> signals, most severe first */
    public function analyze(): Collection
    {
        $s = collect();
        $store = $this->analytics->store();
        $period = $this->analytics->periodComparison(30);
        $cur = $period['current'];
        $prev = $period['previous'];

        // Revenue movement
        if ($prev['sales'] > 0 && ($cur['orders'] + $prev['orders']) >= self::MIN_ORDERS) {
            $pct = $period['change_pct']['sales'];
            if ($pct !== null && abs($pct) >= 15) {
                $s->push($this->signal($pct < 0 ? 'revenue_decline' : 'revenue_growth', $pct < 0 ? ($pct <= -30 ? 'high' : 'medium') : 'positive',
                    $pct < 0 ? 'Sales are down :pct% on the previous 30 days' : 'Sales are up :pct% on the previous 30 days',
                    $pct < 0 ? 'A sustained drop usually shows up in traffic, pricing or stock before revenue.' : 'Momentum is a good moment to keep best sellers in stock.',
                    ['pct' => abs($pct)], 'sales_30d', $prev['sales'], $cur['sales'], $pct < 0 ? round($prev['sales'] - $cur['sales'], 2) : null,
                    null, null, route('analytics.index')));
            }
        }

        // AOV movement
        if ($prev['aov'] > 0 && $cur['orders'] >= self::MIN_ORDERS && $prev['orders'] >= self::MIN_ORDERS) {
            $pct = $period['change_pct']['aov'];
            if ($pct !== null && abs($pct) >= 15) {
                $s->push($this->signal($pct < 0 ? 'aov_decline' : 'aov_growth', $pct < 0 ? 'medium' : 'positive',
                    $pct < 0 ? 'Average order value fell :pct%' : 'Average order value rose :pct%',
                    'Basket size moves revenue even when order count stays flat.',
                    ['pct' => abs($pct)], 'aov_30d', $prev['aov'], $cur['aov'], null, null, null, route('analytics.index')));
            }
        }

        // Product sales decline
        foreach ($this->analytics->decliningProducts()->take(3) as $d) {
            $s->push($this->signal('product_sales_decline', 'medium',
                ':name sales dropped :pct%',
                'Units sold fell from :prev to :cur versus the previous 30 days.',
                ['name' => $d['name'], 'pct' => $d['drop_pct'], 'prev' => $d['previous_units'], 'cur' => $d['current_units']],
                'units_30d', $d['previous_units'], $d['current_units'], round(($d['previous_units'] - $d['current_units']) * $d['price'], 2),
                'product', $d['product_id'], route('products.show', $d['product_id'])));
        }

        // Stock exposure
        $inventory = $this->analytics->inventory()->where('active', true)->where('digital', false);
        $top = $this->analytics->topProducts(30, 'revenue', 10)->keyBy('product_id');
        foreach ($inventory->where('state', 'out_of_stock') as $row) {
            $revenue = $top[$row['id']]['revenue'] ?? null;
            $s->push($this->signal('out_of_stock', $revenue ? 'high' : 'medium',
                ':name is out of stock',
                $revenue ? 'It sold :revenue in the last 30 days; every day out of stock loses sales.' : 'Customers cannot buy it until it is restocked.',
                ['name' => $row['name'], 'revenue' => $revenue], 'stock', null, 0, $revenue, 'product', $row['id'], route('products.edit', $row['id'])));
        }
        foreach ($inventory->where('state', 'low_stock')->filter(fn ($r) => $r['daysOfCover'] !== null && $r['daysOfCover'] <= 14) as $row) {
            $s->push($this->signal('low_stock_risk', 'medium',
                ':name will run out in about :days days',
                'At the last 30 days\' pace (:sold sold), :stock units remain.',
                ['name' => $row['name'], 'days' => $row['daysOfCover'], 'sold' => $row['sold30'], 'stock' => $row['stock']],
                'days_of_cover', null, $row['daysOfCover'], null, 'product', $row['id'], route('inventory.index', ['view' => 'low'])));
        }

        // Inactive catalogue
        $inactive = Product::where('store_id', $store->id)->where('is_active', false)->count();
        if ($inactive > 0) {
            $s->push($this->signal('inactive_products', 'low', ':count products are hidden from the storefront',
                'Draft products cannot be bought. Publish or remove them to keep the catalogue tidy.',
                ['count' => $inactive], 'inactive_products', null, $inactive, null, null, null, route('products.index', ['status' => 'draft'])));
        }

        // Orders
        $orders = $this->analytics->orderSummary(30);
        if ($orders['open_older_than_48h'] > 0) {
            $s->push($this->signal('fulfillment_backlog', $orders['open_older_than_48h'] >= 5 ? 'high' : 'medium',
                ':count open orders are older than 48 hours', 'Slow fulfilment drives cancellations and support requests.',
                ['count' => $orders['open_older_than_48h']], 'stale_orders', null, $orders['open_older_than_48h'], null, null, null, route('orders.index', ['view' => 'open', 'sort' => 'oldest'])));
        }
        if ($orders['failed_payments_30d'] > 0) {
            $s->push($this->signal('failed_payments', 'high', ':count orders have failed payments',
                ':value is at risk unless customers retry payment.',
                ['count' => $orders['failed_payments_30d'], 'value' => $orders['failed_payments_value_30d']],
                'failed_payments', null, $orders['failed_payments_30d'], $orders['failed_payments_value_30d'], null, null, route('orders.index', ['payment' => 'failed'])));
        }
        if ($orders['shipped_unpaid'] > 0) {
            $s->push($this->signal('shipped_unpaid', 'medium', ':count shipped orders are still unpaid',
                'Collect payment or confirm cash-on-delivery receipts.', ['count' => $orders['shipped_unpaid']],
                'shipped_unpaid', null, $orders['shipped_unpaid'], null, null, null, route('orders.index', ['view' => 'unpaid'])));
        }

        // Discounts
        foreach ($this->analytics->discountPerformance()->where('state', 'active') as $d) {
            $ends = $d['expiry_date'] ? now()->startOfDay()->diffInDays(\Carbon\Carbon::parse($d['expiry_date']), false) : null;
            if ($ends !== null && $ends >= 0 && $ends <= 7) {
                $s->push($this->signal('discount_expiring', 'low', ':code ends in :days days',
                    ':orders orders used it so far.', ['code' => $d['code'], 'days' => (int) $ends, 'orders' => $d['orders']],
                    'days_left', null, (int) $ends, null, 'discount', $d['id'], route('coupon-system.show', $d['id'])));
            }
            $createdDays = StoreCoupon::find($d['id'])?->created_at?->diffInDays(now());
            if ($d['orders'] === 0 && $createdDays !== null && $createdDays >= 14) {
                $s->push($this->signal('discount_unused', 'low', ':code has not been used',
                    'It has been active for :days days without an order. Share it or retire it.',
                    ['code' => $d['code'], 'days' => (int) $createdDays], 'discount_orders', null, 0, null, 'discount', $d['id'], route('coupon-system.show', $d['id'])));
            }
        }

        // Customers
        $customers = $this->analytics->customerSummary(30);
        if ($customers['buyers'] >= 5) {
            $rate = round(($customers['repeat_buyers'] / $customers['buyers']) * 100, 1);
            if ($rate < 20) {
                $s->push($this->signal('low_repeat_rate', 'low', 'Only :pct% of buyers ordered more than once',
                    'Returning customers are usually cheaper to win than new ones.',
                    ['pct' => $rate], 'repeat_rate', null, $rate, null, null, null, route('customers.index')));
            }
        }

        // Content & SEO gaps
        $content = $this->analytics->contentStatus();
        if ($content['short_or_missing_descriptions'] > 0) {
            $s->push($this->signal('content_gap', 'low', ':count products have thin descriptions',
                'Short product copy converts worse and ranks lower in search.', ['count' => $content['short_or_missing_descriptions']],
                'thin_descriptions', null, $content['short_or_missing_descriptions'], null, null, null, route('products.index')));
        }
        $seo = $this->analytics->seoStatus();
        $missing = $seo['blog_posts_missing_meta'] + $seo['pages_missing_meta'];
        if ($missing > 0) {
            $s->push($this->signal('seo_gap', 'low', ':count posts and pages are missing search metadata',
                'Without a meta title and description, search engines guess what to show.', ['count' => $missing],
                'missing_meta', null, $missing, null, null, null, route('blog.index')));
        }

        $rank = ['critical' => 0, 'high' => 1, 'medium' => 2, 'low' => 3, 'positive' => 4];

        return $s->sortBy(fn ($x) => [$rank[$x['severity']] ?? 5, -($x['estimated_impact'] ?? 0)])->values();
    }

    /** Persist current signals; resolve the ones that no longer hold. */
    public function refresh(): Collection
    {
        $store = $this->analytics->store();
        $signals = $this->analyze();
        $now = now();
        $seen = [];
        foreach ($signals as $sig) {
            $seen[] = $sig['fingerprint'];
            $existing = CommerceInsight::forStore($store->id)->where('fingerprint', $sig['fingerprint'])->whereNull('resolved_at')->first();
            $attrs = collect($sig)->except(['fingerprint'])->all() + ['last_seen_at' => $now];
            if ($existing) {
                $existing->fill($attrs)->save();
            } else {
                CommerceInsight::create($attrs + ['store_id' => $store->id, 'fingerprint' => $sig['fingerprint'], 'detected_at' => $now]);
            }
        }
        CommerceInsight::forStore($store->id)->whereNull('resolved_at')->whereNotIn('fingerprint', $seen)->update(['resolved_at' => $now]);

        return CommerceInsight::forStore($store->id)->open()->get();
    }

    private function signal(string $type, string $severity, string $title, string $description, array $params, ?string $metric, $previous, $current, $impact, ?string $resourceType, ?int $resourceId, ?string $url): array
    {
        $render = fn (string $text) => preg_replace_callback('/:(\w+)/', fn ($m) => array_key_exists($m[1], $params) ? (string) (is_float($params[$m[1]]) ? rtrim(rtrim(number_format($params[$m[1]], 2, '.', ''), '0'), '.') : $params[$m[1]]) : $m[0], $text);

        return [
            'type' => $type,
            'fingerprint' => $type . ($resourceType ? ':' . $resourceType . ':' . $resourceId : ''),
            'severity' => $severity,
            'title' => $render($title),
            'description' => $render($description),
            'params' => $params + ['_title' => $title, '_description' => $description],
            'metric' => $metric,
            'previous_value' => $previous,
            'current_value' => $current,
            'estimated_impact' => $impact,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'action_url' => $url,
            'evidence' => ['metric' => $metric, 'previous' => $previous, 'current' => $current],
        ];
    }
}
