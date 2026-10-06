<?php

namespace Tests\Feature;

use App\Models\Store;
use App\Models\StoreSetting;
use App\Models\User;
use App\Models\Setting;
use App\Services\StoreContentGenerationService;
use App\Contracts\OpenAIContentGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;
use Mockery;

class StoreContentGenerationIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_full_content_generation_flow(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'description' => 'A fashion store',
            'industry' => 'fashion',
        ]);

        Setting::setGlobal('chatgptKey', 'test-key');
        Setting::setGlobal('chatgptModel', 'gpt-4');
        Setting::setGlobal('chatgptModel', 'gpt-4');

        $mockOpenAI = Mockery::mock(OpenAIContentGenerator::class);
        $mockOpenAI->shouldReceive('generateText')
            ->andReturnUsing(function ($prompt) {
                if (str_contains($prompt, 'hero')) {
                    return ['title' => 'Fashion Hero', 'subtitle' => 'Style', 'button_text' => 'Shop'];
                }
                return [];
            });

        $this->app->instance(OpenAIContentGenerator::class, $mockOpenAI);

        Http::fake([
            'api.unsplash.com/*' => Http::response([
                'results' => [[
                    'id' => 'photo-1',
                    'urls' => ['regular' => 'https://images.unsplash.com/photo-1'],
                    'links' => ['download_location' => 'url', 'html' => 'url'],
                    'user' => ['name' => 'John', 'username' => 'john', 'links' => ['html' => 'url']],
                ]],
            ], 200),
        ]);

        $service = app(StoreContentGenerationService::class);
        $content = $service->generateContent($store, 'default');

        $this->assertIsArray($content);
        $this->assertArrayHasKey('hero', $content);
    }

    public function test_content_generation_during_registration(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create(['user_id' => $user->id]);

        Setting::setGlobal('chatgptKey', 'test-key');
        Setting::setGlobal('chatgptModel', 'gpt-4');

        $mockOpenAI = Mockery::mock(OpenAIContentGenerator::class);
        $mockOpenAI->shouldReceive('generateText')->andReturn(['title' => 'Test']);

        $this->app->instance(OpenAIContentGenerator::class, $mockOpenAI);

        $service = app(StoreContentGenerationService::class);
        $content = $service->generateContent($store, 'default');

        $storeSetting = StoreSetting::where('store_id', $store->id)
            ->where('theme', 'default')
            ->first();

        $this->assertNotNull($content);
    }

    public function test_content_generation_saves_to_database(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create(['user_id' => $user->id]);

        Setting::setGlobal('chatgptKey', 'test-key');
        Setting::setGlobal('chatgptModel', 'gpt-4');

        $mockOpenAI = Mockery::mock(OpenAIContentGenerator::class);
        $mockOpenAI->shouldReceive('generateText')->andReturn(['title' => 'Test']);

        $this->app->instance(OpenAIContentGenerator::class, $mockOpenAI);

        $service = app(StoreContentGenerationService::class);
        $content = $service->generateContent($store, 'default');

        StoreSetting::updateOrCreate(
            ['store_id' => $store->id, 'theme' => 'default'],
            ['content' => $content, 'content_generation_status' => 'completed']
        );

        $storeSetting = StoreSetting::where('store_id', $store->id)
            ->where('theme', 'default')
            ->first();

        $this->assertNotNull($storeSetting);
        $this->assertEquals('completed', $storeSetting->content_generation_status);
    }

    public function test_content_generation_works_with_all_themes(): void
    {
        $themes = ['default', 'fashion', 'electronics', 'beauty-cosmetics'];

        foreach ($themes as $theme) {
            $user = User::factory()->create(['lang' => 'en']);
            $store = Store::factory()->create(['user_id' => $user->id]);

            Setting::setGlobal('chatgptKey', 'test-key');
            Setting::setGlobal('chatgptModel', 'gpt-4');

            $mockOpenAI = Mockery::mock(OpenAIContentGenerator::class);
            $mockOpenAI->shouldReceive('generateText')->andReturn(['title' => 'Test']);

            $this->app->instance(OpenAIContentGenerator::class, $mockOpenAI);

            $service = app(StoreContentGenerationService::class);
            $content = $service->generateContent($store, $theme);

            $this->assertIsArray($content);
        }
    }
}

