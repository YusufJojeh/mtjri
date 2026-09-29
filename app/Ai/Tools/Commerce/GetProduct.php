<?php

namespace App\Ai\Tools\Commerce;

use App\Ai\Tools\ToolContext;
use App\Ai\Tools\ToolResult;
use App\Models\Product;

class GetProduct extends CommerceTool
{
    public function name(): string { return 'get_product'; }

    public function description(): string
    {
        return 'Full detail of one product: name, SKU, category, price, sale price, stock, status, variant options, and the current description/specifications as plain text.';
    }

    public function parameters(): array
    {
        return ['type' => 'object', 'properties' => ['product_id' => ['type' => 'integer']], 'required' => ['product_id'], 'additionalProperties' => false];
    }

    public function category(): string { return self::READ; }

    public function permission(): ?string { return 'view-products'; }

    public function progressLabel(): string { return 'Checking products'; }

    public function handle(ToolContext $ctx, array $args): ToolResult
    {
        $p = Product::with('category:id,name')->where('store_id', $ctx->store->id)->find($args['product_id']);
        if (! $p) {
            return ToolResult::error('not_found', 'No such product in this store.');
        }
        $text = fn ($html) => trim(preg_replace('/\s+/', ' ', html_entity_decode(strip_tags((string) $html))));

        return new ToolResult([
            'product_id' => $p->id,
            'name' => $p->name,
            'sku' => $p->sku,
            'category' => $p->category?->name,
            'price' => (float) $p->price,
            'sale_price' => $p->sale_price !== null ? (float) $p->sale_price : null,
            'stock' => (int) $p->stock,
            'active' => (bool) $p->is_active,
            'variants' => $p->variants ?: [],
            'description' => mb_substr($text($p->description), 0, 1500),
            'specifications' => mb_substr($text($p->specifications), 0, 800),
            'details' => mb_substr($text($p->details), 0, 800),
            'updated_at' => optional($p->updated_at)->toIso8601String(),
            'currency' => $this->currency($ctx),
        ], $p->name, [Sources::product($p->id, $p->name)]);
    }
}
