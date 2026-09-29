<?php

namespace App\Ai\Tools\Proposals;

use App\Ai\Tools\AgentProfiles;

class ProposeBlogSeo extends ProposalTool
{
    public function name(): string { return 'propose_blog_seo'; }

    public function description(): string
    {
        return 'Propose SEO metadata (meta_title ≤ 60 chars, meta_description ≤ 155 chars) for a blog post. Pending until the merchant approves.';
    }

    public function parameters(): array
    {
        return ['type' => 'object', 'properties' => [
            'blog_id' => ['type' => 'integer'],
            'meta_title' => ['type' => 'string', 'maxLength' => 70],
            'meta_description' => ['type' => 'string', 'maxLength' => 170],
        ] + $this->common(), 'required' => ['blog_id', 'goal'], 'additionalProperties' => false];
    }

    public function profiles(): array { return [AgentProfiles::COMMERCE, AgentProfiles::CONTENT]; }

    protected function actionType(): string { return 'blog_seo'; }

    protected function payload(array $args): array
    {
        return array_intersect_key($args, array_flip(['blog_id', 'meta_title', 'meta_description']));
    }
}
