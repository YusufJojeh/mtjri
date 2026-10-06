<?php

namespace Tests\Feature;

use App\Models\Store;
use App\Models\User;
use App\Models\Setting;
use App\Models\StoreSetting;
use App\Services\StoreContentGenerationService;
use App\Contracts\OpenAIContentGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Mockery;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\Test;

class StoreContentGenerationServiceTest extends TestCase
{
    use RefreshDatabase;

    protected StoreContentGenerationService $service;

    protected function setUp(): void
    {
        parent::setUp();

        // Prevent any HTTP requests that are not explicitly faked
        Http::preventStrayRequests();

        // Disable Unsplash retries and sleep for faster tests
        config([
            'services.unsplash.retries' => 0,
            'services.unsplash.retry_sleep_ms' => 0,
        ]);

        // Mock OpenAIContentGenerator interface and bind to container
        $mockOpenAIContentGenerator = Mockery::mock(OpenAIContentGenerator::class);
        $this->app->instance(OpenAIContentGenerator::class, $mockOpenAIContentGenerator);

        // Resolve the service from the container, which will inject our mock
        $this->service = $this->app->make(StoreContentGenerationService::class);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    #[Test]
    public function it_generates_content_and_images_for_a_store_theme()
    {
        // Arrange
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create(['user_id' => $user->id, 'description' => 'A test e-commerce store for vintage clothes']);

        Setting::setGlobal('chatgptKey', 'test-openai-key');
        Setting::setGlobal('chatgptModel', 'gpt-4');
        Setting::setGlobal('unsplashAccessKey', 'test-unsplash-key');

        // Configure mock for successful OpenAI response
        $mockOpenAIContentGenerator = $this->app->make(OpenAIContentGenerator::class);
        $mockOpenAIContentGenerator->shouldReceive('generateText')
            ->andReturnUsing(function ($prompt, $userLanguage) {
                if (str_contains($prompt, 'hero')) {
                    return ['title' => 'AI Hero Title', 'subtitle' => 'AI Hero Subtitle', 'description' => 'AI Hero Description', 'cta_text' => 'Shop Now'];
                } elseif (str_contains($prompt, 'features')) {
                    return ['title' => 'AI Features Title', 'items' => [['title' => 'Feature 1', 'description' => 'Desc 1']]];
                } elseif (str_contains($prompt, 'about')) {
                    return ['title' => 'AI About Title', 'content' => 'AI About Content'];
                } elseif (str_contains($prompt, 'cta_section')) {
                    return ['title' => 'AI CTA Title', 'description' => 'AI CTA Description', 'button_text' => 'Buy Now'];
                }
                return []; // Should not happen with specific prompts
            });

        // Mock Unsplash API call
        Http::fake([
            'api.unsplash.com/*' => Http::response([
                'results' => [
                    [
                        'id' => 'photo-1',
                        'urls' => ['regular' => 'https://images.unsplash.com/photo-1'],
                        'links' => [
                            'download_location' => 'https://api.unsplash.com/photos/photo-1/download',
                            'html' => 'https://unsplash.com/photos/photo-1'
                        ],
                        'user' => [
                            'name' => 'John Doe',
                            'username' => 'johndoe',
                            'links' => ['html' => 'https://unsplash.com/@johndoe']
                        ]
                    ]
                ]
            ], 200),
            'images.unsplash.com/*' => Http::response('mock-image-content', 200),
        ]);

        $theme = 'fashion';

        // Act
        $generatedContent = $this->service->generateContent($store, $theme);

        // Assert
        $this->assertIsArray($generatedContent);
        $this->assertArrayHasKey('hero', $generatedContent);
        $this->assertArrayHasKey('features', $generatedContent);
        $this->assertArrayHasKey('about', $generatedContent);
        $this->assertArrayHasKey('cta_section', $generatedContent);

        $this->assertEquals('AI Hero Title', $generatedContent['hero']['title']);
        $this->assertEquals('https://images.unsplash.com/photo-1', $generatedContent['hero']['image']['url']);
        $this->assertEquals('AI About Title', $generatedContent['about']['title']);
        $this->assertEquals('https://images.unsplash.com/photo-1', $generatedContent['about']['image']['url']);

        $defaultHero = StoreSetting::getThemeDefaults($theme)['hero'];
        $this->assertArrayHasKey('badge_text', $generatedContent['hero']);
        $this->assertEquals($defaultHero['badge_text'], $generatedContent['hero']['badge_text']);
    }

    #[Test]
    public function it_handles_openai_api_failure_gracefully()
    {
        // Arrange
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create(['user_id' => $user->id, 'description' => 'A test e-commerce store']);

        Setting::setGlobal('chatgptKey', 'test-openai-key');
        Setting::setGlobal('chatgptModel', 'gpt-4');
        Setting::setGlobal('unsplashAccessKey', 'test-unsplash-key');

        // Configure mock to throw an exception for OpenAI
        $mockOpenAIContentGenerator = $this->app->make(OpenAIContentGenerator::class);
        $mockOpenAIContentGenerator->shouldReceive('generateText')
                                 ->andReturn(['error' => 'OpenAI API is down']);

        // Mock Unsplash API call (should still work)
        Http::fake([
            'api.unsplash.com/*' => Http::response([
                'results' => [
                    [
                        'id' => 'photo-1',
                        'urls' => ['regular' => 'https://images.unsplash.com/photo-1'],
                        'links' => [
                            'download_location' => 'https://api.unsplash.com/photos/photo-1/download',
                            'html' => 'https://unsplash.com/photos/photo-1'
                        ],
                        'user' => [
                            'name' => 'John Doe',
                            'username' => 'johndoe',
                            'links' => ['html' => 'https://unsplash.com/@johndoe']
                        ]
                    ]
                ]
            ], 200),
            'images.unsplash.com/*' => Http::response('mock-image-content', 200),
        ]);

        $theme = 'fashion';

        // Act
        $generatedContent = $this->service->generateContent($store, $theme);

        // Assert
        $this->assertIsArray($generatedContent);
        $this->assertArrayHasKey('hero', $generatedContent);
        // Assert that content falls back to defaults for sections where OpenAI failed
        $defaultHero = StoreSetting::getThemeDefaults($theme)['hero'];
        $this->assertEquals($defaultHero['title'], $generatedContent['hero']['title']);
        $this->assertEquals($defaultHero['subtitle'], $generatedContent['hero']['subtitle']);
        $this->assertEquals($defaultHero['button_text'], $generatedContent['hero']['button_text']);
        $this->assertArrayHasKey('image', $generatedContent['hero']); // Unsplash should still work

        // No error key should be present in the final merged content
        $this->assertArrayNotHasKey('error', $generatedContent['hero']);
    }

    #[Test]
    public function it_handles_unsplash_api_failure_gracefully()
    {
        // Arrange
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create(['user_id' => $user->id, 'description' => 'A test e-commerce store']);

        Setting::setGlobal('chatgptKey', 'test-openai-key');
        Setting::setGlobal('chatgptModel', 'gpt-4');
        Setting::setGlobal('unsplashAccessKey', 'test-unsplash-key');

        // Configure mock for successful OpenAI response
        $mockOpenAIContentGenerator = $this->app->make(OpenAIContentGenerator::class);
        $mockOpenAIContentGenerator->shouldReceive('generateText')
            ->andReturnUsing(function ($prompt, $userLanguage) {
                if (str_contains($prompt, 'hero')) {
                    return ['title' => 'AI Hero Title', 'subtitle' => 'AI Hero Subtitle', 'description' => 'AI Hero Description', 'cta_text' => 'Shop Now'];
                } elseif (str_contains($prompt, 'about')) {
                    return ['title' => 'AI About Title', 'content' => 'AI About Content'];
                }
                return [];
            });

        // Mock Unsplash API to return a failure response
        Http::fake([
            'api.unsplash.com/*' => Http::response([], 500), // Simulate error
            'images.unsplash.com/*' => Http::response('mock-image-content', 200),
        ]);

        $theme = 'fashion';

        // Act
        $generatedContent = $this->service->generateContent($store, $theme);

        // Assert
        $this->assertIsArray($generatedContent);
        $this->assertArrayHasKey('hero', $generatedContent);
        
        $defaultHero = StoreSetting::getThemeDefaults($theme)['hero'];
        // Since Unsplash failed, 'image' should remain as the default theme image
        $this->assertEquals($defaultHero['image'], $generatedContent['hero']['image']);

        $this->assertEquals('AI Hero Title', $generatedContent['hero']['title']);
        $this->assertEquals('AI About Title', $generatedContent['about']['title']);

        $this->assertArrayHasKey('badge_text', $generatedContent['hero']);
        $this->assertEquals($defaultHero['badge_text'], $generatedContent['hero']['badge_text']);
    }

    #[Test]
    public function it_throws_when_no_ai_key_is_configured()
    {
        // Arrange
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create(['user_id' => $user->id, 'description' => 'A test e-commerce store']);

        // Do NOT set chatgptKey: generateContent() fails fast with a clear
        // configuration error rather than silently serving generic default
        // content mislabeled as AI-generated. Callers (the queued jobs) catch
        // this and record a 'failed' content_generation_status.
        Setting::setGlobal('unsplashAccessKey', 'test-unsplash-key');

        $theme = 'fashion';

        // Act & Assert
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('OpenAI API key is not configured.');

        $this->service->generateContent($store, $theme);
    }

    #[Test]
    public function it_uses_default_theme_content_if_no_unsplash_key_set()
    {
        // Arrange
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create(['user_id' => $user->id, 'description' => 'A test e-commerce store']);

        Setting::setGlobal('chatgptKey', 'test-openai-key');
        Setting::setGlobal('chatgptModel', 'gpt-4');
        // Do NOT set unsplashAccessKey

        // Configure mock for successful OpenAI response
        $mockOpenAIContentGenerator = $this->app->make(OpenAIContentGenerator::class);
        $mockOpenAIContentGenerator->shouldReceive('generateText')
            ->andReturnUsing(function ($prompt, $userLanguage) {
                if (str_contains($prompt, 'hero')) {
                    return ['title' => 'AI Hero Title', 'subtitle' => 'AI Hero Subtitle', 'description' => 'AI Hero Description', 'cta_text' => 'Shop Now'];
                }
                return [];
            });

        // Do NOT mock Http facade to simulate no Unsplash key being used

        $theme = 'fashion';

        // Act
        $generatedContent = $this->service->generateContent($store, $theme);

        // Assert
        $defaultContent = StoreSetting::getThemeDefaults($theme);

        $this->assertIsArray($generatedContent);
        $this->assertEquals('AI Hero Title', $generatedContent['hero']['title']);
        
        // When Unsplash fails or key is missing, 'image' should remain as whatever default was in themeDefaults
        $this->assertEquals($defaultContent['hero']['image'], $generatedContent['hero']['image']); 
    }

    #[Test]
    public function test_generate_content_uses_new_prompt_service(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'description' => 'A fashion store',
            'industry' => 'fashion',
        ]);

