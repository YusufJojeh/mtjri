<?php

namespace App\Services;

use App\Contracts\AIProviderClient;
use App\Models\Setting;
use OpenAI;
use Throwable;

class OpenAIProviderClient implements AIProviderClient
{
    public function providerName(): string
    {
        return 'openai';
    }

    public function generateText(string $prompt, array $options = []): array
    {
        $apiKey = (string) ($options['api_key'] ?? $this->safeSetting('chatgptKey') ?? '');
        $model = (string) ($options['model'] ?? $this->safeSetting('chatgptModel') ?? config('openai.default_model', 'gpt-3.5-turbo'));
        $temperature = (float) ($options['temperature'] ?? 0.7);
        $maxTokens = (int) ($options['max_tokens'] ?? 150);
        $numResults = max(1, (int) ($options['n'] ?? 1));

        if ($apiKey === '') {
            return $this->error('provider_unavailable', 'OpenAI API key is not configured.');
        }

        try {
            $client = OpenAI::client($apiKey);
            $response = $client->chat()->create([
                'model' => $model,
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => $prompt,
                    ],
                ],
                'max_tokens' => $maxTokens,
                'temperature' => $temperature,
                'n' => $numResults,
            ]);

            if (!isset($response->choices) || count($response->choices) === 0) {
                return $this->error('tool_failed', 'OpenAI did not return any content.');
            }

            $choices = [];
            foreach ($response->choices as $choice) {
                $text = trim((string) ($choice->message->content ?? ''));
                if ($text !== '') {
                    $choices[] = $text;
                }
            }

            if (count($choices) === 0) {
                return $this->error('invalid_output', 'OpenAI returned empty content.');
            }

            return [
                'success' => true,
                'provider' => $this->providerName(),
                'content' => $choices[0],
                'choices' => $choices,
                'error_code' => null,
                'error_message' => null,
            ];
        } catch (Throwable $e) {
            $message = $e->getMessage();
            $errorCode = $this->mapErrorCode($message);

            return $this->error($errorCode, $message);
        }
    }

    private function mapErrorCode(string $message): string
    {
        $normalized = strtolower($message);

        if (str_contains($normalized, 'model') && (str_contains($normalized, 'not found') || str_contains($normalized, 'does not exist'))) {
            return 'model_not_found';
        }

        if (str_contains($normalized, 'timed out') || str_contains($normalized, 'timeout')) {
            return 'timeout';
        }

        if (str_contains($normalized, 'rate limit') || str_contains($normalized, '429')) {
            return 'provider_unavailable';
        }

        return 'provider_unavailable';
    }

    private function error(string $errorCode, string $errorMessage): array
    {
        return [
            'success' => false,
            'provider' => $this->providerName(),
            'content' => '',
            'choices' => [],
            'error_code' => $errorCode,
            'error_message' => $errorMessage,
        ];
    }

    private function safeSetting(string $key): ?string
    {
        try {
            return Setting::getGlobal($key);
        } catch (Throwable) {
            return null;
        }
    }
}
