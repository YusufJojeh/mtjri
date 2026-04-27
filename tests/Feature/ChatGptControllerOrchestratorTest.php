<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\AIOrchestratorService;
use Mockery;
use Tests\TestCase;

class ChatGptControllerOrchestratorTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware();
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_chat_route_remains_backward_compatible(): void
    {
        $user = new User();
        $user->id = 1;
        $mock = Mockery::mock(AIOrchestratorService::class);
        $mock->shouldReceive('generateChatResponse')->once()->andReturn([
            'success' => true,
            'provider' => 'openai',
            'choices' => ['Hello world'],
            'content' => 'Hello world',
            'steps' => [],
        ]);
        $this->app->instance(AIOrchestratorService::class, $mock);

        $response = $this->actingAs($user)->postJson(route('chatgpt.generate'), [
            'prompt' => 'hi',
            'language' => 'en',
            'creativity' => 'medium',
            'num_results' => 1,
            'max_length' => 120,
        ]);

        $response->assertOk()->assertJson([
            'success' => true,
            'content' => 'Hello world',
            'provider' => 'openai',
        ]);
    }

    public function test_chat_route_returns_standardized_error_for_provider_failure(): void
    {
        $user = new User();
        $user->id = 1;
        $mock = Mockery::mock(AIOrchestratorService::class);
        $mock->shouldReceive('generateChatResponse')->once()->andReturn([
            'success' => false,
            'error_code' => 'provider_unavailable',
            'error_message' => 'Ollama is unreachable',
        ]);
        $this->app->instance(AIOrchestratorService::class, $mock);

        $response = $this->actingAs($user)->postJson(route('chatgpt.generate'), [
            'prompt' => 'hi',
            'provider' => 'ollama',
            'agentic' => true,
        ]);

        $response->assertStatus(422)->assertJson([
            'success' => false,
            'error_code' => 'provider_unavailable',
        ]);
    }
}
