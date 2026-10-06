<?php

namespace Tests\Performance;

use App\Models\Store;
use App\Models\User;
use App\Models\Setting;
use App\Services\StoreContentGenerationService;
use App\Contracts\OpenAIContentGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Mockery;

class ContentGenerationPerformanceTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_content_generation_completes_within_time_limit(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create(['user_id' => $user->id]);

        Setting::setGlobal('chatgptKey', 'test-key');
        Setting::setGlobal('chatgptModel', 'gpt-4');

        $mockOpenAI = Mockery::mock(OpenAIContentGenerator::class);
        $mockOpenAI->shouldReceive('generateText')
            ->andReturn(['title' => 'Test']);

        $this->app->instance(OpenAIContentGenerator::class, $mockOpenAI);

        $startTime = microtime(true);

        $service = app(StoreContentGenerationService::class);
        $content = $service->generateContent($store, 'default');

        $endTime = microtime(true);
        $executionTime = $endTime - $startTime;

        // Should complete within 5 seconds (with mocks)
        $this->assertLessThan(5, $executionTime);
        $this->assertIsArray($content);
    }

    public function test_content_generation_handles_large_stores(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'description' => str_repeat('Long description. ', 100), // Large description
        ]);

        Setting::setGlobal('chatgptKey', 'test-key');
        Setting::setGlobal('chatgptModel', 'gpt-4');

        $mockOpenAI = Mockery::mock(OpenAIContentGenerator::class);
        $mockOpenAI->shouldReceive('generateText')
            ->andReturn(['title' => 'Test']);

        $this->app->instance(OpenAIContentGenerator::class, $mockOpenAI);

        $service = app(StoreContentGenerationService::class);
        $content = $service->generateContent($store, 'default');

        // Should handle large descriptions without issues
        $this->assertIsArray($content);
    }
}

