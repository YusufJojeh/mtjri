<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Store;
use App\Models\StoreSetting;
use App\Models\Setting;
use App\Services\StoreContentGenerationService;
use App\Contracts\OpenAIContentGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use PHPUnit\Framework\Attributes\Test;
use Illuminate\Support\Facades\Http;

class StoreContentManagementTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $store;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a plan and assign to user
        $plan = \App\Models\Plan::create([
            'name' => 'Standard',
            'price' => 10,
            'duration' => 'Month',
            'max_stores' => 5,
            'max_users' => 10,
            'max_products' => 100,
            'enable_custdomain' => 'on',
            'enable_custsubdomain' => 'on',
            'is_default' => 1
        ]);

        $this->user = User::factory()->create([
            'type' => 'company',
            'lang' => 'en',
            'plan_id' => $plan->id,
            'plan_is_active' => 1,
            'plan_expire_date' => now()->addYear(),
        ]);
        $this->store = Store::factory()->create([
            'user_id' => $this->user->id,
            'description' => 'A test e-commerce business',
            'theme' => 'default',
        ]);

        // Create default settings for the store
        StoreSetting::create([
            'store_id' => $this->store->id,
            'theme' => 'default',
            'content' => [],
        ]);

        // Set Unsplash image data
        Setting::setGlobal('unsplashAccessKey', 'mock-unsplash-key');

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

        // Mock OpenAI for isolation
        $this->mock(OpenAIContentGenerator::class, function ($mock) {
            $mock->shouldReceive('generateText')
                ->andReturnUsing(function ($prompt, $userLanguage = 'en') {
                    if (str_contains($prompt, 'hero')) {
                        return ['title' => 'Generated Hero Title', 'subtitle' => 'Generated Hero Subtitle', 'button_text' => 'Shop Now'];
                    }
                    if (str_contains($prompt, 'about')) {
                        return ['title' => 'Generated About Title', 'description' => 'Generated About Description'];
                    }
                    return [];
                });
        });

        // Bypass permissions for testing
        \Illuminate\Support\Facades\Gate::before(function ($user, $ability) {
            return true;
        });

        // Bypass registration check and set session for actingAs
        $this->withSession([
            'registration_step_1_complete' => true,
            'registration_step_2_complete' => true,
            'registration_step_3_complete' => true,
        ]);
    }

    #[Test]
    public function store_owner_can_regenerate_section_content()
    {
        \Illuminate\Support\Facades\Queue::fake();

        $this->actingAs($this->user);

        // Bypass registration check (session must be set after actingAs sometimes or using startSession)
        session([
            'registration_step_1_complete' => true,
            'registration_step_2_complete' => true,
            'registration_step_3_complete' => true,
        ]);

        // Set up OpenAI keys for the test
        Setting::setGlobal('chatgptKey', 'test-key');
        Setting::setGlobal('chatgptModel', 'gpt-3.5-turbo');

        $sectionName = 'hero';
        $response = $this->post(route('stores.content.regenerate-section', $this->store->id), [
            'section' => $sectionName,
            'theme' => 'default',
        ]);

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'job_id',
            'status',
            'message',
        ]);

        $responseData = $response->json();
        $this->assertTrue($responseData['success']);
        $this->assertEquals('pending', $responseData['status']);
        $this->assertNotEmpty($responseData['job_id']);

        // Assert job was dispatched
        \Illuminate\Support\Facades\Queue::assertPushed(\App\Jobs\RegenerateSectionJob::class, function ($job) use ($sectionName) {
            return $job->sectionName === $sectionName;
        });

        // Assert cache was set with initial progress
        $cacheKey = "content_regeneration:job:{$responseData['job_id']}";
        $progress = \Illuminate\Support\Facades\Cache::get($cacheKey);
        $this->assertNotNull($progress);
        $this->assertEquals('pending', $progress['status']);
        $this->assertEquals($sectionName, $progress['section']);
    }

    #[Test]
    public function guest_cannot_regenerate_section_content()
    {
        $sectionName = 'hero';
        $response = $this->post(route('stores.content.regenerate-section', $this->store->id), [
            'section' => $sectionName,
            'theme' => 'default',
        ]);
        $response->assertRedirect('/login');
    }

    #[Test]
    public function generate_specific_section_service_method()
    {
        // Set up OpenAI keys for the test
        Setting::setGlobal('chatgptKey', 'test-key');
        Setting::setGlobal('chatgptModel', 'gpt-3.5-turbo');

        $service = app(StoreContentGenerationService::class);

        $businessDescription = 'My awesome store';
        $businessType = 'general e-commerce store';
        $userLanguage = 'en';
        $theme = 'default';
        $sectionName = 'hero'; // Changed from 'about' to 'hero' as 'about' is not in default theme

        $generatedContent = $service->generateSpecificSection(
            $businessDescription,
            $businessType,
            $userLanguage,
            $theme,
            $sectionName
        );

        $this->assertNotNull($generatedContent);
        $this->assertArrayHasKey('title', $generatedContent);
        $this->assertEquals('Generated Hero Title', $generatedContent['title']);
        $this->assertArrayHasKey('image', $generatedContent);
        $this->assertArrayHasKey('url', $generatedContent['image']);
    }

    #[Test]
    public function regenerate_section_fails_without_openai_key()
    {
        $this->actingAs($this->user);

        // Bypass registration check
        session([
            'registration_step_1_complete' => true,
            'registration_step_2_complete' => true,
            'registration_step_3_complete' => true,
        ]);

        // Do not set OpenAI keys (they are shared, so we need to clear them if they were set by other tests, but RefreshDatabase handles this)

        $sectionName = 'hero';
        $response = $this->post(route('stores.content.regenerate-section', $this->store->id), [
            'section' => $sectionName,
            'theme' => 'default',
        ]);

        $response->assertStatus(500);
        $response->assertJsonFragment(['message' => 'An error occurred during content regeneration.']);
    }

    #[Test]
    public function check_openai_config_returns_true_when_keys_are_set()
    {
        Setting::setGlobal('chatgptKey', 'test-key');
        Setting::setGlobal('chatgptModel', 'gpt-3.5-turbo');

        $service = app(StoreContentGenerationService::class);
        $result = $service->checkOpenAIConfig();

        $this->assertTrue($result['success']);
        $this->assertEquals('OpenAI is configured correctly.', $result['message']);
    }

    #[Test]
    public function check_openai_config_returns_false_when_key_is_missing()
    {
        // Only set model, not key
        Setting::setGlobal('chatgptModel', 'gpt-3.5-turbo');

        $service = app(StoreContentGenerationService::class);
        $result = $service->checkOpenAIConfig();

        $this->assertFalse($result['success']);
        $this->assertEquals('OpenAI API key is not configured.', $result['message']);
    }

    #[Test]
    public function check_openai_config_returns_false_when_model_is_missing()
    {
        // Only set key, not model
        Setting::setGlobal('chatgptKey', 'test-key');

        $service = app(StoreContentGenerationService::class);
        $result = $service->checkOpenAIConfig();

        $this->assertFalse($result['success']);
        $this->assertEquals('OpenAI model is not configured.', $result['message']);
    }

    #[Test]
    public function user_can_get_regeneration_status()
    {
        $this->actingAs($this->user);

        session([
            'registration_step_1_complete' => true,
            'registration_step_2_complete' => true,
            'registration_step_3_complete' => true,
        ]);

        // Create a job ID and cache entry
        $jobId = 'test_job_' . uniqid();
        $cacheKey = "content_regeneration:job:{$jobId}";
        
        \Illuminate\Support\Facades\Cache::put($cacheKey, [
            'status' => 'processing',
            'progress' => 50,
            'current_step' => 'Generating content...',
            'section' => 'hero',
            'error_code' => null,
            'error_message' => null,
            'created_at' => now()->toIso8601String(),
            'completed_at' => null,
        ], 1800);

        $response = $this->get(route('stores.content.regeneration-status', [
            'storeId' => $this->store->id,
            'jobId' => $jobId
        ]));

        $response->assertOk();
        $response->assertJsonStructure([
            'status',
            'progress',
            'current_step',
            'section',
            'error_code',
            'error_message',
        ]);

        $responseData = $response->json();
        $this->assertEquals('processing', $responseData['status']);
        $this->assertEquals(50, $responseData['progress']);
        $this->assertEquals('Generating content...', $responseData['current_step']);
        $this->assertEquals('hero', $responseData['section']);
    }

    #[Test]
    public function regeneration_status_returns_404_for_missing_job()
    {
        $this->actingAs($this->user);

        session([
            'registration_step_1_complete' => true,
            'registration_step_2_complete' => true,
            'registration_step_3_complete' => true,
        ]);

        $response = $this->get(route('stores.content.regeneration-status', [
            'storeId' => $this->store->id,
            'jobId' => 'non_existent_job_id'
        ]));

        $response->assertStatus(404);
        $response->assertJson(['status' => 'not_found']);
    }

    #[Test]
    public function regeneration_status_returns_completed_status_with_content()
    {
        $this->actingAs($this->user);

        session([
            'registration_step_1_complete' => true,
            'registration_step_2_complete' => true,
            'registration_step_3_complete' => true,
        ]);

        $jobId = 'test_job_' . uniqid();
        $cacheKey = "content_regeneration:job:{$jobId}";
        $generatedContent = ['title' => 'Generated Title', 'subtitle' => 'Generated Subtitle'];
        
        \Illuminate\Support\Facades\Cache::put($cacheKey, [
            'status' => 'completed',
            'progress' => 100,
            'current_step' => 'Complete',
            'section' => 'hero',
            'error_code' => null,
            'error_message' => null,
            'content' => $generatedContent,
            'quality_metrics' => ['score' => 95],
            'created_at' => now()->toIso8601String(),
            'completed_at' => now()->toIso8601String(),
        ], 1800);

        $response = $this->get(route('stores.content.regeneration-status', [
            'storeId' => $this->store->id,
            'jobId' => $jobId
        ]));

        $response->assertOk();
        $responseData = $response->json();
        $this->assertEquals('completed', $responseData['status']);
        $this->assertEquals(100, $responseData['progress']);
        $this->assertEquals($generatedContent, $responseData['content']);
        $this->assertNotNull($responseData['quality_metrics']);
    }

    #[Test]
    public function regeneration_status_returns_failed_status_with_error()
    {
        $this->actingAs($this->user);

        session([
            'registration_step_1_complete' => true,
            'registration_step_2_complete' => true,
            'registration_step_3_complete' => true,
        ]);

        $jobId = 'test_job_' . uniqid();
        $cacheKey = "content_regeneration:job:{$jobId}";
        
        \Illuminate\Support\Facades\Cache::put($cacheKey, [
            'status' => 'failed',
            'progress' => 0,
            'current_step' => 'Generation failed',
            'section' => 'hero',
            'error_code' => 'OPENAI_KEY_MISSING',
            'error_message' => 'OpenAI API key is not configured.',
            'created_at' => now()->toIso8601String(),
            'completed_at' => now()->toIso8601String(),
        ], 1800);

        $response = $this->get(route('stores.content.regeneration-status', [
            'storeId' => $this->store->id,
            'jobId' => $jobId
        ]));

        $response->assertOk();
        $responseData = $response->json();
        $this->assertEquals('failed', $responseData['status']);
        $this->assertEquals('OPENAI_KEY_MISSING', $responseData['error_code']);
        $this->assertEquals('OpenAI API key is not configured.', $responseData['error_message']);
    }

    #[Test]
    public function guest_cannot_access_regeneration_status()
    {
        $jobId = 'test_job_' . uniqid();
        
        $response = $this->get(route('stores.content.regeneration-status', [
            'storeId' => $this->store->id,
            'jobId' => $jobId
        ]));

        $response->assertRedirect('/login');
    }

    #[Test]
    public function user_cannot_access_regeneration_status_for_other_users_store()
    {
        $otherUser = User::factory()->create(['type' => 'company']);
        $this->actingAs($otherUser);

        $jobId = 'test_job_' . uniqid();
        
        $response = $this->get(route('stores.content.regeneration-status', [
            'storeId' => $this->store->id,
            'jobId' => $jobId
        ]));

        $response->assertStatus(403);
    }

    #[Test]
    public function regenerate_section_validates_section_parameter()
    {
        $this->actingAs($this->user);

        session([
            'registration_step_1_complete' => true,
            'registration_step_2_complete' => true,
            'registration_step_3_complete' => true,
        ]);

        $response = $this->post(route('stores.content.regenerate-section', $this->store->id), [
            'theme' => 'default',
            // Missing 'section' parameter
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['section']);
    }

    #[Test]
    public function regenerate_section_creates_unique_job_ids()
    {
        \Illuminate\Support\Facades\Queue::fake();

        $this->actingAs($this->user);

        session([
            'registration_step_1_complete' => true,
            'registration_step_2_complete' => true,
            'registration_step_3_complete' => true,
        ]);

        // Request regeneration twice
        $response1 = $this->post(route('stores.content.regenerate-section', $this->store->id), [
            'section' => 'hero',
            'theme' => 'default',
        ]);

        usleep(100000); // Small delay to ensure different timestamp

        $response2 = $this->post(route('stores.content.regenerate-section', $this->store->id), [
            'section' => 'hero',
            'theme' => 'default',
        ]);

        $jobId1 = $response1->json()['job_id'];
        $jobId2 = $response2->json()['job_id'];

        $this->assertNotEquals($jobId1, $jobId2);
    }

    #[Test]
    public function regenerate_section_handles_theme_parameter()
    {
        \Illuminate\Support\Facades\Queue::fake();

        $this->actingAs($this->user);

        session([
            'registration_step_1_complete' => true,
            'registration_step_2_complete' => true,
            'registration_step_3_complete' => true,
        ]);

        $response = $this->post(route('stores.content.regenerate-section', $this->store->id), [
            'section' => 'hero',
            'theme' => 'custom_theme',
        ]);

        $response->assertOk();

        \Illuminate\Support\Facades\Queue::assertPushed(\App\Jobs\RegenerateSectionJob::class, function ($job) {
            return $job->theme === 'custom_theme';
        });
    }

    #[Test]
    public function regenerate_section_uses_store_default_theme_when_not_provided()
    {
        \Illuminate\Support\Facades\Queue::fake();

        $this->store->update(['theme' => 'fashion']);
        $this->actingAs($this->user);

        session([
            'registration_step_1_complete' => true,
            'registration_step_2_complete' => true,
            'registration_step_3_complete' => true,
        ]);

        $response = $this->post(route('stores.content.regenerate-section', $this->store->id), [
            'section' => 'hero',
            // No theme parameter
        ]);

        $response->assertOk();

        \Illuminate\Support\Facades\Queue::assertPushed(\App\Jobs\RegenerateSectionJob::class, function ($job) {
            return $job->theme === 'fashion';
        });
    }
}

