<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Global merchant search used by the command palette.
 * Read-only, scoped to the current store, and filtered by permission so
 * a user never sees resources they cannot open.
 */
class MerchantSearchController extends Controller
{
    private const LIMIT = 5;

    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate(['q' => 'nullable|string|max:100']);
        $q = trim((string) ($validated['q'] ?? ''));

        $user = Auth::user();
        $storeId = getCurrentStoreId($user);

        $result = ['orders' => [], 'products' => [], 'customers' => []];
        if ($q === '' || ! $storeId) {
            return response()->json($result);
        }

        $like = '%' . str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $q) . '%';

        if ($user->can('view-orders')) {
            $result['orders'] = Order::where('store_id', $storeId)
                ->where(function ($w) use ($like) {
                    $w->where('order_number', 'like', $like)
                        ->orWhere('customer_email', 'like', $like)
                        ->orWhere('customer_first_name', 'like', $like)
                        ->orWhere('customer_last_name', 'like', $like);
                })
                ->latest()
                ->limit(self::LIMIT)
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
        }

        if ($user->can('view-products')) {
            $result['products'] = Product::where('store_id', $storeId)
                ->where(function ($w) use ($like) {
                    $w->where('name', 'like', $like)->orWhere('sku', 'like', $like);
                })
                ->orderBy('name')
                ->limit(self::LIMIT)
                ->get(['id', 'name', 'sku', 'price', 'stock', 'cover_image', 'is_active'])
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'sku' => $p->sku,
                    'price' => (float) $p->price,
                    'stock' => (int) $p->stock,
                    'image' => $p->cover_image,
                    'active' => (bool) $p->is_active,
                ]);
        }

        if ($user->can('view-customers')) {
            $result['customers'] = Customer::where('store_id', $storeId)
                ->where(function ($w) use ($like) {
                    $w->where('first_name', 'like', $like)
                        ->orWhere('last_name', 'like', $like)
                        ->orWhere('email', 'like', $like)
                        ->orWhere('phone', 'like', $like);
                })
                ->orderBy('first_name')
                ->limit(self::LIMIT)
                ->get(['id', 'first_name', 'last_name', 'email'])
                ->map(fn ($c) => [
                    'id' => $c->id,
                    'name' => trim($c->first_name . ' ' . $c->last_name),
                    'email' => $c->email,
                ]);
        }

        return response()->json($result);
    }
}
