<?php

namespace App\Ai\Tools\Commerce;

use App\Ai\Tools\ToolContext;
use App\Ai\Tools\ToolResult;

class GetContentStatus extends CommerceTool
{
    public function name(): string { return 'get_content_status'; }

    public function description(): string
    {
        return 'Catalogue content gaps: active products with missing or thin descriptions (under 80 characters), examples, and products missing a cover image.';
    }

    public function category(): string { return self::RESEARCH; }

    public function progressLabel(): string { return 'Checking product content'; }

    public function handle(ToolContext $ctx, array $args): ToolResult
    {
        $data = $this->analytics($ctx)->contentStatus();

        return new ToolResult($data, 'Content gaps', collect($data['examples_needing_copy'])->take(4)->map(fn ($p) => Sources::product($p['product_id'], $p['name']))->all());
    }
}
