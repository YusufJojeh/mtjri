<?php

namespace App\Ai;

use App\Ai\Knowledge\Embedder;
use App\Ai\Knowledge\HashingEmbedder;
use App\Ai\Knowledge\OpenAiEmbedder;
use App\Ai\Providers\AiProviderException;
use App\Ai\Providers\AnthropicProvider;
use App\Ai\Providers\LlmProvider;
use App\Ai\Providers\OpenAiProvider;
use App\Ai\Providers\ScriptedProvider;
use App\Models\Setting;

/**
 * Resolves the configured model provider and embedder. There is exactly one
 * resolution path, so Copilot, Content Studio and Knowledge agree.
 */
class AiManager
{
    private ?LlmProvider $override = null;

    /** Test seam: force a provider (e.g. a queued fake) for this process. */
    public function fake(LlmProvider $provider): void
    {
        $this->override = $provider;
    }

    public function provider(): LlmProvider
    {
        if ($this->override) {
            return $this->override;
        }
        $choice = config('tijraa.ai.provider', 'auto');
        $timeout = (int) config('tijraa.ai.request_timeout', 60);

        if ($choice === 'scripted') {
            if (! $this->scriptedAllowed()) {
                throw new AiProviderException('not_configured', 'The scripted test model is disabled in this environment.');
            }

            return app(ScriptedProvider::class);
        }
        $anthropicKey = config('tijraa.ai.anthropic.api_key');
        if (($choice === 'anthropic' || $choice === 'auto') && $anthropicKey) {
            return new AnthropicProvider($anthropicKey, config('tijraa.ai.anthropic.model'), config('tijraa.ai.anthropic.base_url'), $timeout);
        }
        $openaiKey = $this->openAiKey();
        if (($choice === 'openai' || $choice === 'auto') && $openaiKey) {
            return new OpenAiProvider($openaiKey, $this->openAiModel(), $timeout);
        }

        throw new AiProviderException('not_configured', 'No AI provider is configured.');
    }

    public function configured(): bool
    {
        try {
            $this->provider();

            return true;
        } catch (AiProviderException) {
            return false;
        }
    }

    /** Human-facing description, e.g. for the Copilot header. */
    public function describe(): array
    {
        try {
            $p = $this->provider();

            return ['configured' => true, 'provider' => $p->name(), 'model' => $p->model(), 'is_test_model' => $p instanceof ScriptedProvider];
        } catch (AiProviderException) {
            return ['configured' => false, 'provider' => null, 'model' => null, 'is_test_model' => false];
        }
    }

    public function embedder(): Embedder
    {
        $key = $this->openAiKey();
        if ($key && config('tijraa.ai.provider') !== 'scripted' && ! $this->override) {
            return new OpenAiEmbedder($key, config('tijraa.ai.openai.embedding_model'));
        }

        return new HashingEmbedder((int) config('tijraa.knowledge.embedding_dims', 512));
    }

    public function scriptedAllowed(): bool
    {
        return ! app()->environment('production') && (app()->environment(['local', 'testing']) || config('tijraa.ai.allow_scripted'));
    }

    private function openAiKey(): ?string
    {
        return config('tijraa.ai.openai.api_key') ?: (Setting::where('key', 'chatgptKey')->value('value') ?: null);
    }

    private function openAiModel(): string
    {
        return config('tijraa.ai.openai.model') ?: (Setting::where('key', 'chatgptModel')->value('value') ?: 'gpt-4o-mini');
    }
}
