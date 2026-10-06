<?php

namespace Tests\Unit\Services;

use App\Services\AIOrchestratorService;
use App\Services\OpenAIContentGeneratorService;
use Mockery;
use Tests\TestCase;

class OpenAIContentGeneratorServiceTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_it_uses_structured_orchestrator_generation(): void
    {
        $orchestrator = Mockery::mock(AIOrchestratorService::class);
        $orchestrator->shouldReceive('generateStructuredContent')
            ->once()
            ->withArgs(function (string $prompt, array $defaults, array $options) {
                $this->assertSame('prompt', $prompt);
                $this->assertSame(['title' => 'Default'], $defaults);
                $this->assertSame('ollama', $options['provider']);
                return true;
            })
            ->andReturn([
                'success' => true,
                'provider' => 'ollama',
                'content' => ['title' => 'Generated'],
            ]);

        $service = new OpenAIContentGeneratorService($orchestrator);
        $result = $service->generateText('prompt', 'en', [
            'provider' => 'ollama',
            'defaults' => ['title' => 'Default'],
        ]);

        $this->assertSame(['title' => 'Generated'], $result);
    }
}

