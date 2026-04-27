<?php

namespace App\Services;

use App\Contracts\AIProviderClient;
use App\Models\Setting;
use Throwable;

class AIProviderManager
{
    public function __construct(
        private readonly OpenAIProviderClient $openAIProviderClient,
        private readonly OllamaProviderClient $ollamaProviderClient
    ) {
    }

    public function defaultProvider(): string
    {
        $provider = strtolower((string) ($this->safeSetting('aiProviderDefault') ?? config('ai.default_provider', 'openai')));
        return $this->isSupportedProvider($provider) ? $provider : 'openai';
    }

    public function resolveProvider(?string $requestedProvider = null): string
    {
        if ($requestedProvider === null || $requestedProvider === '') {
            return $this->defaultProvider();
        }

        $normalized = strtolower($requestedProvider);
        if ($this->isSupportedProvider($normalized)) {
            return $normalized;
        }

        return $this->defaultProvider();
    }

    public function getClient(?string $requestedProvider = null): AIProviderClient
    {
        $provider = $this->resolveProvider($requestedProvider);

        return $provider === 'ollama'
            ? $this->ollamaProviderClient
            : $this->openAIProviderClient;
    }

    public function isFallbackToOpenAIEnabled(): bool
    {
        $storedValue = $this->safeSetting('aiFallbackToOpenai');
        if ($storedValue === null) {
            return (bool) config('ai.fallback_to_openai', false);
        }

        return in_array(strtolower($storedValue), ['1', 'true', 'on', 'yes'], true);
    }

    public function isAgenticEnabled(?bool $requestValue = null): bool
    {
        if ($requestValue !== null) {
            return $requestValue;
        }

        $storedValue = $this->safeSetting('aiAgenticEnabled');
        if ($storedValue === null) {
            return (bool) config('ai.agentic_enabled', false);
        }

        return in_array(strtolower($storedValue), ['1', 'true', 'on', 'yes'], true);
    }

    public function checkProviderConfiguration(?string $requestedProvider = null): array
    {
        $provider = $this->resolveProvider($requestedProvider);

        if ($provider === 'ollama') {
            $model = (string) ($this->safeSetting('ollamaModel') ?? config('ai.ollama.model', ''));
            if ($model === '') {
                return [
                    'success' => false,
                    'provider' => 'ollama',
                    'message' => 'Ollama model is not configured.',
                ];
            }

            return [
                'success' => true,
                'provider' => 'ollama',
                'message' => 'Ollama is configured correctly.',
            ];
        }

        $chatgptKey = (string) ($this->safeSetting('chatgptKey') ?? '');
        $chatgptModel = (string) ($this->safeSetting('chatgptModel') ?? '');
        if ($chatgptKey === '') {
            return [
                'success' => false,
                'provider' => 'openai',
                'message' => 'OpenAI API key is not configured.',
            ];
        }

        if ($chatgptModel === '') {
            return [
                'success' => false,
                'provider' => 'openai',
                'message' => 'OpenAI model is not configured.',
            ];
        }

        return [
            'success' => true,
            'provider' => 'openai',
            'message' => 'OpenAI is configured correctly.',
        ];
    }

    private function isSupportedProvider(string $provider): bool
    {
        return in_array($provider, ['openai', 'ollama'], true);
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
