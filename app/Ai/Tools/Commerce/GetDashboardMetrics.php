<?php

namespace App\Ai\Tools\Commerce;

use App\Ai\Tools\ToolContext;
use App\Ai\Tools\ToolResult;

class GetDashboardMetrics extends CommerceTool
{
    public function name(): string { return 'get_dashboard_metrics'; }

    public function description(): string
    {
        return 'Sales, orders and average order value for the last N days compared with the previous N days, with percentage change (null when there is no baseline).';
    }

    public function parameters(): array
    {
        return ['type' => 'object', 'properties' => ['days' => self::days()], 'additionalProperties' => false];
    }

    public function category(): string { return self::ANALYTICS; }

    public function progressLabel(): string { return 'Reviewing store performance'; }

    public function handle(ToolContext $ctx, array $args): ToolResult
    {
        $data = $this->analytics($ctx)->periodComparison($args['days']);

        return new ToolResult($data + ['currency' => $this->currency($ctx)], "Sales and orders, last {$args['days']} days", [Sources::dataset("Sales & orders · last {$args['days']} days", route('analytics.index'))]);
    }
}
