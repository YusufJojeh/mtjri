<?php

namespace App\Ai\Tools\Commerce;

use App\Ai\Tools\ToolContext;
use App\Ai\Tools\ToolResult;
use App\Models\Order;

class GetRecentOrders extends CommerceTool
{
    public function name(): string { return 'get_recent_orders'; }

    public function description(): string
    {
        return 'Most recent orders (newest first) with number, customer name, total, fulfilment status, payment status and age. Optional status filters.';
    }

    public function parameters(): array
    {
        return ['type' => 'object', 'properties' => [
            'limit' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 20, 'default' => 10],
            'status' => ['type' => 'string', 'enum' => ['any', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'], 'default' => 'any'],
            'payment_status' => ['type' => 'string', 'enum' => ['any', 'pending', 'paid', 'failed', 'refunded'], 'default' => 'any'],
        ], 'additionalProperties' => false];
    }

    public function category(): string { return self::READ; }

    public function permission(): ?string { return 'view-orders'; }

    public function progressLabel(): string { return 'Reviewing orders'; }

    public function handle(ToolContext $ctx, array $args): ToolResult
    {
        $orders = Order::where('store_id', $ctx->store->id)
            ->when($args['status'] !== 'any', fn ($q) => $q->where('status', $args['status']))
            ->when($args['payment_status'] !== 'any', fn ($q) => $q->where('payment_status', $args['payment_status']))
            ->latest()->limit($args['limit'])
            ->get(['id', 'order_number', 'customer_first_name', 'customer_last_name', 'total_amount', 'status', 'payment_status', 'created_at']);

        return new ToolResult([
            'orders' => $orders->map(fn ($o) => [
                'order_id' => $o->id,
                'number' => $o->order_number,
                'customer' => trim($o->customer_first_name . ' ' . $o->customer_last_name),
                'total' => (float) $o->total_amount,
                'status' => $o->status,
                'payment_status' => $o->payment_status,
                'placed' => $o->created_at->toIso8601String(),
                'age_hours' => (int) $o->created_at->diffInHours(now()),
            ]),
            'currency' => $this->currency($ctx),
        ], 'Recent orders', $orders->take(5)->map(fn ($o) => Sources::order($o->id, $o->order_number))->all());
    }
}
