<?php

namespace App\Ai\Tools\Commerce;

use App\Ai\Tools\AgentProfiles;
use App\Ai\Tools\ToolContext;
use App\Ai\Tools\ToolResult;
use App\Models\Ai\CommerceInsight;

/**
 * ACTION tool: mutates AI-owned state only (hides an insight the merchant
 * said is not relevant). It never changes commerce data.
 */
class DismissInsight extends CommerceTool
{
    public function name(): string { return 'dismiss_insight'; }

    public function description(): string
    {
        return 'Hide a Commerce Intelligence insight ONLY when the merchant explicitly says it is not relevant. Does not change any store data.';
    }

    public function parameters(): array
    {
        return ['type' => 'object', 'properties' => ['insight_id' => ['type' => 'integer']], 'required' => ['insight_id'], 'additionalProperties' => false];
    }

    public function category(): string { return self::ACTION; }

    public function profiles(): array { return [AgentProfiles::COMMERCE, AgentProfiles::OPERATIONS, AgentProfiles::GROWTH]; }

    public function progressLabel(): string { return 'Updating insights'; }

    public function handle(ToolContext $ctx, array $args): ToolResult
    {
        $i = CommerceInsight::forStore($ctx->store->id)->find($args['insight_id']);
        if (! $i) {
            return ToolResult::error('not_found', 'No such insight in this store.');
        }
        $i->update(['dismissed_at' => now()]);

        return new ToolResult(['dismissed' => true, 'insight_id' => $i->id], 'Insight dismissed');
    }
}
