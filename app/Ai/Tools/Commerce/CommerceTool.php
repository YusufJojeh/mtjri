<?php

namespace App\Ai\Tools\Commerce;

use App\Ai\Tools\Tool;
use App\Ai\Tools\ToolContext;
use App\Services\Commerce\StoreAnalytics;

abstract class CommerceTool extends Tool
{
    protected function analytics(ToolContext $ctx): StoreAnalytics
    {
        return new StoreAnalytics($ctx->store);
    }

    protected function currency(ToolContext $ctx): string
    {
        $s = getSetting('defaultCurrency', 'USD', $ctx->store->user_id, $ctx->store->id);

        return is_string($s) && $s !== '' ? $s : 'USD';
    }

    protected static function days(): array
    {
        return ['type' => 'integer', 'enum' => [7, 30, 90], 'default' => 30, 'description' => 'Look-back window in days'];
    }
}
