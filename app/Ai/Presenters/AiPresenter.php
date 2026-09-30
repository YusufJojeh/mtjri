<?php

namespace App\Ai\Presenters;

use App\Ai\Actions\ActionService;
use App\Models\Ai\AgentAction;
use App\Models\Ai\AgentRun;
use App\Models\Ai\KnowledgeDocument;
use App\Models\User;

/**
 * Merchant-safe views of AI records. Never includes prompts, raw tool names,
 * tool arguments or model reasoning — only what a merchant should see.
 */
class AiPresenter
{
    public static function runSummary(AgentRun $run): array
    {
        return [
            'id' => $run->uuid,
            'title' => $run->title,
            'profile' => $run->profile,
            'status' => $run->status,
            'updated_at' => $run->updated_at?->toIso8601String(),
        ];
    }

    public static function run(AgentRun $run, User $viewer): array
    {
        $messages = $run->messages()->orderBy('position')->get()
            ->filter(fn ($m) => in_array($m->role, ['user', 'assistant', 'system_note'], true))
            ->filter(fn ($m) => $m->role !== 'assistant' || $m->answer)
            ->map(fn ($m) => [
                'id' => $m->id,
                'role' => $m->role === 'system_note' ? 'platform' : $m->role,
                'content' => $m->role === 'user' ? $m->content : null,
                'answer' => $m->answer,
                'note' => $m->role === 'system_note' ? self::noteKind($m->content) : null,
                'created_at' => $m->created_at?->toIso8601String(),
            ])->values();

        return self::runSummary($run) + [
            'error_code' => $run->error_code,
            'last_event_seq' => $run->last_event_seq,
            'messages' => $messages,
            'actions' => $run->actions()->orderBy('id')->get()->map(fn ($a) => self::action($a, $viewer))->values(),
            'usage' => ['input_tokens' => $run->input_tokens, 'output_tokens' => $run->output_tokens, 'steps' => $run->step_count, 'tool_calls' => $run->tool_call_count],
        ];
    }

    private static function noteKind(?string $content): string
    {
        return match (true) {
            str_contains((string) $content, 'APPROVED') => 'approved',
            str_contains((string) $content, 'REJECTED') => 'rejected',
            str_contains((string) $content, 'FAILED') => 'failed',
            default => 'update',
        };
    }

    public static function action(AgentAction $a, ?User $viewer = null): array
    {
        $service = app(ActionService::class);
        $type = $service->type($a->type);
        $expired = $a->status === AgentAction::PENDING && $a->isExpired();

        return [
            'id' => $a->uuid,
            'type' => $a->type,
            'source' => $a->source,
            'status' => $expired ? AgentAction::EXPIRED : $a->status,
            'risk' => $a->risk,
            'resource' => ['type' => $a->resource_type, 'id' => $a->resource_id, 'label' => $a->resource_label, 'url' => self::resourceUrl($a)],
            'goal' => $a->goal,
            'rationale' => $a->rationale,
            'preview' => $a->preview,
            'editable_fields' => $type->editableFields(),
            'knowledge_used' => $a->knowledge_used ?? [],
            'payload_hash' => $a->payload_hash,
            'edited' => (bool) $a->edited,
            'run' => $a->run ? ['id' => $a->run->uuid, 'title' => $a->run->title] : null,
            'created_by' => $a->creator?->name,
            'decided_by' => $a->decider?->name,
            'decided_at' => $a->decided_at?->toIso8601String(),
            'decision_note' => $a->decision_note,
            'expires_at' => $a->expires_at?->toIso8601String(),
            'executed_at' => $a->executed_at?->toIso8601String(),
            'failure_reason' => $a->failure_reason,
            'created_at' => $a->created_at?->toIso8601String(),
            'can_decide' => $viewer ? ($viewer->can('approve-ai-actions') && $viewer->can($type->permission())) : false,
        ];
    }

    private static function resourceUrl(AgentAction $a): ?string
    {
        if (! $a->resource_id) {
            return null;
        }
        $name = match ($a->resource_type) {
            'product' => 'products.edit',
            'discount' => 'coupon-system.show',
            'blog' => 'blog.edit',
            'page' => 'custom-pages.edit',
            default => null,
        };

        return $name && \Illuminate\Support\Facades\Route::has($name) ? route($name, $a->resource_id, false) : null;
    }

    public static function document(KnowledgeDocument $d): array
    {
        return [
            'id' => $d->uuid,
            'title' => $d->title,
            'type' => $d->doc_type,
            'visibility' => $d->visibility,
            'status' => $d->status,
            'filename' => $d->source_filename,
            'size_bytes' => (int) $d->size_bytes,
            'version' => (int) $d->current_version,
            'chunks' => (int) $d->chunk_count,
            'error' => $d->error,
            'usage_count' => (int) $d->usage_count,
            'last_used_at' => $d->last_used_at?->toIso8601String(),
            'updated_at' => $d->updated_at?->toIso8601String(),
            'created_at' => $d->created_at?->toIso8601String(),
        ];
    }
}
