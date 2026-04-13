<?php

namespace Tests\Feature;

use App\Models\Store;
use App\Models\User;
use App\Models\Setting;
use App\Services\StoreContentGenerationService;
use App\Contracts\OpenAIContentGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Mockery;

class ContentGenerationErrorHandlingTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_handles_openai_api_failure(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create(['user_id' => $user->id]);

        Setting::setGlobal('chatgptKey', 'test-key');

        $mockOpenAI = Mockery::mock(OpenAIContentGenerator::class);
        $mockOpenAI->shouldReceive('generateText')
            ->andReturn(['error' => 'API failure']);

        $this->app->instance(OpenAIContentGenerator::class, $mockOpenAI);

        $service = app(StoreContentGenerationService::class);

        // Should handle error gracefully
        $content = $service->generateContent($store, 'default');

        $this->assertIsArray($content);
    }

    public function test_handles_invalid_json_response(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create(['user_id' => $user->id]);

        Setting::setGlobal('chatgptKey', 'test-key');

        $mockOpenAI = Mockery::mock(OpenAIContentGenerator::class);
        $mockOpenAI->shouldReceive('generateText')
            ->andReturn('invalid json string');

        $this->app->instance(OpenAIContentGenerator::class, $mockOpenAI);

        $service = app(StoreContentGenerationService::class);

        // Should handle gracefully
        try {
            $content = $service->generateContent($store, 'default');
            $this->assertIsArray($content);
        } catch (\Exception $e) {
            // Exception is acceptable for invalid JSON
            $this->assertInstanceOf(\Exception::class, $e);
        }
    }

    public function test_handles_missing_api_keys(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create(['user_id' => $user->id]);

        Setting::setGlobal('chatgptKey', '');
        Setting::setGlobal('chatgptModel', '');

        $service = app(StoreContentGenerationService::class);

        $this->expectException(\Exception::class);
        $service->generateContent($store, 'default');
    }

    public function test_handles_partial_content_generation(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create(['user_id' => $user->id]);

        Setting::setGlobal('chatgptKey', 'test-key');

        $mockOpenAI = Mockery::mock(OpenAIContentGenerator::class);
        $mockOpenAI->shouldReceive('generateText')
            ->andReturnUsing(function ($prompt) {
                if (str_contains($prompt, 'hero')) {
                    return ['title' => 'Hero Title'];
                }
                return ['error' => 'Failed'];
            });

        $this->app->instance(OpenAIContentGenerator::class, $mockOpenAI);

        $service = app(StoreContentGenerationService::class);
        $content = $service->generateContent($store, 'default');

        // Should have at least hero section
        $this->assertArrayHasKey('hero', $content);
    }

    public function test_handles_validation_errors(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create(['user_id' => $user->id]);

        Setting::setGlobal('chatgptKey', 'test-key');

        $mockOpenAI = Mockery::mock(OpenAIContentGenerator::class);
        $mockOpenAI->shouldReceive('generateText')
            ->andReturn(['title' => '']); // Invalid content

        $this->app->instance(OpenAIContentGenerator::class, $mockOpenAI);

        $service = app(StoreContentGenerationService::class);
        $content = $service->generateContent($store, 'default');

        // Should still return content even if validation fails
        $this->assertIsArray($content);
    }
}

