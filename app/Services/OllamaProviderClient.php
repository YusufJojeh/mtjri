<?php

namespace App\Services;

use App\Contracts\AIProviderClient;
use App\Models\Setting;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Throwable;

class OllamaProviderClient implements AIProviderClient
{
    public function providerName(): string
    {
        return 'ollama';
    }

    public function generateText(string $prompt, array $options = []): array
    {
        $baseUrl = rtrim((string) ($options['base_url'] ?? $this->safeSetting('ollamaBaseUrl') ?? config('ai.ollama.base_url', 'http://127.0.0.1:11434')), '/');
        $model = (string) ($options['model'] ?? $this->safeSetting('ollamaModel') ?? config('ai.ollama.model', ''));
        $temperature = (float) ($options['temperature'] ?? 0.7);
        $maxTokens = (int) ($options['max_tokens'] ?? 150);
        $numResults = max(1, (int) ($options['n'] ?? 1));
        $timeoutMs = max(1000, (int) ($options['timeout_ms'] ?? $this->safeSetting('ollamaTimeoutMs') ?? config('ai.ollama.timeout_ms', 60000)));
        $timeoutSeconds = $timeoutMs / 1000;

        if ($model === '') {
            return $this->error('model_not_found', 'Ollama model is not configured.');
        }

        try {
            $choices = [];

            for ($i = 0; $i < $numResults; $i++) {
                $response = Http::timeout($timeoutSeconds)->acceptJson()->post($baseUrl . '/api/generate', [
                    'model' => $model,
                    'prompt' => $prompt,
                    'stream' => false,
                    'options' => [
                        'temperature' => $temperature,
                        'num_predict' => $maxTokens,
                    ],
                ]);

                if (!$response->successful()) {
                    $errorText = (string) ($response->json('error') ?? $response->body());

                    if ($response->status() === 404 || str_contains(strtolower($errorText), 'model') && str_contains(strtolower($errorText), 'not found')) {
                        return $this->error('model_not_found', $errorText !== '' ? $errorText : 'Ollama model not found.');
                    }

                    return $this->error('provider_unavailable', $errorText !== '' ? $errorText : 'Ollama request failed.');
                }

                $content = trim((string) $response->json('response', ''));
                if ($content === '') {
                    return $this->error('invalid_output', 'Ollama returned empty content.');
                }

                $choices[] = $content;
            }

            return [
                'success' => true,
                'provider' => $this->providerName(),
                'content' => $choices[0],
                'choices' => $choices,
                'error_code' => null,
                'error_message' => null,
            ];
        } catch (ConnectionException $e) {
            return $this->error('provider_unavailable', $e->getMessage());
        } catch (Throwable $e) {
            $errorCode = str_contains(strtolower($e->getMessage()), 'timeout') ? 'timeout' : 'provider_unavailable';
            return $this->error($errorCode, $e->getMessage());
        }
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
