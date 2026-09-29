<?php

namespace App\Ai\Tools\Commerce;

use App\Ai\Tools\ToolContext;
use App\Ai\Tools\ToolResult;

class GetCustomerSummary extends CommerceTool
{
    public function name(): string { return 'get_customer_summary'; }

    public function description(): string
    {
        return 'Customer base: total customers, new customers, buyers and repeat buyers in the window, and top customers by paid spend over 12 months.';
    }

    public function parameters(): array
    {
        return ['type' => 'object', 'properties' => ['days' => self::days()], 'additionalProperties' => false];
    }

    public function category(): string { return self::ANALYTICS; }

    public function progressLabel(): string { return 'Reviewing customers'; }

    public function handle(ToolContext $ctx, array $args): ToolResult
    {
        return new ToolResult($this->analytics($ctx)->customerSummary($args['days']) + ['currency' => $this->currency($ctx)], 'Customers', [Sources::dataset('Customer summary', route('customers.index'))]);
    }
}
