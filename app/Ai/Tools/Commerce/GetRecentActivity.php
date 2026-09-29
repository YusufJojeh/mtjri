<?php

namespace App\Ai\Tools\Commerce;

use App\Ai\Tools\ToolContext;
use App\Ai\Tools\ToolResult;
use App\Models\Ai\AgentAction;
use App\Models\Ai\KnowledgeDocument;
use App\Models\Order;
use App\Models\Product;

class GetRecentActivity extends CommerceTool
{
    public function name(): string { return 'get_recent_activity'; }

    public function description(): string
    {
        return 'What changed recently: latest orders, recently updated products, AI changes applied or rejected, and knowledge documents added.';
    }

    public function category(): string { return self::READ; }

    public function progressLabel(): string { return 'Reviewing recent activity'; }

    public function handle(ToolContext $ctx, array $args): ToolResult
    {
        $sid = $ctx->store->id;

        return new ToolResult([
            'orders' => Order::where('store_id', $sid)->latest()->limit(5)->get(['id', 'order_number', 'total_amount', 'status', 'created_at'])
                ->map(fn ($o) => ['order_id' => $o->id, 'number' => $o->order_number, 'total' => (float) $o->total_amount, 'status' => $o->status, 'at' => $o->created_at->toIso8601String()]),
            'product_updates' => Product::where('store_id', $sid)->latest('updated_at')->limit(5)->get(['id', 'name', 'updated_at'])
                ->map(fn ($p) => ['product_id' => $p->id, 'name' => $p->name, 'at' => $p->updated_at->toIso8601String()]),
            'ai_actions' => AgentAction::forStore($sid)->whereIn('status', ['executed', 'rejected', 'failed'])->latest('updated_at')->limit(5)->get(['type', 'resource_label', 'status', 'updated_at'])
                ->map(fn ($a) => ['type' => $a->type, 'resource' => $a->resource_label, 'status' => $a->status, 'at' => $a->updated_at->toIso8601String()]),
            'knowledge' => KnowledgeDocument::forStore($sid)->latest()->limit(5)->get(['title', 'status', 'created_at'])
                ->map(fn ($d) => ['title' => $d->title, 'status' => $d->status, 'at' => $d->created_at->toIso8601String()]),
        ], 'Recent activity', [Sources::dataset('Recent store activity')]);
    }
}
