<?php

namespace App\Ai\Providers;

/** Normalised model response (provider independent). */
final class LlmResponse
{
    /**
     * @param array<int, array{id:string,name:string,arguments:array}> $toolCalls
     */
    public function __construct(
        public readonly ?string $text,
        public readonly array $toolCalls,
        public readonly int $inputTokens,
        public readonly int $outputTokens,
        public readonly string $model,
        public readonly string $finishReason = 'stop',
        public readonly int $latencyMs = 0,
    ) {}

    public function wantsTools(): bool
    {
        return $this->toolCalls !== [];
    }
}
