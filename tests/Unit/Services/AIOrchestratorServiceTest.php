<?php

namespace Tests\Unit\Services;

use App\Contracts\AIProviderClient;
use App\Services\AIOrchestratorService;
use App\Services\AIProviderManager;
use Mockery;
use Tests\TestCase;

class AIOrchestratorServiceTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_it_stops_after_max_steps_with_invalid_output(): void
    {
        config(['ai.max_steps' => 2]);

        $failingClient = new class implements AIProviderClient {
            public function providerName(): string
            {
                return 'openai';
            }

            public function generateText(string $prompt, array $options = []): array
            {
                return [
                    'success' => true,
                    'provider' => 'openai',
                    'content' => '',
                    'choices' => [''],
                    'error_code' => null,
                    'error_message' => null,
                ];
            }
        };

        $manager = Mockery::mock(AIProviderManager::class);
        $manager->shouldReceive('resolveProvider')->andReturn('openai');
        $manager->shouldReceive('isAgenticEnabled')->andReturn(true);
        $manager->shouldReceive('getClient')->andReturn($failingClient);
        $manager->shouldReceive('isFallbackToOpenAIEnabled')->andReturn(false);

        $service = new AIOrchestratorService($manager);
        $result = $service->generateChatResponse('test prompt');

        $this->assertFalse($result['success']);
        $this->assertSame('invalid_output', $result['error_code']);
    }

    public function test_it_falls_back_to_openai_when_ollama_fails_and_fallback_enabled(): void
    {
        $ollamaClient = new class implements AIProviderClient {
            public function providerName(): string
            {
                return 'ollama';
            }

            public function generateText(string $prompt, array $options = []): array
            {
                return [
                    'success' => false,
                    'provider' => 'ollama',
                    'content' => '',
                    'choices' => [],
                    'error_code' => 'provider_unavailable',
                    'error_message' => 'offline',
                ];
            }
        };

        $openAIClient = new class implements AIProviderClient {
            public function providerName(): string
            {
                return 'openai';
            }

            public function generateText(string $prompt, array $options = []): array
            {
                return [
                    'success' => true,
                    'provider' => 'openai',
                    'content' => 'fallback response',
                    'choices' => ['fallback response'],
                    'error_code' => null,
                    'error_message' => null,
                ];
            }
        };

        $manager = Mockery::mock(AIProviderManager::class);
        $manager->shouldReceive('resolveProvider')->andReturn('ollama');
        $manager->shouldReceive('isAgenticEnabled')->andReturn(false);
        $manager->shouldReceive('isFallbackToOpenAIEnabled')->andReturn(true);
        $manager->shouldReceive('getClient')->with('ollama')->andReturn($ollamaClient);
        $manager->shouldReceive('getClient')->with('openai')->andReturn($openAIClient);

        $service = new AIOrchestratorService($manager);
        $result = $service->generateChatResponse('test prompt');

        $this->assertTrue($result['success']);
        $this->assertSame('fallback response', $result['content']);
    }
}

