<?php

namespace App\Ai\Tools\Commerce;

/** Store-data citation builders (shown to merchants as "Store data"). */
final class Sources
{
    public static function product(int $id, string $name): array
    {
        return ['kind' => 'store_data', 'label' => "Product #{$id} · {$name}", 'resource_type' => 'product', 'resource_id' => $id, 'url' => route('products.show', $id)];
    }

    public static function order(int $id, string $number): array
    {
        return ['kind' => 'store_data', 'label' => "Order {$number}", 'resource_type' => 'order', 'resource_id' => $id, 'url' => route('orders.show', $id)];
    }

    public static function customer(int $id, string $name): array
    {
        return ['kind' => 'store_data', 'label' => "Customer · {$name}", 'resource_type' => 'customer', 'resource_id' => $id, 'url' => route('customers.show', $id)];
    }

    public static function discount(int $id, string $code): array
    {
        return ['kind' => 'store_data', 'label' => "Discount {$code}", 'resource_type' => 'discount', 'resource_id' => $id, 'url' => route('coupon-system.show', $id)];
    }

    public static function dataset(string $label, ?string $url = null): array
    {
        return array_filter(['kind' => 'store_data', 'label' => $label, 'url' => $url]);
    }
}
