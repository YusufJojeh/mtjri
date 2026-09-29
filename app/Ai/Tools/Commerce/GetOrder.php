<?php

namespace App\Ai\Tools\Commerce;

use App\Ai\Tools\ToolContext;
use App\Ai\Tools\ToolResult;
use App\Models\Order;

class GetOrder extends CommerceTool
{
    public function name(): string { return 'get_order'; }

    public function description(): string
    {
        return 'One order by order_id or order number: items, totals, discount code, fulfilment and payment status, recorded timestamps (placed/shipped/delivered) and the customer name. Contact details are not included.';
    }

    public function parameters(): array
    {
        return ['type' => 'object', 'properties' => [
            'order_id' => ['type' => 'integer'],
            'order_number' => ['type' => 'string', 'maxLength' => 60],
        ], 'additionalProperties' => false];
    }

    public function category(): string { return self::READ; }

    public function permission(): ?string { return 'view-orders'; }

    public function progressLabel(): string { return 'Reviewing an order'; }

    public function handle(ToolContext $ctx, array $args): ToolResult
    {
        $q = Order::with('items')->where('store_id', $ctx->store->id);
        if (! empty($args['order_id'])) {
            $q->where('id', $args['order_id']);
        } elseif (! empty($args['order_number'])) {
            $q->where('order_number', $args['order_number']);
        } else {
            return ToolResult::error('missing_argument', 'Provide order_id or order_number.');
        }
        $o = $q->first();
        if (! $o) {
            return ToolResult::error('not_found', 'No such order in this store.');
        }

        return new ToolResult([
            'order_id' => $o->id,
            'number' => $o->order_number,
            'customer' => trim($o->customer_first_name . ' ' . $o->customer_last_name),
            'customer_id' => $o->customer_id,
            'status' => $o->status,
            'payment_status' => $o->payment_status,
            'payment_method' => $o->payment_method,
            'items' => $o->items->map(fn ($i) => ['product_id' => $i->product_id, 'name' => $i->product_name, 'quantity' => (int) $i->quantity, 'unit_price' => (float) $i->unit_price, 'line_total' => (float) $i->total_price]),
            'subtotal' => (float) $o->subtotal,
            'discount' => (float) $o->discount_amount,
            'coupon_code' => $o->coupon_code,
            'shipping' => (float) $o->shipping_amount,
            'tax' => (float) $o->tax_amount,
            'total' => (float) $o->total_amount,
            'placed_at' => optional($o->created_at)->toIso8601String(),
            'shipped_at' => optional($o->shipped_at)->toIso8601String(),
            'delivered_at' => optional($o->delivered_at)->toIso8601String(),
            'tracking_number' => $o->tracking_number,
            'currency' => $this->currency($ctx),
        ], "Order {$o->order_number}", [Sources::order($o->id, $o->order_number)]);
    }
}
