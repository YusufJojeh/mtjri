<?php

namespace Tests\Unit\Services;

use App\Services\AIProviderManager;
use Tests\TestCase;

class AIProviderManagerTest extends TestCase
{
    public function test_it_defaults_to_openai_when_no_setting_exists(): void
    {
        config(['ai.default_provider' => 'openai']);
        $manager = $this->app->make(AIProviderManager::class);

        $this->assertSame('openai', $manager->defaultProvider());
        $this->assertSame('openai', $manager->resolveProvider(null));
    }

    public function test_it_resolves_ollama_when_requested(): void
    {
        $manager = $this->app->make(AIProviderManager::class);

        $this->assertSame('ollama', $manager->resolveProvider('ollama'));
    }

    public function test_it_reports_missing_ollama_model_configuration(): void
    {
        config(['ai.ollama.model' => '']);

        $manager = $this->app->make(AIProviderManager::class);
        $status = $manager->checkProviderConfiguration('ollama');

        $this->assertFalse($status['success']);
        $this->assertSame('ollama', $status['provider']);
    }
}
