<?php

namespace App\Http\Controllers;

use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * Inventory workspace. Read-only view over product stock; stock edits still
 * go through ProductController@update so validation stays in one place.
 *
 * Stock is tracked per product (variants are option definitions without
 * their own stock), so every figure here is product-level.
 */
class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $storeId = getCurrentStoreId($user);

        $validated = $request->validate([
            'view' => 'nullable|in:all,low,out,healthy',
            'q' => 'nullable|string|max:100',
            'sort' => 'nullable|in:stock_asc,stock_desc,cover_asc,name',
        ]);
        $view = $validated['view'] ?? 'all';
        $q = trim((string) ($validated['q'] ?? ''));
        $sort = $validated['sort'] ?? 'cover_asc';

        $threshold = (int) Setting::getSetting('low_stock_threshold', $user->id, $storeId, 20);

        $products = Product::with('category:id,name')
            ->where('store_id', $storeId)
            ->get(['id', 'name', 'sku', 'stock', 'price', 'cover_image', 'is_active', 'category_id', 'variants', 'is_downloadable', 'updated_at']);

        $since = now()->subDays(30);
        $sold30 = OrderItem::query()
            ->selectRaw('product_id, SUM(quantity) as qty')
            ->whereHas('order', fn ($o) => $o->where('store_id', $storeId)->where('created_at', '>=', $since)->where('status', '!=', 'cancelled'))
            ->groupBy('product_id')
            ->pluck('qty', 'product_id');

        $openOrders = OrderItem::query()
            ->selectRaw('product_id, SUM(quantity) as qty')
            ->whereHas('order', fn ($o) => $o->where('store_id', $storeId)->whereIn('status', ['pending', 'processing']))
            ->groupBy('product_id')
            ->pluck('qty', 'product_id');

        $rows = $products->map(function (Product $p) use ($threshold, $sold30, $openOrders) {
            $stock = (int) $p->stock;
            $sold = (int) ($sold30[$p->id] ?? 0);
            $dailyRate = $sold / 30;
            $state = $stock <= 0 ? 'out_of_stock' : ($stock <= $threshold ? 'low_stock' : 'in_stock');

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
                'onOpenOrders' => (int) ($openOrders[$p->id] ?? 0),
                'sold30' => $sold,
                // Days until stock-out at the last 30 days' pace; null when nothing sold.
                'daysOfCover' => $dailyRate > 0 ? (int) floor($stock / $dailyRate) : null,
                'state' => $state,
                'price' => (float) $p->price,
                'stockValue' => round($stock * (float) $p->price, 2),
                'updatedAt' => optional($p->updated_at)->toIso8601String(),
            ];
        });

        $counts = [
            'all' => $rows->count(),
            'low' => $rows->where('state', 'low_stock')->count(),
            'out' => $rows->where('state', 'out_of_stock')->count(),
            'healthy' => $rows->where('state', 'in_stock')->count(),
        ];

        $filtered = $rows
            ->when($view === 'low', fn ($c) => $c->where('state', 'low_stock'))
            ->when($view === 'out', fn ($c) => $c->where('state', 'out_of_stock'))
            ->when($view === 'healthy', fn ($c) => $c->where('state', 'in_stock'))
            ->when($q !== '', fn ($c) => $c->filter(fn ($r) => str_contains(mb_strtolower($r['name'] . ' ' . $r['sku']), mb_strtolower($q))));

        $filtered = match ($sort) {
            'stock_asc' => $filtered->sortBy('stock'),
            'stock_desc' => $filtered->sortByDesc('stock'),
            'name' => $filtered->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE),
            // Most urgent first: fewest days of cover, then lowest stock.
            default => $filtered->sortBy(fn ($r) => [$r['daysOfCover'] ?? PHP_INT_MAX, $r['stock']]),
        };

        return Inertia::render('inventory/index', [
            'items' => $filtered->values(),
            'counts' => $counts,
            'summary' => [
                'units' => $rows->sum('stock'),
                'value' => round($rows->sum('stockValue'), 2),
                'onOpenOrders' => $rows->sum('onOpenOrders'),
                'atRisk' => $rows->filter(fn ($r) => $r['daysOfCover'] !== null && $r['daysOfCover'] <= 14 && $r['stock'] > 0)->count(),
            ],
            'threshold' => $threshold,
            'filters' => ['view' => $view, 'q' => $q, 'sort' => $sort],
        ]);
    }
}
