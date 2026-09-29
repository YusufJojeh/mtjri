<?php

namespace App\Ai\Tools\Commerce;

use App\Ai\Tools\ToolContext;
use App\Ai\Tools\ToolResult;

class GetDecliningProducts extends CommerceTool
{
    public function name(): string { return 'get_declining_products'; }

    public function description(): string
    {
        return 'Active products whose units sold dropped at least 40% vs the previous 30 days (only products with at least 4 units previously). Includes stock and current price — the evidence base for a sales-push discount.';
    }

    public function category(): string { return self::ANALYTICS; }

    public function progressLabel(): string { return 'Finding products that need a sales push'; }

    public function handle(ToolContext $ctx, array $args): ToolResult
    {
        $rows = $this->analytics($ctx)->decliningProducts()->take(10);

        return new ToolResult(['products' => $rows, 'currency' => $this->currency($ctx)], 'Declining products', $rows->take(5)->map(fn ($r) => Sources::product($r['product_id'], $r['name']))->all());
    }
}
