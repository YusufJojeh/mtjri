<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\CategoryRequest;
use Inertia\Inertia;

class CategoryController extends BaseController
{
    /**
     * Display a listing of the categories.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);
        
        $perPage = $request->input('per_page', 10);

        // Get categories for the current store with parent relationship and product count
        $categories = Category::with('parent')
                            ->withCount('products')
                            ->where('store_id', $currentStoreId)
                            ->paginate($perPage);
        
        // Get statistics
        $totalCategories = Category::where('store_id', $currentStoreId)->count();
        $activeCategories = Category::where('store_id', $currentStoreId)->where('is_active', true)->count();
        $parentCategories = Category::where('store_id', $currentStoreId)->whereNull('parent_id')->count();
        $subCategories = Category::where('store_id', $currentStoreId)->whereNotNull('parent_id')->count();
        
        return Inertia::render('categories/index', [
            'categories' => $categories,
            'stats' => [
                'total' => $totalCategories,
                'active' => $activeCategories,
                'parent' => $parentCategories,
                'sub' => $subCategories
            ],
            'filters' => $request->only(['per_page'])
        ]);
    }

    /**
     * Show the form for creating a new category.
     */
    public function create()
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);
        
        // Get all categories for dropdown (for parent selection)
        $parentCategories = Category::where('store_id', $currentStoreId)
                                  ->where('is_active', true)
                                  ->get();
        
        return Inertia::render('categories/create', [
            'parentCategories' => $parentCategories
        ]);
    }

    /**
     * Store a newly created category in storage.
     */
    public function store(CategoryRequest $request)
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);
        
        return \DB::transaction(function () use ($request, $currentStoreId) {
            $validatedData = $request->validated();

            // Generate a unique slug for this store
            $slug = Category::generateUniqueSlug($validatedData['name'], $currentStoreId);
            
            $category = new Category();
            $category->fill($validatedData);
            $category->slug = $slug;
            $category->store_id = $currentStoreId;
            $category->parent_id = $validatedData['parent_id'] === 'none' ? null : $validatedData['parent_id'];
            $category->is_active = $validatedData['is_active'] ?? true;
            $category->save();

            return redirect()->route('categories.index')->with('success', __('Category created successfully'));
        });
    }

    /**
     * Display the specified category.
     */
    public function show(string $id)
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);
        
        $category = Category::with('parent')
                          ->where('store_id', $currentStoreId)
                          ->findOrFail($id);
        
        // Get subcategories with product counts
        $subcategories = Category::where('parent_id', $category->id)
                               ->where('store_id', $currentStoreId)
                               ->withCount('products')
                               ->get();
        
        // Get product count for this category
        $productCount = \App\Models\Product::where('category_id', $category->id)
                                          ->where('store_id', $currentStoreId)
                                          ->count();
        
        // Calculate total revenue from products in this category
        $categoryProducts = \App\Models\Product::where('category_id', $category->id)
                                              ->where('store_id', $currentStoreId)
                                              ->pluck('id');
        
        $totalRevenue = \App\Models\OrderItem::whereIn('product_id', $categoryProducts)
                                            ->sum('total_price');
        
        $stats = [
            'total_products' => $productCount,
            'subcategories_count' => $subcategories->count(),
            'total_revenue' => $totalRevenue,
            'active_products' => \App\Models\Product::where('category_id', $category->id)
                                                   ->where('store_id', $currentStoreId)
                                                   ->where('is_active', true)
                                                   ->count(),
        ];
        
        // Format revenue for display
        $stats['formatted_revenue'] = formatStoreCurrency($totalRevenue, $user->id, $currentStoreId);
        
        return Inertia::render('categories/show', [
            'category' => $category,
            'subcategories' => $subcategories,
            'productCount' => $productCount,
            'stats' => $stats
        ]);
    }

    /**
     * Show the form for editing the specified category.
     */
    public function edit(string $id)
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);
        
        $category = Category::where('store_id', $currentStoreId)->findOrFail($id);
        
        // Get parent categories for dropdown (excluding this category and its children)
        $parentCategories = Category::where('store_id', $currentStoreId)
                                  ->where('id', '!=', $id)
                                  ->where('is_active', true)
                                  ->get();
        
        return Inertia::render('categories/edit', [
            'category' => $category,
            'parentCategories' => $parentCategories
        ]);
    }

    /**
     * Update the specified category in storage.
     */
    public function update(CategoryRequest $request, string $id)
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);
        
        $category = Category::where('store_id', $currentStoreId)->findOrFail($id);
        
        return \DB::transaction(function () use ($request, $id, $category, $currentStoreId) {
            $validatedData = $request->validated();
            
            // Check if name changed, if so, update slug
            if ($category->name !== $validatedData['name']) {
                $category->slug = Category::generateUniqueSlug($validatedData['name'], $currentStoreId);
            }
            $category->fill($validatedData);
            $category->parent_id = $validatedData['parent_id'] === 'none' ? null : $validatedData['parent_id'];
            $category->is_active = $validatedData['is_active'] ?? $category->is_active;
            $category->save();

            return redirect()->route('categories.index')->with('success', __('Category updated successfully'));
        });
    }

    /**
     * Remove the specified category from storage.
     */
    public function destroy(string $id)
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);
        
        $category = Category::where('store_id', $currentStoreId)->findOrFail($id);

        // Authorization check
        $this->authorize('delete', $category);
        
        return \DB::transaction(function () use ($id, $category) {
            // Check if category has subcategories
            $hasSubcategories = Category::where('parent_id', $id)->exists();
            
            if ($hasSubcategories) {
                return redirect()->back()->with('error', __('Cannot delete category with subcategories'));
            }
            
            // Check if category has products (if the relationship exists)
            if (method_exists($category, 'products') && $category->products()->count() > 0) {
                return redirect()->back()->with('error', __('Cannot delete category with products'));
            }
            
            $category->delete();
    
            return redirect()->route('categories.index')->with('success', __('Category deleted successfully'));
        });
    }
    
    /**
     * Export categories data as CSV.
     */
    public function export()
    {
        $user = Auth::user();
        $currentStoreId = getCurrentStoreId($user);
        
        $categories = Category::with('parent')
                            ->where('store_id', $currentStoreId)
                            ->get();
        
        $csvData = [];
        $csvData[] = ['Category Name', 'Slug', 'Parent Category', 'Description', 'Sort Order', 'Status', 'Created Date'];
        
        foreach ($categories as $category) {
            $csvData[] = [
                $category->name,
                $category->slug,
                $category->parent ? $category->parent->name : 'Root Category',
                $category->description ?: 'No description',
                $category->sort_order,
                $category->is_active ? 'Active' : 'Inactive',
                $category->created_at->format('Y-m-d H:i:s')
            ];
        }
        
        $filename = 'categories-export-' . now()->format('Y-m-d') . '.csv';
        
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
