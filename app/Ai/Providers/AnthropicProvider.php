<?php

namespace App\Ai\Providers;

use Illuminate\Support\Facades\Http;

class AnthropicProvider implements LlmProvider
{
    public function __construct(
        private readonly string $apiKey,
        private readonly string $model,
        private readonly string $baseUrl = 'https://api.anthropic.com',
        private readonly int $timeout = 60,
    ) {}

    public function name(): string
    {
        return 'anthropic';
    }

    public function model(): string
    {
        return $this->model;
    }

    public function chat(array $messages, array $tools = [], array $options = []): LlmResponse
    {
        $system = collect($messages)->where('role', 'system')->pluck('content')->implode("\n\n");
        $payload = [
            'model' => $this->model,
            'max_tokens' => $options['max_tokens'] ?? 1800,
            'temperature' => $options['temperature'] ?? 0.2,
            'system' => $system,
            'messages' => $this->mapMessages(array_values(array_filter($messages, fn ($m) => $m['role'] !== 'system'))),
        ];
        if ($tools !== []) {
            $payload['tools'] = array_map(fn ($t) => [
                'name' => $t['name'],
                'description' => $t['description'],
                'input_schema' => $t['parameters'],
            ], $tools);
        }

        $started = microtime(true);
        try {
            $res = Http::withHeaders([
                'x-api-key' => $this->apiKey,
                'anthropic-version' => '2023-06-01',
            ])->timeout($options['timeout'] ?? $this->timeout)->acceptJson()->post(rtrim($this->baseUrl, '/') . '/v1/messages', $payload);
        } catch (\Throwable $e) {
            throw AiProviderException::fromThrowable($e);
        }
        if ($res->failed()) {
            throw AiProviderException::fromThrowable(new \RuntimeException('HTTP ' . $res->status() . ' ' . $res->body()));
        }

        $json = $res->json();
        $text = [];
        $calls = [];
        foreach ($json['content'] ?? [] as $block) {
            if (($block['type'] ?? '') === 'text') {
                $text[] = $block['text'];
            } elseif (($block['type'] ?? '') === 'tool_use') {
                $calls[] = ['id' => $block['id'], 'name' => $block['name'], 'arguments' => (array) ($block['input'] ?? [])];
            }
        }

        return new LlmResponse(
            text: $text ? implode("\n", $text) : null,
            toolCalls: $calls,
            inputTokens: (int) ($json['usage']['input_tokens'] ?? 0),
            outputTokens: (int) ($json['usage']['output_tokens'] ?? 0),
            model: (string) ($json['model'] ?? $this->model),
            finishReason: (string) ($json['stop_reason'] ?? 'end_turn'),
            latencyMs: (int) ((microtime(true) - $started) * 1000),
        );
    }

    /** Anthropic wants tool results as user-role tool_result blocks, merged per turn. */
    private function mapMessages(array $messages): array
    {
        $out = [];
        foreach ($messages as $m) {
            if ($m['role'] === 'tool') {
                $block = ['type' => 'tool_result', 'tool_use_id' => $m['tool_call_id'], 'content' => (string) $m['content']];
                $last = array_key_last($out);
                if ($last !== null && $out[$last]['role'] === 'user' && is_array($out[$last]['content']) && ($out[$last]['content'][0]['type'] ?? '') === 'tool_result') {
                    $out[$last]['content'][] = $block;
                } else {
                    $out[] = ['role' => 'user', 'content' => [$block]];
                }
                continue;
            }
            if ($m['role'] === 'assistant') {
                $content = [];
                if (! empty($m['content'])) {
                    $content[] = ['type' => 'text', 'text' => (string) $m['content']];
                }
                foreach ($m['tool_calls'] ?? [] as $c) {
                    $content[] = ['type' => 'tool_use', 'id' => $c['id'], 'name' => $c['name'], 'input' => (object) $c['arguments']];
                }
                $out[] = ['role' => 'assistant', 'content' => $content ?: [['type' => 'text', 'text' => '…']]];
                continue;
            }
            $out[] = ['role' => 'user', 'content' => (string) ($m['content'] ?? '')];
        }

        return $out;
    }
}
