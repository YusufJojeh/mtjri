<?php

namespace App\Ai\Tools\Commerce;

use App\Ai\Tools\ToolContext;
use App\Ai\Tools\ToolResult;

class GetDiscountPerformance extends CommerceTool
{
    public function name(): string { return 'get_discount_performance'; }

    public function description(): string
    {
        return 'Discount codes with type, value, minimum spend, state (active/scheduled/expired/paused), dates, usage and the orders, revenue and discount given through each code.';
    }

    public function parameters(): array
    {
        return ['type' => 'object', 'properties' => ['code' => ['type' => 'string', 'maxLength' => 50]], 'additionalProperties' => false];
    }

    public function category(): string { return self::ANALYTICS; }

    public function permission(): ?string { return 'view-coupon-system'; }

    public function progressLabel(): string { return 'Reviewing discounts'; }

    public function handle(ToolContext $ctx, array $args): ToolResult
    {
        $rows = $this->analytics($ctx)->discountPerformance($args['code'] ?? null);

        return new ToolResult(['discounts' => $rows, 'currency' => $this->currency($ctx)], 'Discounts', $rows->take(5)->map(fn ($d) => Sources::discount($d['id'], $d['code']))->all());
    }
}
