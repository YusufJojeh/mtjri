<?php

namespace App\Observers;

use App\Models\Order;
use App\Models\Store;
use App\Services\Notifications\MerchantNotifier;

/** Store notifications for new orders and failed payments. Never breaks checkout. */
class OrderNotificationObserver
{
    public function created(Order $order): void
    {
        $this->safely(function () use ($order) {
            $store = Store::find($order->store_id);
            if (! $store) {
                return;
            }
            MerchantNotifier::notify($store, 'new_order', 'New order :number', ':total from :customer',
                ['number' => $order->order_number, 'total' => (float) $order->total_amount, 'customer' => trim($order->customer_first_name . ' ' . $order->customer_last_name) ?: '—'],
                route('orders.show', $order->id, false), "new_order:{$order->id}");
            if ($order->payment_status === 'failed') {
                $this->paymentFailed($store, $order);
            }
        });
    }

    public function updated(Order $order): void
    {
        if ($order->wasChanged('payment_status') && $order->payment_status === 'failed') {
            $this->safely(fn () => ($store = Store::find($order->store_id)) && $this->paymentFailed($store, $order));
        }
    }

    private function paymentFailed(Store $store, Order $order): bool
    {
        MerchantNotifier::notify($store, 'payment_failed', 'Payment failed for order :number', null,
            ['number' => $order->order_number, 'total' => (float) $order->total_amount], route('orders.show', $order->id, false), "payment_failed:{$order->id}");

        return true;
    }

    private function safely(callable $fn): void
    {
        try {
            $fn();
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
