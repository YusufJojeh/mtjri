<?php

namespace App\Ai\Tools\Commerce;

use App\Ai\Tools\ToolContext;
use App\Ai\Tools\ToolResult;
use App\Models\Ai\AgentAction;
use App\Models\Ai\KnowledgeDocument;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;

class GetStoreSummary extends CommerceTool
{
    public function name(): string { return 'get_store_summary'; }

    public function description(): string
    {
        return 'Snapshot of the store: name, currency, catalogue size, customers, orders, open orders, 30-day sales with previous-period comparison, pending AI actions and ready knowledge documents. Good first call for broad questions.';
    }

    public function category(): string { return self::READ; }

    public function progressLabel(): string { return 'Reviewing store performance'; }

    public function handle(ToolContext $ctx, array $args): ToolResult
    {
        $a = $this->analytics($ctx);
        $sid = $ctx->store->id;
        $period = $a->periodComparison(30);
        $inventory = $a->inventory()->where('active', true);

        return new ToolResult([
            'store' => ['name' => $ctx->store->name, 'currency' => $this->currency($ctx)],
            'catalogue' => [
                'products' => Product::where('store_id', $sid)->count(),
                'active_products' => $inventory->count(),
                'out_of_stock' => $inventory->where('state', 'out_of_stock')->count(),
                'low_stock' => $inventory->where('state', 'low_stock')->count(),
                'low_stock_threshold' => $a->lowStockThreshold(),
            ],
            'customers' => Customer::where('store_id', $sid)->count(),
            'orders_all_time' => Order::where('store_id', $sid)->count(),
            'open_orders' => Order::where('store_id', $sid)->whereIn('status', ['pending', 'processing'])->count(),
            'last_30_days' => $period,
            'pending_ai_actions' => AgentAction::forStore($sid)->where('status', AgentAction::PENDING)->count(),
            'knowledge_documents_ready' => KnowledgeDocument::forStore($sid)->where('status', KnowledgeDocument::READY)->count(),
        ], 'Store snapshot', [Sources::dataset('Store snapshot · last 30 days', route('dashboard'))]);
    }
}
