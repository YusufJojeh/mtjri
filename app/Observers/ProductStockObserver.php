<?php

namespace App\Observers;

use App\Models\Product;
use App\Models\Setting;
use App\Models\Store;
use App\Services\Notifications\MerchantNotifier;

/** Low / out-of-stock alerts when stock crosses the store threshold (deduped per day). */
class ProductStockObserver
{
    public function updated(Product $product): void
    {
        if (! $product->wasChanged('stock') || ! $product->is_active) {
            return;
        }
        try {
            $store = Store::find($product->store_id);
            if (! $store) {
                return;
            }
            $before = (int) $product->getOriginal('stock');
            $now = (int) $product->stock;
            $threshold = (int) Setting::getSetting('low_stock_threshold', $store->user_id, $store->id, 20);
            $hours = (int) config('tijraa.notifications.low_stock_dedupe_hours', 24);
            $url = route('products.edit', $product->id, false);
            if ($now <= 0 && $before > 0) {
                MerchantNotifier::notify($store, 'out_of_stock', ':name is out of stock', null, ['name' => $product->name], $url, "out_of_stock:{$product->id}", $hours);
            } elseif ($now > 0 && $now <= $threshold && $before > $threshold) {
                MerchantNotifier::notify($store, 'low_stock', ':name is running low (:stock left)', null, ['name' => $product->name, 'stock' => $now], $url, "low_stock:{$product->id}", $hours);
            }
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
