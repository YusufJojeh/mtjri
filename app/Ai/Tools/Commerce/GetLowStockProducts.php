<?php

namespace App\Ai\Tools\Commerce;

use App\Ai\Tools\ToolContext;
use App\Ai\Tools\ToolResult;

class GetLowStockProducts extends CommerceTool
{
    public function name(): string { return 'get_low_stock_products'; }

    public function description(): string
    {
        return 'Active physical products that are out of stock or at/below the store low-stock threshold, most urgent first.';
    }

    public function category(): string { return self::READ; }

    public function progressLabel(): string { return 'Analysing inventory'; }

    public function handle(ToolContext $ctx, array $args): ToolResult
    {
        $a = $this->analytics($ctx);
        $rows = $a->inventory()->where('active', true)->where('digital', false)->where('state', '!=', 'in_stock')
            ->sortBy(fn ($r) => [$r['stock'] > 0 ? 1 : 0, $r['daysOfCover'] ?? PHP_INT_MAX])->take(15)->values()
            ->map(fn ($r) => collect($r)->only(['id', 'name', 'stock', 'state', 'sold30', 'daysOfCover'])->all());

        return new ToolResult(['threshold' => $a->lowStockThreshold(), 'products' => $rows], 'Low stock', $rows->take(5)->map(fn ($r) => Sources::product($r['id'], $r['name']))->all());
    }
}
