<?php

namespace App\Ai\Actions;

use App\Models\Store;
use App\Models\User;

/**
 * A kind of change the AI may propose. Proposals are validated and previewed
 * here; execution happens only after a merchant approves the exact payload.
 */
abstract class ActionType
{
    abstract public function type(): string;

    /** Permission the approving merchant must hold at approval time. */
    abstract public function permission(): string;

    public function risk(array $payload): string
    {
        return 'low';
    }

    /** Validate and normalise; throw ActionValidationException on problems. */
    abstract public function validate(Store $store, array $payload): array;

    /** Resource label + type/id for the affected record. */
    abstract public function resource(Store $store, array $payload): array;

    /**
     * Human-readable preview: {kind, title, fields:[{key,label,before,after,format,editable}]}.
     * `before` is read from the live record at call time.
     */
    abstract public function preview(Store $store, array $payload): array;

    /** Apply through domain models. Must re-verify store ownership. */
    abstract public function execute(Store $store, User $user, array $payload): array;

    /** Fields a merchant may edit before approving. */
    public function editableFields(): array
    {
        return [];
    }

    /** Fingerprint of the live state the proposal was based on (stale detection). */
    public function stateFingerprint(Store $store, array $payload): ?string
    {
        $fields = collect($this->preview($store, $payload)['fields'] ?? [])->pluck('before')->all();

        return $fields ? hash('sha256', json_encode($fields)) : null;
    }
}
