<?php

namespace App\Ai\Tools\Commerce;

use App\Ai\Tools\ToolContext;
use App\Ai\Tools\ToolResult;
use App\Models\Product;

class SearchProducts extends CommerceTool
{
    public function name(): string { return 'search_products'; }

    public function description(): string
    {
        return 'Find products by name or SKU, optionally filtered by status or stock state. Returns id, name, price, sale price, stock and status.';
    }

    public function parameters(): array
    {
        return ['type' => 'object', 'properties' => [
            'query' => ['type' => 'string', 'maxLength' => 100, 'default' => ''],
            'status' => ['type' => 'string', 'enum' => ['any', 'active', 'draft'], 'default' => 'any'],
            'stock' => ['type' => 'string', 'enum' => ['any', 'in_stock', 'low_stock', 'out_of_stock'], 'default' => 'any'],
            'limit' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 25, 'default' => 10],
        ], 'additionalProperties' => false];
    }

    public function category(): string { return self::READ; }

    public function permission(): ?string { return 'view-products'; }

    public function progressLabel(): string { return 'Checking products'; }

    public function handle(ToolContext $ctx, array $args): ToolResult
    {
        $threshold = $this->analytics($ctx)->lowStockThreshold();
        $like = '%' . str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $args['query']) . '%';
        $products = Product::where('store_id', $ctx->store->id)
            ->when($args['query'] !== '', fn ($q) => $q->where(fn ($w) => $w->where('name', 'like', $like)->orWhere('sku', 'like', $like)))
            ->when($args['status'] === 'active', fn ($q) => $q->where('is_active', true))
            ->when($args['status'] === 'draft', fn ($q) => $q->where('is_active', false))
            ->when($args['stock'] === 'out_of_stock', fn ($q) => $q->where('stock', '<=', 0))
            ->when($args['stock'] === 'low_stock', fn ($q) => $q->where('stock', '>', 0)->where('stock', '<=', $threshold))
            ->when($args['stock'] === 'in_stock', fn ($q) => $q->where('stock', '>', $threshold))
            ->orderBy('name')->limit($args['limit'])
            ->get(['id', 'name', 'sku', 'price', 'sale_price', 'stock', 'is_active']);

        return new ToolResult([
            'products' => $products->map(fn ($p) => [
                'product_id' => $p->id, 'name' => $p->name, 'sku' => $p->sku, 'price' => (float) $p->price,
                'sale_price' => $p->sale_price !== null ? (float) $p->sale_price : null, 'stock' => (int) $p->stock, 'active' => (bool) $p->is_active,
            ]),
            'low_stock_threshold' => $threshold,
            'currency' => $this->currency($ctx),
        ], 'Products', $products->take(5)->map(fn ($p) => Sources::product($p->id, $p->name))->all());
    }
}
