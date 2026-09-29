<?php

namespace App\Ai\Tools\Commerce;

use App\Ai\Tools\ToolContext;
use App\Ai\Tools\ToolResult;

class GetInventoryStatus extends CommerceTool
{
    public function name(): string { return 'get_inventory_status'; }

    public function description(): string
    {
        return 'Inventory health (product-level stock): counts by state, units on open orders, and the most urgent products sorted by days of cover at the last 30 days\' sales pace.';
    }

    public function parameters(): array
    {
        return ['type' => 'object', 'properties' => [
            'view' => ['type' => 'string', 'enum' => ['urgent', 'low', 'out', 'all'], 'default' => 'urgent'],
            'limit' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 25, 'default' => 10],
        ], 'additionalProperties' => false];
    }

    public function category(): string { return self::ANALYTICS; }

    public function progressLabel(): string { return 'Analysing inventory'; }

    public function handle(ToolContext $ctx, array $args): ToolResult
    {
        $a = $this->analytics($ctx);
        $rows = $a->inventory()->where('active', true)->where('digital', false);
        $list = match ($args['view']) {
            'low' => $rows->where('state', 'low_stock'),
            'out' => $rows->where('state', 'out_of_stock'),
            'all' => $rows,
            default => $rows->filter(fn ($r) => $r['state'] !== 'in_stock' || ($r['daysOfCover'] !== null && $r['daysOfCover'] <= 21)),
        };
        $list = $list->sortBy(fn ($r) => [$r['daysOfCover'] ?? PHP_INT_MAX, $r['stock']])->take($args['limit'])->values()
            ->map(fn ($r) => collect($r)->only(['id', 'name', 'sku', 'stock', 'state', 'onOpenOrders', 'sold30', 'daysOfCover'])->all());

        return new ToolResult([
            'low_stock_threshold' => $a->lowStockThreshold(),
            'counts' => ['out_of_stock' => $rows->where('state', 'out_of_stock')->count(), 'low_stock' => $rows->where('state', 'low_stock')->count(), 'healthy' => $rows->where('state', 'in_stock')->count()],
            'units_on_open_orders' => $rows->sum('onOpenOrders'),
            'products' => $list,
        ], 'Inventory', array_merge([Sources::dataset('Inventory snapshot', route('inventory.index'))], $list->take(4)->map(fn ($r) => Sources::product($r['id'], $r['name']))->all()));
    }
}
