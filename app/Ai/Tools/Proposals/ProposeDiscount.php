<?php

namespace App\Ai\Tools\Proposals;

use App\Ai\Tools\AgentProfiles;

class ProposeDiscount extends ProposalTool
{
    public function name(): string { return 'propose_discount'; }

    public function description(): string
    {
        return 'Propose a new store-wide discount code backed by evidence (e.g. declining products or a campaign in Tijraa Knowledge). Creates a pending discount; nothing exists until the merchant approves. Guard-rails: percentage max 50, both start_date and end_date required (YYYY-MM-DD, start today or later, window max 60 days). Discount codes apply to the whole order (product-specific discounts are not supported).';
    }

    public function parameters(): array
    {
        return ['type' => 'object', 'properties' => [
            'name' => ['type' => 'string', 'maxLength' => 120],
            'code' => ['type' => 'string', 'maxLength' => 30, 'description' => 'Uppercase letters/numbers, e.g. LIGHTS15'],
            'type' => ['type' => 'string', 'enum' => ['percentage', 'flat']],
            'value' => ['type' => 'number', 'minimum' => 1],
            'minimum_spend' => ['type' => 'number', 'minimum' => 0],
            'usage_limit' => ['type' => 'integer', 'minimum' => 1],
            'per_customer_limit' => ['type' => 'integer', 'minimum' => 1],
            'start_date' => ['type' => 'string', 'maxLength' => 10],
            'end_date' => ['type' => 'string', 'maxLength' => 10],
        ] + $this->common(), 'required' => ['name', 'code', 'type', 'value', 'start_date', 'end_date', 'goal', 'rationale'], 'additionalProperties' => false];
    }

    public function profiles(): array { return [AgentProfiles::COMMERCE, AgentProfiles::GROWTH]; }

    public function permission(): ?string { return 'view-coupon-system'; }

    public function risk(): string { return 'high'; }

    protected function actionType(): string { return 'discount_create'; }

    protected function payload(array $args): array
    {
        return array_intersect_key($args, array_flip(['name', 'code', 'type', 'value', 'minimum_spend', 'usage_limit', 'per_customer_limit', 'start_date', 'end_date'])) + ['description' => $args['goal'] ?? null];
    }
}
