<?php

namespace App\Ai\Providers;

use Throwable;

/**
 * Test double: returns queued responses in order. Each entry may be an
 * LlmResponse, a Throwable (thrown), or a callable(messages, tools) that
 * returns an LlmResponse — letting evals branch on what the runtime sent.
 */
class QueuedProvider implements LlmProvider
{
    /** @var array<int, array{messages:array,tools:array}> */
    public array $requests = [];

    public function __construct(private array $queue = []) {}

    public function push(LlmResponse|Throwable|callable $entry): self
    {
        $this->queue[] = $entry;

        return $this;
    }

    public static function tool(string $name, array $args = [], ?string $id = null): LlmResponse
    {
        return new LlmResponse(null, [['id' => $id ?? 'call_' . bin2hex(random_bytes(4)), 'name' => $name, 'arguments' => $args]], 100, 20, 'queued', 'tool_calls');
    }

    public static function final(string $answer, array $extra = []): LlmResponse
    {
        return self::tool('respond_to_merchant', ['executive_answer' => $answer] + $extra);
    }

    public function name(): string
    {
        return 'queued';
    }

    public function model(): string
    {
        return 'queued';
    }

    public function chat(array $messages, array $tools = [], array $options = []): LlmResponse
    {
        $this->requests[] = ['messages' => $messages, 'tools' => $tools];
        if (! $this->queue) {
            throw new AiProviderException('empty_response', 'Queued provider exhausted.');
        }
        $next = array_shift($this->queue);
        if ($next instanceof Throwable) {
            throw $next;
        }

        return is_callable($next) ? $next($messages, $tools) : $next;
    }
}
