<?php

namespace App\Ai\Providers;

use GuzzleHttp\Client as Guzzle;
use OpenAI;

class OpenAiProvider implements LlmProvider
{
    public function __construct(
        private readonly string $apiKey,
        private readonly string $model,
        private readonly int $timeout = 60,
    ) {}

    public function name(): string
    {
        return 'openai';
    }

    public function model(): string
    {
        return $this->model;
    }

    public function chat(array $messages, array $tools = [], array $options = []): LlmResponse
    {
        $client = OpenAI::factory()
            ->withApiKey($this->apiKey)
            ->withHttpClient(new Guzzle(['timeout' => $options['timeout'] ?? $this->timeout]))
            ->make();

        $payload = [
            'model' => $this->model,
            'messages' => array_map([$this, 'mapMessage'], $messages),
            'max_tokens' => $options['max_tokens'] ?? 1800,
            'temperature' => $options['temperature'] ?? 0.2,
        ];
        if ($tools !== []) {
            $payload['tools'] = array_map(fn ($t) => [
                'type' => 'function',
                'function' => ['name' => $t['name'], 'description' => $t['description'], 'parameters' => $t['parameters']],
            ], $tools);
            $payload['tool_choice'] = 'auto';
        }

        $started = microtime(true);
        try {
            $res = $client->chat()->create($payload);
        } catch (\Throwable $e) {
            throw AiProviderException::fromThrowable($e);
        }

        $choice = $res->choices[0] ?? null;
        $calls = [];
        foreach ($choice?->message->toolCalls ?? [] as $tc) {
            $args = json_decode($tc->function->arguments ?: '{}', true);
            $calls[] = ['id' => $tc->id, 'name' => $tc->function->name, 'arguments' => is_array($args) ? $args : []];
        }

        return new LlmResponse(
            text: $choice?->message->content,
            toolCalls: $calls,
            inputTokens: (int) ($res->usage?->promptTokens ?? 0),
            outputTokens: (int) ($res->usage?->completionTokens ?? 0),
            model: $res->model ?? $this->model,
            finishReason: (string) ($choice?->finishReason ?? 'stop'),
            latencyMs: (int) ((microtime(true) - $started) * 1000),
        );
    }

    private function mapMessage(array $m): array
    {
        return match ($m['role']) {
            'assistant' => array_filter([
                'role' => 'assistant',
                'content' => $m['content'] ?? null,
                'tool_calls' => ! empty($m['tool_calls']) ? array_map(fn ($c) => [
                    'id' => $c['id'],
                    'type' => 'function',
                    'function' => ['name' => $c['name'], 'arguments' => json_encode((object) $c['arguments'])],
                ], $m['tool_calls']) : null,
            ], fn ($v) => $v !== null),
            'tool' => ['role' => 'tool', 'tool_call_id' => $m['tool_call_id'], 'content' => (string) $m['content']],
            default => ['role' => $m['role'], 'content' => (string) ($m['content'] ?? '')],
        };
    }
}
