<?php

namespace App\Ai\Tools\Commerce;

use App\Ai\Tools\ToolContext;
use App\Ai\Tools\ToolResult;
use App\Models\Product;

class GetProductPerformance extends CommerceTool
{
    public function name(): string { return 'get_product_performance'; }

    public function description(): string
    {
        return 'Units sold, revenue and order count for one product over the last N days vs the previous N days.';
    }

    public function parameters(): array
    {
        return ['type' => 'object', 'properties' => ['product_id' => ['type' => 'integer'], 'days' => self::days()], 'required' => ['product_id'], 'additionalProperties' => false];
    }

    public function category(): string { return self::ANALYTICS; }

    public function permission(): ?string { return 'view-products'; }

    public function progressLabel(): string { return 'Analysing product performance'; }

    public function handle(ToolContext $ctx, array $args): ToolResult
    {
        $p = Product::where('store_id', $ctx->store->id)->find($args['product_id'], ['id', 'name', 'stock']);
        if (! $p) {
            return ToolResult::error('not_found', 'No such product in this store.');
        }

        return new ToolResult(['product_id' => $p->id, 'name' => $p->name, 'stock' => (int) $p->stock]
            + $this->analytics($ctx)->productPerformance($p->id, $args['days']) + ['currency' => $this->currency($ctx)], "{$p->name} performance", [Sources::product($p->id, $p->name)]);
    }
}
