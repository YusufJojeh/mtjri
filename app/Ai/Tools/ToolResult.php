<?php

namespace App\Ai\Tools;

use App\Models\Ai\AgentAction;

/**
 * Structured tool output.
 * - data:    JSON the model sees (bounded by Tool::resultLimit()).
 * - sources: citations shown to the merchant, each {kind: store_data|knowledge,
 *            label, resource_type?, resource_id?, url?, document?, version?, excerpt?}.
 */
final class ToolResult
{
    public function __construct(
        public readonly array $data,
        public readonly string $summary = '',
        public readonly array $sources = [],
        public readonly ?AgentAction $proposal = null,
        public readonly int $knowledgeSearches = 0,
    ) {}

    public static function error(string $code, string $message): self
    {
        return new self(['error' => $code, 'message' => $message], $message);
    }

    public function isError(): bool
    {
        return isset($this->data['error']);
    }
}
