<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Support\MediaReference;
use Illuminate\Http\Request;
use App\Http\Requests\ProductFormRequest;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProductController extends BaseController
{
    /**
     * Display a listing of the products.
     */
    public function index()
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);

        // Get products for the current store with category relationship and PAGINATION - Performance Fix
        $products = Product::with('category')
                        ->where('store_id', $currentStoreId)
                        ->latest()
                        ->paginate(50);

        // Get statistics from ALL products (not just paginated)
        $totalProducts = Product::where('store_id', $currentStoreId)->count();
        $activeProducts = Product::where('store_id', $currentStoreId)->where('is_active', true)->count();
        // Get low stock threshold from settings (default: 20)
        $lowStockThreshold = \App\Models\Setting::getSetting('low_stock_threshold', $user->id, $currentStoreId, 20);
        $lowStockProducts = Product::where('store_id', $currentStoreId)->where('stock', '<=', $lowStockThreshold)->count();
        $totalValue = Product::where('store_id', $currentStoreId)->selectRaw('SUM(price * stock) as total')->value('total') ?? 0;


        return Inertia::render('products/index', [
            'products' => $products,
            'stats' => [
                'total' => $totalProducts,
                'active' => $activeProducts,
                'lowStock' => $lowStockProducts,
                'totalValue' => $totalValue
            ]
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
            $validatedData['cover_image'] = MediaReference::normalizeForStorage($validatedData['cover_image'] ?? null, $request);
            $validatedData['images'] = MediaReference::normalizeCsvForStorage($validatedData['images'] ?? null, $request);
            $validatedData['downloadable_file'] = MediaReference::normalizeForStorage($validatedData['downloadable_file'] ?? null, $request);
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

        return Inertia::render('products/show', [
            'product' => $product,
            'stats' => $stats
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
            $validatedData['cover_image'] = MediaReference::normalizeForStorage($validatedData['cover_image'] ?? null, $request);
            $validatedData['images'] = MediaReference::normalizeCsvForStorage($validatedData['images'] ?? null, $request);
            $validatedData['downloadable_file'] = MediaReference::normalizeForStorage($validatedData['downloadable_file'] ?? null, $request);

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
