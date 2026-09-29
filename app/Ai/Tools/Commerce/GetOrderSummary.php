<?php

namespace App\Ai\Tools\Commerce;

use App\Ai\Tools\ToolContext;
use App\Ai\Tools\ToolResult;

class GetOrderSummary extends CommerceTool
{
    public function name(): string { return 'get_order_summary'; }

    public function description(): string
    {
        return 'Order health: counts by fulfilment and payment status, open orders, open orders older than 48h, paid orders ready to ship, failed payments (count and value) and shipped-but-unpaid orders.';
    }

    public function parameters(): array
    {
        return ['type' => 'object', 'properties' => ['days' => self::days()], 'additionalProperties' => false];
    }

    public function category(): string { return self::ANALYTICS; }

    public function progressLabel(): string { return 'Reviewing orders'; }

    public function handle(ToolContext $ctx, array $args): ToolResult
    {
        return new ToolResult($this->analytics($ctx)->orderSummary($args['days']), 'Order health', [Sources::dataset('Order status summary', route('orders.index'))]);
    }
}