        Setting::setGlobal('chatgptKey', 'test-key');
        Setting::setGlobal('chatgptModel', 'gpt-4');

        $mockOpenAI = $this->app->make(OpenAIContentGenerator::class);
        $mockOpenAI->shouldReceive('generateText')
            ->andReturnUsing(function ($prompt) {
                // Check that prompt includes context from new service
                $this->assertStringContainsString('fashion', $prompt);
                return ['title' => 'Test'];
            });

        Http::fake(['api.unsplash.com/*' => Http::response(['results' => []], 200)]);

        $content = $this->service->generateContent($store, 'default');

        $this->assertIsArray($content);
    }

    #[Test]
    public function test_generate_content_uses_context_builder(): void
    {
        $user = User::factory()->create(['lang' => 'ar']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'industry' => 'electronics',
            'color' => '#3b82f6',
        ]);

        Setting::setGlobal('chatgptKey', 'test-key');
        Setting::setGlobal('chatgptModel', 'gpt-4');

        $mockOpenAI = $this->app->make(OpenAIContentGenerator::class);
        $mockOpenAI->shouldReceive('generateText')
            ->andReturnUsing(function ($prompt) {
                // Check that prompt includes language context
                $this->assertStringContainsString('Arabic', $prompt);
                return ['title' => 'Test'];
            });

        Http::fake(['api.unsplash.com/*' => Http::response(['results' => []], 200)]);

        $content = $this->service->generateContent($store, 'default');

        $this->assertIsArray($content);
    }

    #[Test]
    public function test_generate_content_validates_before_saving(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create(['user_id' => $user->id]);

        Setting::setGlobal('chatgptKey', 'test-key');
        Setting::setGlobal('chatgptModel', 'gpt-4');

        $mockOpenAI = $this->app->make(OpenAIContentGenerator::class);
        $mockOpenAI->shouldReceive('generateText')
            ->andReturn(['title' => 'Valid Title', 'subtitle' => 'Valid.', 'button_text' => 'Click']);

        Http::fake(['api.unsplash.com/*' => Http::response(['results' => []], 200)]);

        $content = $this->service->generateContent($store, 'default');

        // Content should be validated (no placeholder text, proper structure)
        $this->assertIsArray($content);
        $this->assertArrayHasKey('hero', $content);
    }

    #[Test]
    public function test_generate_content_handles_partial_failures(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create(['user_id' => $user->id]);

        Setting::setGlobal('chatgptKey', 'test-key');
        Setting::setGlobal('chatgptModel', 'gpt-4');

        $mockOpenAI = $this->app->make(OpenAIContentGenerator::class);
        $mockOpenAI->shouldReceive('generateText')
            ->andReturnUsing(function ($prompt) {
                if (str_contains($prompt, 'hero')) {
                    return ['title' => 'Hero Title'];
                }
                return ['error' => 'Failed'];
            });

        Http::fake(['api.unsplash.com/*' => Http::response(['results' => []], 200)]);

        $content = $this->service->generateContent($store, 'default');

        // Should have hero section even if others failed
        $this->assertArrayHasKey('hero', $content);
    }

    #[Test]
    public function test_generate_specific_section_uses_enhanced_prompts(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'industry' => 'fashion',
        ]);

        Setting::setGlobal('chatgptKey', 'test-key');
        Setting::setGlobal('chatgptModel', 'gpt-4');

        $mockOpenAI = $this->app->make(OpenAIContentGenerator::class);
        $mockOpenAI->shouldReceive('generateText')
            ->andReturnUsing(function ($prompt) {
                $this->assertStringContainsString('fashion', $prompt);
                return ['title' => 'Section Title'];
            });

        Http::fake(['api.unsplash.com/*' => Http::response(['results' => []], 200)]);

        $sectionContent = $this->service->generateSpecificSection($store, 'hero');

        $this->assertIsArray($sectionContent);
    }

    #[Test]
    public function test_generate_content_handles_multiple_languages(): void
    {
        $languages = ['en', 'ar', 'fr', 'es'];

        foreach ($languages as $lang) {
            $user = User::factory()->create(['lang' => $lang]);
            $store = Store::factory()->create(['user_id' => $user->id]);

            Setting::setGlobal('chatgptKey', 'test-key');
            Setting::setGlobal('chatgptModel', 'gpt-4');

            $mockOpenAI = $this->app->make(OpenAIContentGenerator::class);
            $mockOpenAI->shouldReceive('generateText')
                ->andReturn(['title' => 'Test']);

            Http::fake(['api.unsplash.com/*' => Http::response(['results' => []], 200)]);

            $content = $this->service->generateContent($store, 'default');

            $this->assertIsArray($content);
        }
    }
}
