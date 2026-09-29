<?php

namespace App\Ai\Tools\Proposals;

use App\Ai\Tools\AgentProfiles;

class ProposePageSeo extends ProposalTool
{
    public function name(): string { return 'propose_page_seo'; }

    public function description(): string
    {
        return 'Propose SEO metadata (meta_title ≤ 60, meta_description ≤ 155, optional meta_keywords) for a store page. Pending until the merchant approves.';
    }

    public function parameters(): array
    {
        return ['type' => 'object', 'properties' => [
            'page_id' => ['type' => 'integer'],
            'meta_title' => ['type' => 'string', 'maxLength' => 70],
            'meta_description' => ['type' => 'string', 'maxLength' => 170],
            'meta_keywords' => ['type' => 'string', 'maxLength' => 255],
        ] + $this->common(), 'required' => ['page_id', 'goal'], 'additionalProperties' => false];
    }

    public function profiles(): array { return [AgentProfiles::COMMERCE, AgentProfiles::CONTENT]; }

    protected function actionType(): string { return 'page_seo'; }

    protected function payload(array $args): array
    {
        return array_intersect_key($args, array_flip(['page_id', 'meta_title', 'meta_description', 'meta_keywords']));
    }
}
