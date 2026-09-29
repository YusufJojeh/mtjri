<?php

namespace App\Ai\Tools\Commerce;

use App\Ai\Tools\ToolContext;
use App\Ai\Tools\ToolResult;

class GetTopProducts extends CommerceTool
{
    public function name(): string { return 'get_top_products'; }

    public function description(): string
    {
        return 'Best-selling products over the last N days ranked by revenue or units, with current stock.';
    }

    public function parameters(): array
    {
        return ['type' => 'object', 'properties' => [
            'days' => self::days(),
            'by' => ['type' => 'string', 'enum' => ['revenue', 'units'], 'default' => 'revenue'],
            'limit' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 15, 'default' => 5],
        ], 'additionalProperties' => false];
    }

    public function category(): string { return self::ANALYTICS; }

    public function progressLabel(): string { return 'Checking products'; }

    public function handle(ToolContext $ctx, array $args): ToolResult
    {
        $rows = $this->analytics($ctx)->topProducts($args['days'], $args['by'], $args['limit']);

        return new ToolResult(['products' => $rows, 'currency' => $this->currency($ctx)], 'Top products', $rows->take(5)->map(fn ($r) => Sources::product($r['product_id'], $r['name']))->all());
    }
}
