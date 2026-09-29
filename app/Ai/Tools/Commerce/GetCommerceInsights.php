<?php

namespace App\Ai\Tools\Commerce;

use App\Ai\Tools\ToolContext;
use App\Ai\Tools\ToolResult;
use App\Services\Commerce\CommerceIntelligence;

class GetCommerceInsights extends CommerceTool
{
    public function name(): string { return 'get_commerce_insights'; }

    public function description(): string
    {
        return 'Tijraa Commerce Intelligence: deterministic, evidence-backed findings (revenue/AOV movement, declining products, stock-outs, low cover, fulfilment backlog, failed payments, discount issues, repeat rate, content and SEO gaps) ranked by severity with estimated impact. Use this before recommending what to improve.';
    }

    public function category(): string { return self::ANALYTICS; }

    public function progressLabel(): string { return 'Running commerce intelligence'; }

    public function handle(ToolContext $ctx, array $args): ToolResult
    {
        $insights = (new CommerceIntelligence($this->analytics($ctx)))->refresh()
            ->sortBy(fn ($i) => ['critical' => 0, 'high' => 1, 'medium' => 2, 'low' => 3, 'positive' => 4][$i->severity] ?? 5)->values();

        return new ToolResult([
            'insights' => $insights->take(12)->map(fn ($i) => [
                'insight_id' => $i->id,
                'type' => $i->type,
                'severity' => $i->severity,
                'title' => $i->title,
                'detail' => $i->description,
                'metric' => $i->metric,
                'previous' => $i->previous_value,
                'current' => $i->current_value,
                'estimated_impact' => $i->estimated_impact,
                'resource' => $i->resource_type ? ['type' => $i->resource_type, 'id' => $i->resource_id] : null,
            ]),
            'currency' => $this->currency($ctx),
        ], 'Commerce insights', [Sources::dataset('Tijraa Commerce Intelligence', route('dashboard'))]);
    }
}
