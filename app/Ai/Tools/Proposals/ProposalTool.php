<?php

namespace App\Ai\Tools\Proposals;

use App\Ai\Actions\ActionService;
use App\Ai\Actions\ActionValidationException;
use App\Ai\Tools\AgentProfiles;
use App\Ai\Tools\Tool;
use App\Ai\Tools\ToolContext;
use App\Ai\Tools\ToolResult;
use App\Models\Ai\AgentToolCall;

/**
 * WRITE_PROPOSAL: validates and records a pending AgentAction. Nothing in
 * the store changes. The run pauses until the merchant decides.
 */
abstract class ProposalTool extends Tool
{
    abstract protected function actionType(): string;

    abstract protected function payload(array $args): array;

    public function category(): string { return self::WRITE_PROPOSAL; }

    public function progressLabel(): string { return 'Preparing a change for your approval'; }

    protected function common(): array
    {
        return [
            'goal' => ['type' => 'string', 'maxLength' => 200, 'description' => 'One sentence: what this change achieves for the merchant'],
            'rationale' => ['type' => 'string', 'maxLength' => 800, 'description' => 'Evidence-based reason citing the store data or knowledge you used'],
        ];
    }

    public function handle(ToolContext $ctx, array $args): ToolResult
    {
        $knowledge = [];
        if ($ctx->run) {
            // Knowledge actually retrieved earlier in this run (never invented).
            $knowledge = AgentToolCall::where('agent_run_id', $ctx->run->id)->whereIn('tool', ['search_knowledge', 'draft_product_copy'])->where('status', 'completed')
                ->get()->flatMap(fn ($c) => collect($c->result['sources'] ?? [])->where('kind', 'knowledge'))->unique('label')->values()->all();
        }
        try {
            $action = app(ActionService::class)->propose($ctx->store, $ctx->user, $this->actionType(), $this->payload($args), [
                'run_id' => $ctx->run?->id,
                'tool_call_id' => $ctx->toolCallId,
                'tool' => $this->name(),
                'goal' => $args['goal'] ?? null,
                'rationale' => $args['rationale'] ?? null,
                'knowledge_used' => $knowledge ?: null,
                'trace_id' => $ctx->run?->trace_id,
                'source' => 'copilot',
            ]);
        } catch (ActionValidationException $e) {
            return ToolResult::error('invalid_proposal', 'The proposal was rejected by validation: ' . implode('; ', $e->errors) . '. Fix the values and try again.');
        }

        if ($ctx->run && $action->agent_run_id !== $ctx->run->id) {
            // Identical change already awaiting review from another conversation:
            // point to it instead of pausing this run on someone else's action.
            return new ToolResult([
                'status' => 'already_pending',
                'action_id' => $action->uuid,
                'message' => 'An identical change is already waiting for the merchant in the AI Action Center. Do not propose it again; tell the merchant it is waiting for their review.',
            ], 'Identical change already awaiting review', [['kind' => 'store_data', 'label' => 'AI Action awaiting review', 'url' => route('ai-actions.index', ['action' => $action->uuid], false)]]);
        }

        return new ToolResult([
            'status' => 'pending_approval',
            'action_id' => $action->uuid,
            'message' => 'Proposal recorded. Nothing has changed yet; the merchant must approve it in the AI Action Center.',
        ], 'Change prepared for approval', [], $action);
    }
}
