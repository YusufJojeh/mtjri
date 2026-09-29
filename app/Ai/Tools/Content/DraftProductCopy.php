<?php

namespace App\Ai\Tools\Content;

use App\Ai\Content\ContentDraftService;
use App\Ai\Providers\AiProviderException;
use App\Ai\Tools\AgentProfiles;
use App\Ai\Tools\Tool;
use App\Ai\Tools\ToolContext;
use App\Ai\Tools\ToolResult;

class DraftProductCopy extends Tool
{
    public function name(): string { return 'draft_product_copy'; }

    public function description(): string
    {
        return 'Draft product copy for one product using its real facts and relevant Tijraa Knowledge (brand guide/voice). Returns the draft text and which knowledge documents were used. It does NOT save anything — to change the product, pass the draft to propose_product_copy.';
    }

    public function parameters(): array
    {
        return ['type' => 'object', 'properties' => [
            'product_id' => ['type' => 'integer'],
            'field' => ['type' => 'string', 'enum' => ['description', 'details'], 'default' => 'description'],
            'instructions' => ['type' => 'string', 'maxLength' => 400, 'default' => ''],
        ], 'required' => ['product_id'], 'additionalProperties' => false];
    }

    public function category(): string { return self::GENERATIVE; }

    public function profiles(): array { return [AgentProfiles::COMMERCE, AgentProfiles::CONTENT, AgentProfiles::GROWTH]; }

    public function permission(): ?string { return 'view-products'; }

    public function progressLabel(): string { return 'Drafting product copy'; }

    public function handle(ToolContext $ctx, array $args): ToolResult
    {
        try {
            $d = app(ContentDraftService::class)->draft($ctx->store, $ctx->user, 'product', $args['product_id'], $args['field'], $args['instructions'], 'copilot', $ctx->run?->trace_id);
        } catch (AiProviderException $e) {
            return ToolResult::error($e->errorCode, 'Drafting failed.');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return ToolResult::error('not_found', 'No such product in this store.');
        }

        return new ToolResult([
            'product_id' => $args['product_id'],
            'field' => $args['field'],
            'draft' => $d['fields']['text'] ?? $d['draft'],
            'current' => mb_substr($d['current'], 0, 800),
            'knowledge_used' => array_map(fn ($k) => "{$k['document']} v{$k['version']}" . ($k['heading'] ? " — {$k['heading']}" : ''), $d['knowledge_used']),
        ], 'Draft ready', collect($d['knowledge_used'])->map(fn ($k) => [
            'kind' => 'knowledge', 'label' => "{$k['document']} v{$k['version']}", 'document' => $k['document'], 'document_uuid' => $k['document_uuid'],
            'version' => $k['version'], 'section' => $k['heading'], 'excerpt' => $k['excerpt'], 'url' => route('knowledge.show', $k['document_uuid']),
        ])->unique('label')->values()->all(), count($d['knowledge_used']) ? 1 : 0);
    }
}
