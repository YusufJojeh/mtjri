<?php

namespace App\Ai\Tools\Proposals;

use App\Ai\Tools\AgentProfiles;

class ProposeProductCopy extends ProposalTool
{
    public function name(): string { return 'propose_product_copy'; }

    public function description(): string
    {
        return 'Propose new copy for a product field (description or additional details). Creates a pending change the merchant reviews side by side; nothing is saved until they approve. Use plain text paragraphs.';
    }

    public function parameters(): array
    {
        return ['type' => 'object', 'properties' => [
            'product_id' => ['type' => 'integer'],
            'field' => ['type' => 'string', 'enum' => ['description', 'details'], 'default' => 'description'],
            'text' => ['type' => 'string', 'minLength' => 20, 'maxLength' => 5000],
        ] + $this->common(), 'required' => ['product_id', 'text', 'goal'], 'additionalProperties' => false];
    }

    public function profiles(): array { return [AgentProfiles::COMMERCE, AgentProfiles::CONTENT]; }

    public function permission(): ?string { return 'view-products'; }

    protected function actionType(): string { return 'product_copy'; }

    protected function payload(array $args): array
    {
        return ['product_id' => $args['product_id'], 'field' => $args['field'], 'text' => $args['text']];
    }
}
