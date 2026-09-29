<?php

namespace App\Ai\Tools\Commerce;

use App\Ai\Tools\ToolContext;
use App\Ai\Tools\ToolResult;

class GetSeoStatus extends CommerceTool
{
    public function name(): string { return 'get_seo_status'; }

    public function description(): string
    {
        return 'SEO metadata gaps for blog posts and store pages (missing meta title or description), with example ids.';
    }

    public function category(): string { return self::RESEARCH; }

    public function progressLabel(): string { return 'Checking search metadata'; }

    public function handle(ToolContext $ctx, array $args): ToolResult
    {
        return new ToolResult($this->analytics($ctx)->seoStatus(), 'SEO gaps', [Sources::dataset('Blog & page SEO metadata', route('blog.index'))]);
    }
}
