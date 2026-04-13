<?php

namespace App\Http\Controllers;

use App\Models\Store;
use App\Models\StoreSetting;
use App\Models\Category;
use App\Models\Product;
use App\Models\Blog;
use App\Models\Setting;
use App\Models\Currency;
use App\Services\StoreContentGenerationService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StoreContentController extends BaseController
{
    public function index()
    {
        $user = auth()->user();

        // If user is company type, show their own stores
        if ($user->type === 'company') {
            $stores = Store::where('user_id', $user->id)->get();
        }
        // If user has store content permissions, show creator's stores
        elseif ($user->can('view-store-content') && $user->created_by) {
            $stores = Store::where('user_id', $user->created_by)->get();
        }
        // Otherwise, show user's own stores (if any)
        else {
            $stores = Store::where('user_id', $user->id)->get();
        }

        return Inertia::render('stores/content/index', [
            'stores' => $stores
        ]);
    }

    public function show(Request $request, $storeId)
    {
        $user = auth()->user();

        // Check if registration is complete for company users
        if ($user->type === 'company') {
            $step1Complete = session('registration_step_1_complete', false);
            $step2Complete = session('registration_step_2_complete', false);
            $step3Complete = session('registration_step_3_complete', false);

            // If session variables are missing, check database to see if registration is actually complete
            if (!($step1Complete && $step2Complete && $step3Complete)) {
                // Check if user has at least one store with a theme set (indicates step 3 is complete)
                $hasStoreWithTheme = $user->stores()
                    ->whereNotNull('theme')
                    ->where('theme', '!=', '')
                    ->exists();
                
                if ($hasStoreWithTheme) {
                    // User has completed registration, restore session variables
                    $store = $user->stores()->whereNotNull('theme')->where('theme', '!=', '')->first();
                    session([
                        'registration_step_1_complete' => true,
                        'registration_step_2_complete' => true,
                        'registration_step_3_complete' => true,
                        'registration_complete' => true,
                        'registration_store_id' => $store->id,
                    ]);
                } else {
                    // User hasn't completed registration
                    return redirect()->route('dashboard')
                        ->with('error', __('Please complete the registration process before accessing this page.'));
                }
            }
        }

        // Build query based on user type and permissions
        $query = Store::where('id', $storeId);

        if ($user->type === 'company') {
            $query->where('user_id', $user->id);
        } elseif ($user->can('view-store-content') && $user->created_by) {
            $query->where('user_id', $user->created_by);
        } else {
            $query->where('user_id', $user->id);
        }

        $store = $query->firstOrFail();

        $theme = $request->get('theme', $store->theme ?? 'default');
        $settings = StoreSetting::getSettings($storeId, $theme);

        $storeSetting = StoreSetting::where('store_id', $storeId)
                                    ->where('theme', $theme)
                                    ->first();

        // Fetch real data for preview (matching ThemeController::home() pattern)
        // Get categories for the store
        try {
            $categories = Category::where('store_id', $storeId)
                ->where('is_active', true)
                ->whereNull('parent_id') // Only get parent categories
                ->orderBy('sort_order')
                ->orderBy('name')
                ->latest()
                ->take(4)
                ->get()
                ->map(function ($category) {
                    return [
                        'id' => $category->id,
                        'name' => $category->name,
                        'slug' => $category->slug,
                        'description' => $category->description,
                        'image' => $category->image,
                    ];
                })
                ->values()
                ->toArray();
        } catch (\Exception $e) {
            $categories = [];
        }

        // Get featured products for the store
        try {
            $featuredProducts = Product::where('store_id', $storeId)
                ->where('is_active', true)
                ->with('category')
                ->latest()
                ->take(8)
                ->get()
                ->map(function ($product) {
                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'price' => $product->price,
                        'sale_price' => $product->sale_price,
                        'cover_image' => $product->cover_image,
                        'stock' => $product->stock,
                        'is_active' => $product->is_active,
                        'variants' => $product->variants,
                        'slug' => $product->slug ?? $product->id,
                        'category' => [
                            'id' => $product->category->id ?? null,
                            'name' => $product->category->name ?? 'Uncategorized',
                        ],
                    ];
                })
                ->values()
                ->toArray();
        } catch (\Exception $e) {
            $featuredProducts = [];
        }

        // Get trending products for the store (different from featured)
        try {
            $trendingProducts = Product::where('store_id', $storeId)
                ->where('is_active', true)
                ->with('category')
                ->orderBy('created_at', 'desc')
                ->take(12)
                ->get()
                ->map(function ($product) {
                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'price' => $product->price,
                        'sale_price' => $product->sale_price,
                        'cover_image' => $product->cover_image,
                        'stock' => $product->stock,
                        'is_active' => $product->is_active,
                        'variants' => $product->variants,
                        'slug' => $product->slug ?? $product->id,
                        'category' => [
                            'id' => $product->category->id ?? null,
                            'name' => $product->category->name ?? 'Uncategorized',
                        ],
                    ];
                })
                ->values()
                ->toArray();
        } catch (\Exception $e) {
            $trendingProducts = [];
        }

        // Get latest blog posts for the store
        try {
            $blogPosts = Blog::where('store_id', $storeId)
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                ->with(['author', 'category'])
                ->latest('published_at')
                ->take(3)
                ->get()
                ->map(function ($post) {
                    return [
                        'id' => $post->id,
                        'title' => $post->title,
                        'slug' => $post->slug,
                        'excerpt' => $post->excerpt,
                        'featured_image' => $post->featured_image,
                        'published_at' => $post->published_at,
                        'author' => [
                            'id' => $post->author->id ?? null,
                            'name' => $post->author->name ?? 'Unknown',
                        ],
                        'category' => [
                            'id' => $post->category->id ?? null,
                            'name' => $post->category->name ?? null,
                        ],
                    ];
                })
                ->values()
                ->toArray();
        } catch (\Exception $e) {
            $blogPosts = [];
        }

        // Get store-specific currency settings
        $storeSettings = [];
        $currencies = [];
        
        try {
            if ($store->user) {
                $storeSettings = Setting::getUserSettings($store->user->id, $storeId);
                if (!is_array($storeSettings)) {
                    $storeSettings = [];
                }
                $currencies = Currency::all()->map(function ($currency) {
                    return [
                        'code' => $currency->code,
                        'symbol' => $currency->symbol,
                        'name' => $currency->name
                    ];
                })->values()->toArray();
            }
        } catch (\Exception $e) {
            $storeSettings = [];
            $currencies = [];
        }

        return Inertia::render('stores/content/edit', [
            'store' => $store,
            'settings' => $settings,
            'theme' => $theme,
            'contentGenerationStatus' => $storeSetting ? $storeSetting->content_generation_status : 'completed',
            'contentGeneratedAt' => $storeSetting ? $storeSetting->content_generated_at : null,
            // Preview data
            'categories' => $categories,
            'featuredProducts' => $featuredProducts,
            'trendingProducts' => $trendingProducts,
            'blogPosts' => $blogPosts,
            'storeSettings' => $storeSettings,
            'currencies' => $currencies,
        ]);
    }

    public function update(Request $request, $storeId)
    {
        $user = auth()->user();

        // Build query based on user type and permissions
        $query = Store::where('id', $storeId);

        if ($user->type === 'company') {
            $query->where('user_id', $user->id);
        } elseif ($user->can('edit-store-content') && $user->created_by) {
            $query->where('user_id', $user->created_by);
        } else {
            $query->where('user_id', $user->id);
        }

        $store = $query->firstOrFail();

        $validated = $request->validate([
            'content' => 'required|array',
            'theme' => 'string|nullable'
        ]);

        $theme = $validated['theme'] ?? $request->get('theme', $store->theme ?? 'default');
        StoreSetting::updateSettings($storeId, $theme, $validated['content']);

        return redirect()->back()->with('success', 'Store content updated successfully!');
    }

    public function regenerateSection(Request $request, $storeId)
    {
        $user = auth()->user();

        $query = Store::where('id', $storeId);
        if ($user->type === 'company') {
            $query->where('user_id', $user->id);
        } elseif ($user->can('edit-store-content') && $user->created_by) {
            $query->where('user_id', $user->created_by);
        } else {
            $query->where('user_id', $user->id);
        }
        $store = $query->firstOrFail();

        $validated = $request->validate([
            'section' => 'required|string',
            'theme' => 'string|nullable'
        ]);

        $sectionName = $validated['section'];
        $theme = $validated['theme'] ?? $request->get('theme', $store->theme ?? 'default');

        // Generate unique job ID
        $jobId = 'regenerate_' . time() . '_' . uniqid();

        // Dispatch job asynchronously
        \App\Jobs\RegenerateSectionJob::dispatch($storeId, $sectionName, $theme, $jobId);

        // Store initial progress in cache
        \Illuminate\Support\Facades\Cache::put("content_regeneration:job:{$jobId}", [
            'status' => 'pending',
            'progress' => 0,
            'current_step' => __('Job queued...'),
            'section' => $sectionName,
            'error_code' => null,
            'error_message' => null,
            'created_at' => now()->toIso8601String(),
            'completed_at' => null,
        ], 1800); // 30 minutes TTL

        return response()->json([
            'success' => true,
            'job_id' => $jobId,
            'status' => 'pending',
            'message' => __('Regeneration job started.'),
        ], 200);
    }

    public function getRegenerationStatus(Request $request, $storeId, $jobId)
    {
        $user = auth()->user();

        // Verify user has access to store
        $query = Store::where('id', $storeId);
        if ($user->type === 'company') {
            $query->where('user_id', $user->id);
        } elseif ($user->can('view-store-content') && $user->created_by) {
            $query->where('user_id', $user->created_by);
        } else {
            $query->where('user_id', $user->id);
        }
        $store = $query->firstOrFail();

        // Retrieve progress from cache
        $cacheKey = "content_regeneration:job:{$jobId}";
        $progress = \Illuminate\Support\Facades\Cache::get($cacheKey);

        if (!$progress) {
            return response()->json([
                'status' => 'not_found',
                'message' => __('Job not found or expired.'),
            ], 404);
        }

        return response()->json([
            'status' => $progress['status'],
            'progress' => $progress['progress'] ?? 0,
            'current_step' => $progress['current_step'] ?? '',
            'section' => $progress['section'] ?? '',
            'error_code' => $progress['error_code'] ?? null,
            'error_message' => $progress['error_message'] ?? null,
            'content' => $progress['content'] ?? null,
            'quality_metrics' => $progress['quality_metrics'] ?? null,
        ], 200);
    }
}
