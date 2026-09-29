<?php

namespace App\Ai\Tools\Commerce;

use App\Ai\Tools\ToolContext;
use App\Ai\Tools\ToolResult;
use App\Services\Commerce\StoreOnboarding;

class GetStoreSetupStatus extends CommerceTool
{
    public function name(): string { return 'get_store_setup_status'; }

    public function description(): string
    {
        return 'Store setup checklist derived from real data: identity, brand, products, payments, shipping, policies, domain, knowledge, AI preferences and go-live, with which steps are required and still open.';
    }

    public function category(): string { return self::READ; }

    public function progressLabel(): string { return 'Checking store setup'; }

    public function handle(ToolContext $ctx, array $args): ToolResult
    {
        $o = StoreOnboarding::for($ctx->store);

        return new ToolResult([
            'progress' => $o->progress(),
            'steps' => collect($o->steps())->map(fn ($s) => collect($s)->only(['id', 'status', 'required'])->all()),
        ], 'Store setup', [Sources::dataset('Store setup checklist', route('onboarding.index'))]);
    }
}
