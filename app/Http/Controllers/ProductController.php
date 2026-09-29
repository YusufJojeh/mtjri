<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use App\Http\Requests\ProductFormRequest;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProductController extends BaseController
{
    /**
     * Display a listing of the products.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);

        // Optional, validated list filters (all read-only query params).
        $filters = $request->validate([
            'q' => 'nullable|string|max:100',
            'status' => 'nullable|in:active,draft',
            'stock' => 'nullable|in:in,low,out',
            'category' => 'nullable|integer',
            'sort' => 'nullable|in:newest,oldest,updated,name,price_asc,price_desc,stock_asc,stock_desc',
        ]);
        $q = trim((string) ($filters['q'] ?? ''));
        $sort = $filters['sort'] ?? 'newest';

        // Get low stock threshold from settings (default: 20)
        $lowStockThreshold = (int) \App\Models\Setting::getSetting('low_stock_threshold', $user->id, $currentStoreId, 20);

        $query = Product::with('category')->where('store_id', $currentStoreId);

        if ($q !== '') {
            $query->where(function ($w) use ($q) {
                $w->where('name', 'like', '%' . $q . '%')->orWhere('sku', 'like', '%' . $q . '%');
            });
        }
        if (($filters['status'] ?? null) === 'active') {
            $query->where('is_active', true);
        } elseif (($filters['status'] ?? null) === 'draft') {
            $query->where('is_active', false);
        }
        match ($filters['stock'] ?? null) {
            'out' => $query->where('stock', '<=', 0),
            'low' => $query->where('stock', '>', 0)->where('stock', '<=', $lowStockThreshold),
            'in' => $query->where('stock', '>', $lowStockThreshold),
            default => null,
        };
        if (!empty($filters['category'])) {
            $query->where('category_id', (int) $filters['category']);
        }

        match ($sort) {
            'oldest' => $query->oldest(),
            'updated' => $query->latest('updated_at'),
            'name' => $query->orderBy('name'),
            'price_asc' => $query->orderBy('price'),
            'price_desc' => $query->orderByDesc('price'),
            'stock_asc' => $query->orderBy('stock'),
            'stock_desc' => $query->orderByDesc('stock'),
            default => $query->latest(),
        };
        $query->orderByDesc('id');

        // Get products for the current store with category relationship and PAGINATION - Performance Fix
        $products = $query->paginate(50)->withQueryString();

        // Get statistics from ALL products (not just paginated)
        $base = fn () => Product::where('store_id', $currentStoreId);
        $totalProducts = $base()->count();
        $activeProducts = $base()->where('is_active', true)->count();
        $lowStockProducts = $base()->where('stock', '<=', $lowStockThreshold)->count();
        $totalValue = $base()->selectRaw('SUM(price * stock) as total')->value('total') ?? 0;

        return Inertia::render('products/index', [
            'products' => $products,
            'stats' => [
                'total' => $totalProducts,
                'active' => $activeProducts,
                'lowStock' => $lowStockProducts,
                'totalValue' => $totalValue
            ],
            // View counts across the whole catalog (independent of search/filters).
            'counts' => [
                'all' => $totalProducts,
                'active' => $activeProducts,
                'draft' => $totalProducts - $activeProducts,
                'low' => $base()->where('stock', '>', 0)->where('stock', '<=', $lowStockThreshold)->count(),
                'out' => $base()->where('stock', '<=', 0)->count(),
            ],
            'categories' => Category::where('store_id', $currentStoreId)->orderBy('name')->get(['id', 'name']),
            'lowStockThreshold' => $lowStockThreshold,
            'filters' => [
                'q' => $q,
                'status' => $filters['status'] ?? null,
                'stock' => $filters['stock'] ?? null,
                'category' => isset($filters['category']) ? (string) $filters['category'] : null,
                'sort' => $sort,
            ],
        ]);
    }

    /**
     * Show the form for creating a new product.
     */
    public function create()
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);

        // Get categories for the current store
        $categories = Category::where('store_id', $currentStoreId)
                            ->where('is_active', true)
                            ->get();

        // Get taxes for the current store
        $taxes = \App\Models\Tax::where('store_id', $currentStoreId)
                            ->where('is_active', true)
                            ->get();

        return Inertia::render('products/create', [
            'categories' => $categories,
            'taxes' => $taxes
        ]);
    }

    /**
     * Store a newly created product in storage.
     */
    public function store(ProductFormRequest $request)
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);

        // Check if user can add more products to this store
        $productCheck = $user->canAddProductToStore($currentStoreId);
        if (!$productCheck['allowed']) {
            return redirect()->back()->with('error', $productCheck['message']);
        }

        return \DB::transaction(function () use ($request, $currentStoreId) {
            $validatedData = $request->validated();
            $product = new Product();
            $product->fill($validatedData);
            $product->store_id = $currentStoreId;
            $product->save();

            return redirect()->route('products.index')->with('success', __('Product created successfully'));
        });
    }

    /**
     * Display the specified product.
     */
    public function show(string $id)
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);

        $product = Product::with(['category', 'tax'])
                        ->where('store_id', $currentStoreId)
                        ->findOrFail($id);

        // Calculate dynamic stats for the product
        $orderItems = \App\Models\OrderItem::where('product_id', $product->id)->get();

        $stats = [
            'revenue' => $orderItems->sum('total_price'),
            'views' => 0, // Views tracking would need to be implemented separately
            'total_sold' => $orderItems->sum('quantity'),
            'total_orders' => $orderItems->count(),
        ];

        // Format revenue for display
        $stats['formatted_revenue'] = formatStoreCurrency($stats['revenue'], $user->id, $currentStoreId);

        // Read-only performance for this product (store-scoped, cancelled orders excluded).
        $itemsFor = fn () => \App\Models\OrderItem::where('product_id', $product->id)
            ->whereHas('order', fn ($o) => $o->where('store_id', $currentStoreId)->where('status', '!=', 'cancelled'));
        $window = function (int $days) use ($itemsFor, $currentStoreId) {
            $rows = $itemsFor()
                ->whereHas('order', fn ($o) => $o->where('store_id', $currentStoreId)->where('created_at', '>=', now()->subDays($days)))
                ->get(['order_id', 'quantity', 'total_price']);
            return [
                'units' => (int) $rows->sum('quantity'),
                'revenue' => round((float) $rows->sum('total_price'), 2),
                'orders' => $rows->pluck('order_id')->unique()->count(),
            ];
        };
        $performance = [
            'd30' => $window(30),
            'd90' => $window(90),
            'onOpenOrders' => (int) \App\Models\OrderItem::where('product_id', $product->id)
                ->whereHas('order', fn ($o) => $o->where('store_id', $currentStoreId)->whereIn('status', ['pending', 'processing']))
                ->sum('quantity'),
        ];

        $recentOrders = \App\Models\OrderItem::with('order:id,order_number,status,payment_status,created_at,customer_first_name,customer_last_name')
            ->where('product_id', $product->id)
            ->whereHas('order', fn ($o) => $o->where('store_id', $currentStoreId))
            ->latest('id')
            ->limit(6)
            ->get(['id', 'order_id', 'quantity', 'total_price', 'product_variants'])
            ->filter(fn ($i) => $i->order)
            ->map(fn ($i) => [
                'id' => $i->order->id,
                'number' => $i->order->order_number,
                'status' => $i->order->status,
                'paymentStatus' => $i->order->payment_status,
                'customer' => trim(($i->order->customer_first_name ?? '') . ' ' . ($i->order->customer_last_name ?? '')),
                'createdAt' => optional($i->order->created_at)->toIso8601String(),
                'quantity' => (int) $i->quantity,
                'total' => (float) $i->total_price,
            ])
            ->sortByDesc('createdAt')
            ->values();

        return Inertia::render('products/show', [
            'product' => $product,
            'stats' => $stats,
            'performance' => $performance,
            'recentOrders' => $recentOrders,
            'lowStockThreshold' => (int) \App\Models\Setting::getSetting('low_stock_threshold', $user->id, $currentStoreId, 20),
        ]);
    }

    /**
     * Show the form for editing the specified product.
     */
    public function edit(string $id)
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);

        $product = Product::where('store_id', $currentStoreId)->findOrFail($id);

        // Get categories for the current store
        $categories = Category::where('store_id', $currentStoreId)
                            ->where('is_active', true)
                            ->get();

        // Get taxes for the current store
        $taxes = \App\Models\Tax::where('store_id', $currentStoreId)
                            ->where('is_active', true)
                            ->get();

        return Inertia::render('products/edit', [
            'product' => $product,
            'categories' => $categories,
            'taxes' => $taxes
        ]);
    }

    /**
     * Update the specified product in storage.
     */
    public function update(ProductFormRequest $request, string $id)
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);

        $product = Product::where('store_id', $currentStoreId)->findOrFail($id);

        return \DB::transaction(function () use ($request, $product) {
            $validatedData = $request->validated();

            $product->fill($validatedData);
            $product->save();

            return redirect()->route('products.index')->with('success', __('Product updated successfully'));
        });
    }

    /**
     * Remove the specified product from storage.
     */
    public function destroy(string $id)
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);

        $product = Product::where('store_id', $currentStoreId)->findOrFail($id);

        // Authorization check
        $this->authorize('delete', $product);

        return \DB::transaction(function () use ($product) {
            $product->delete();
            return redirect()->route('products.index')->with('success', __('Product deleted successfully'));
        });
    }

    /**
     * Export products data as CSV.
     */
    public function export()
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);

        $products = Product::with('category')
                        ->where('store_id', $currentStoreId)
                        ->get();

        $csvData = [];
        $csvData[] = ['Product Name', 'SKU', 'Category', 'Price', 'Sale Price', 'Stock', 'Variants', 'Status', 'Created Date'];

        foreach ($products as $product) {
            $variantDetails = 'No variants';
            if ($product->variants && is_array($product->variants) && count($product->variants) > 0) {
                $variantList = [];
                foreach ($product->variants as $variant) {
                    if (is_array($variant) && isset($variant['name'])) {
                        $variantList[] = $variant['name'] . (isset($variant['price']) ? ' (' . formatStoreCurrency($variant['price'], $user->id, $currentStoreId) . ')' : '');
                    }
                }
                $variantDetails = implode('; ', $variantList);
            }

            $csvData[] = [
                $product->name,
                $product->sku ?: 'Not set',
                $product->category ? $product->category->name : 'Uncategorized',
                formatStoreCurrency($product->price, $user->id, $currentStoreId),
                $product->sale_price ? formatStoreCurrency($product->sale_price, $user->id, $currentStoreId) : 'Not set',
                $product->stock,
                $variantDetails,
                $product->is_active ? 'Active' : 'Inactive',
                $product->created_at->format('Y-m-d H:i:s')
            ];
        }

        $filename = 'products-export-' . now()->format('Y-m-d') . '.csv';

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
