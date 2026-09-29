<?php

namespace App\Ai\Tools\Commerce;

use App\Ai\Tools\ToolContext;
use App\Ai\Tools\ToolResult;

class GetRevenueTrend extends CommerceTool
{
    public function name(): string { return 'get_revenue_trend'; }

    public function description(): string
    {
        return 'Daily or weekly sales series for the last N days, each point aligned with the same day/week of the previous period. Use to explain when and how sales changed.';
    }

    public function parameters(): array
    {
        return ['type' => 'object', 'properties' => [
            'days' => self::days(),
            'granularity' => ['type' => 'string', 'enum' => ['day', 'week'], 'default' => 'week'],
        ], 'additionalProperties' => false];
    }

    public function category(): string { return self::ANALYTICS; }

    public function progressLabel(): string { return 'Analysing the sales trend'; }

    public function handle(ToolContext $ctx, array $args): ToolResult
    {
        $points = $this->analytics($ctx)->trend($args['days'], $args['granularity']);
        $best = collect($points)->sortByDesc('sales')->first();

        return new ToolResult(['granularity' => $args['granularity'], 'points' => $points, 'best' => $best, 'currency' => $this->currency($ctx)], 'Sales trend', [Sources::dataset("Sales trend · last {$args['days']} days", route('analytics.index'))]);
    }
}
