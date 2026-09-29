<?php

namespace App\Ai\Tools\Commerce;

use App\Ai\Tools\ToolContext;
use App\Ai\Tools\ToolResult;
use App\Models\Customer;
use App\Models\Order;

class GetCustomer extends CommerceTool
{
    public function name(): string { return 'get_customer'; }

    public function description(): string
    {
        return 'One customer\'s commerce history: customer since, order count, paid spend, average order value, last order and recent orders. Observed purchasing only — no sensitive traits (no birth date, gender or contact details).';
    }

    public function parameters(): array
    {
        return ['type' => 'object', 'properties' => ['customer_id' => ['type' => 'integer']], 'required' => ['customer_id'], 'additionalProperties' => false];
    }

    public function category(): string { return self::READ; }

    public function permission(): ?string { return 'view-customers'; }

    public function progressLabel(): string { return 'Reviewing customer history'; }

    public static function mask(?string $email): ?string
    {
        if (! $email || ! str_contains($email, '@')) {
            return null;
        }
        [$u, $d] = explode('@', $email, 2);

        return mb_substr($u, 0, 1) . '***@' . $d;
    }

    public function handle(ToolContext $ctx, array $args): ToolResult
    {
        $c = Customer::where('store_id', $ctx->store->id)->find($args['customer_id']);
        if (! $c) {
            return ToolResult::error('not_found', 'No such customer in this store.');
        }
        $orders = Order::where('store_id', $ctx->store->id)->where('customer_id', $c->id)->latest()->get(['id', 'order_number', 'total_amount', 'status', 'payment_status', 'created_at']);
        $paid = $orders->where('payment_status', 'paid');
        $name = trim($c->first_name . ' ' . $c->last_name);

        return new ToolResult([
            'customer_id' => $c->id,
            'name' => $name,
            'customer_since' => optional($c->created_at)->toDateString(),
            'active' => (bool) $c->is_active,
            'orders' => $orders->count(),
            'paid_orders' => $paid->count(),
            'paid_spend' => round((float) $paid->sum('total_amount'), 2),
            'average_order_value' => $paid->count() ? round((float) $paid->avg('total_amount'), 2) : null,
            'last_order_at' => optional($orders->first()?->created_at)->toIso8601String(),
            'recent_orders' => $orders->take(5)->map(fn ($o) => ['order_id' => $o->id, 'number' => $o->order_number, 'total' => (float) $o->total_amount, 'status' => $o->status, 'payment_status' => $o->payment_status, 'placed' => $o->created_at->toDateString()]),
            'currency' => $this->currency($ctx),
        ], $name, [Sources::customer($c->id, $name)]);
    }
}
