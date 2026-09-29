<?php

namespace App\Ai\Tools\Commerce;

use App\Ai\Tools\ToolContext;
use App\Ai\Tools\ToolResult;
use App\Models\Customer;
use App\Models\Order;

class SearchCustomers extends CommerceTool
{
    public function name(): string { return 'search_customers'; }

    public function description(): string
    {
        return 'Find customers by name or email. Returns id, name, masked email, order count and lifetime spend from paid orders. No sensitive personal data.';
    }

    public function parameters(): array
    {
        return ['type' => 'object', 'properties' => [
            'query' => ['type' => 'string', 'maxLength' => 100],
            'limit' => ['type' => 'integer', 'minimum' => 1, 'maximum' => 20, 'default' => 8],
        ], 'required' => ['query'], 'additionalProperties' => false];
    }

    public function category(): string { return self::READ; }

    public function permission(): ?string { return 'view-customers'; }

    public function progressLabel(): string { return 'Looking up customers'; }

    public function handle(ToolContext $ctx, array $args): ToolResult
    {
        $like = '%' . str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $args['query']) . '%';
        $customers = Customer::where('store_id', $ctx->store->id)
            ->where(fn ($w) => $w->where('first_name', 'like', $like)->orWhere('last_name', 'like', $like)->orWhere('email', 'like', $like))
            ->limit($args['limit'])->get(['id', 'first_name', 'last_name', 'email']);
        $stats = Order::where('store_id', $ctx->store->id)->whereIn('customer_id', $customers->pluck('id'))->where('payment_status', 'paid')
            ->selectRaw('customer_id, COUNT(*) as orders, SUM(total_amount) as spend')->groupBy('customer_id')->get()->keyBy('customer_id');

        return new ToolResult([
            'customers' => $customers->map(fn ($c) => [
                'customer_id' => $c->id,
                'name' => trim($c->first_name . ' ' . $c->last_name),
                'email' => GetCustomer::mask($c->email),
                'paid_orders' => (int) ($stats[$c->id]->orders ?? 0),
                'lifetime_spend' => round((float) ($stats[$c->id]->spend ?? 0), 2),
            ]),
            'currency' => $this->currency($ctx),
        ], 'Customers', $customers->take(5)->map(fn ($c) => Sources::customer($c->id, trim($c->first_name . ' ' . $c->last_name)))->all());
    }
}
