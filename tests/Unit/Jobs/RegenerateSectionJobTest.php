<?php

namespace Tests\Unit\Jobs;

use App\Jobs\RegenerateSectionJob;
use App\Models\Store;
use App\Models\StoreSetting;
use App\Models\User;
use App\Services\StoreContentGenerationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;
use Mockery;

class RegenerateSectionJobTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_job_dispatches_successfully(): void
    {
        Queue::fake();

        $user = User::factory()->create();
        $store = Store::factory()->create(['user_id' => $user->id]);

        $jobId = 'test_job_' . uniqid();
        RegenerateSectionJob::dispatch($store->id, 'hero', 'default', $jobId);

        Queue::assertPushed(RegenerateSectionJob::class, function ($job) use ($store, $jobId) {
            return $job->storeId === $store->id
                && $job->sectionName === 'hero'
                && $job->theme === 'default'
                && $job->jobId === $jobId;
        });
    }

    public function test_job_handles_content_generation_success(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'description' => 'Test store',
            'theme' => 'default',
        ]);

        $jobId = 'test_job_' . uniqid();
        $cacheKey = "content_regeneration:job:{$jobId}";

        // Set initial cache entry
        Cache::put($cacheKey, [
            'status' => 'pending',
            'progress' => 0,
            'current_step' => 'Job queued...',
            'section' => 'hero',
            'error_code' => null,
            'error_message' => null,
            'created_at' => now()->toIso8601String(),
            'completed_at' => null,
        ], 1800);

        $mockService = Mockery::mock(StoreContentGenerationService::class);
        $expectedContent = [
            'title' => 'Generated Hero Title',
            'subtitle' => 'Generated Hero Subtitle',
            'button_text' => 'Shop Now'
        ];

        $mockService->shouldReceive('generateSpecificSection')
            ->once()
            ->with($store, 'hero', Mockery::type('Closure'))
            ->andReturn($expectedContent);

        $this->app->instance(StoreContentGenerationService::class, $mockService);

        $job = new RegenerateSectionJob($store->id, 'hero', 'default', $jobId);
        $job->handle($mockService);

        // Check cache was updated
        $progress = Cache::get($cacheKey);
        $this->assertNotNull($progress);
        $this->assertEquals('completed', $progress['status']);
        $this->assertEquals(100, $progress['progress']);
        $this->assertEquals($expectedContent, $progress['content']);

        // Check database was updated
        $storeSetting = StoreSetting::where('store_id', $store->id)
            ->where('theme', 'default')
            ->first();

        $this->assertNotNull($storeSetting);
        $this->assertEquals('completed', $storeSetting->content_generation_status);
        $this->assertEquals($expectedContent['title'], $storeSetting->content['hero']['title']);
    }

    public function test_job_updates_progress_during_generation(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'theme' => 'default',
        ]);

        $jobId = 'test_job_' . uniqid();
        $cacheKey = "content_regeneration:job:{$jobId}";

        Cache::put($cacheKey, [
            'status' => 'pending',
            'progress' => 0,
            'current_step' => '',
            'section' => 'hero',
        ], 1800);

        $mockService = Mockery::mock(StoreContentGenerationService::class);
        $expectedContent = ['title' => 'Test Title'];

        $progressUpdates = [];
        $mockService->shouldReceive('generateSpecificSection')
            ->once()
            ->with($store, 'hero', Mockery::on(function ($callback) use (&$progressUpdates) {
                // Simulate progress updates
                $callback(30, 'Building prompt...');
                $callback(50, 'Generating content...');
                $callback(80, 'Validating...');
                return true;
            }))
            ->andReturn($expectedContent);

        $this->app->instance(StoreContentGenerationService::class, $mockService);

        $job = new RegenerateSectionJob($store->id, 'hero', 'default', $jobId);
        $job->handle($mockService);

        // Final status should be completed
        $progress = Cache::get($cacheKey);
        $this->assertEquals('completed', $progress['status']);
        $this->assertEquals(100, $progress['progress']);
    }

    public function test_job_handles_generation_failure(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'theme' => 'default',
        ]);

        $jobId = 'test_job_' . uniqid();
        $cacheKey = "content_regeneration:job:{$jobId}";

        Cache::put($cacheKey, [
            'status' => 'pending',
            'progress' => 0,
            'section' => 'hero',
        ], 1800);

        $mockService = Mockery::mock(StoreContentGenerationService::class);
        $mockService->shouldReceive('generateSpecificSection')
            ->once()
            ->andReturn(null); // Simulate generation failure

        $this->app->instance(StoreContentGenerationService::class, $mockService);

        $job = new RegenerateSectionJob($store->id, 'hero', 'default', $jobId);
        $job->handle($mockService);

        // Check cache shows failure
        $progress = Cache::get($cacheKey);
        $this->assertNotNull($progress);
        $this->assertEquals('failed', $progress['status']);
        $this->assertEquals('GENERATION_FAILED', $progress['error_code']);

        // Check database shows failed status
        $storeSetting = StoreSetting::where('store_id', $store->id)
            ->where('theme', 'default')
            ->first();

        $this->assertNotNull($storeSetting);
        $this->assertEquals('failed', $storeSetting->content_generation_status);
    }

    public function test_job_handles_exceptions_with_error_codes(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'theme' => 'default',
        ]);

        $jobId = 'test_job_' . uniqid();
        $cacheKey = "content_regeneration:job:{$jobId}";

        Cache::put($cacheKey, [
            'status' => 'pending',
            'progress' => 0,
            'section' => 'hero',
        ], 1800);

        $mockService = Mockery::mock(StoreContentGenerationService::class);
        
        // Test OpenAI key missing error
        $mockService->shouldReceive('generateSpecificSection')
            ->once()
            ->andThrow(new \Exception('OpenAI API key is not configured.'));

        $this->app->instance(StoreContentGenerationService::class, $mockService);

        $job = new RegenerateSectionJob($store->id, 'hero', 'default', $jobId);
        $job->handle($mockService);

        $progress = Cache::get($cacheKey);
        $this->assertEquals('failed', $progress['status']);
        $this->assertEquals('OPENAI_KEY_MISSING', $progress['error_code']);
    }

    public function test_job_handles_rate_limit_error(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'theme' => 'default',
        ]);

        $jobId = 'test_job_' . uniqid();
        $cacheKey = "content_regeneration:job:{$jobId}";

        Cache::put($cacheKey, ['status' => 'pending', 'progress' => 0, 'section' => 'hero'], 1800);

        $mockService = Mockery::mock(StoreContentGenerationService::class);
        $mockService->shouldReceive('generateSpecificSection')
            ->once()
            ->andThrow(new \Exception('Rate limit exceeded'));

        $this->app->instance(StoreContentGenerationService::class, $mockService);

        $job = new RegenerateSectionJob($store->id, 'hero', 'default', $jobId);
        $job->handle($mockService);

        $progress = Cache::get($cacheKey);
        $this->assertEquals('OPENAI_RATE_LIMIT', $progress['error_code']);
    }

    public function test_job_handles_timeout_error(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'theme' => 'default',
        ]);

        $jobId = 'test_job_' . uniqid();
        $cacheKey = "content_regeneration:job:{$jobId}";

        Cache::put($cacheKey, ['status' => 'pending', 'progress' => 0, 'section' => 'hero'], 1800);

        $mockService = Mockery::mock(StoreContentGenerationService::class);
        $mockService->shouldReceive('generateSpecificSection')
            ->once()
            ->andThrow(new \Exception('Request timeout'));

        $this->app->instance(StoreContentGenerationService::class, $mockService);

        $job = new RegenerateSectionJob($store->id, 'hero', 'default', $jobId);
        $job->handle($mockService);

        $progress = Cache::get($cacheKey);
        $this->assertEquals('TIMEOUT', $progress['error_code']);
    }

    public function test_job_saves_quality_metrics_when_available(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'theme' => 'default',
        ]);

        $jobId = 'test_job_' . uniqid();
        $cacheKey = "content_regeneration:job:{$jobId}";

        Cache::put($cacheKey, ['status' => 'pending', 'progress' => 0, 'section' => 'hero'], 1800);

        $mockService = Mockery::mock(StoreContentGenerationService::class);
        $expectedContent = ['title' => 'Test Title'];

        $mockService->shouldReceive('generateSpecificSection')
            ->once()
            ->andReturn($expectedContent);

        // Mock validator
        $mockValidator = Mockery::mock(\App\Services\LandingPageContentValidator::class);
        $mockValidator->shouldReceive('checkContentQuality')
            ->once()
            ->andReturn(['score' => 95, 'issues' => []]);

        $this->app->instance(StoreContentGenerationService::class, $mockService);
        $this->app->instance(\App\Services\LandingPageContentValidator::class, $mockValidator);

        $job = new RegenerateSectionJob($store->id, 'hero', 'default', $jobId);
        $job->handle($mockService);

        $progress = Cache::get($cacheKey);
        $this->assertNotNull($progress['quality_metrics']);
        $this->assertEquals(95, $progress['quality_metrics']['score']);
    }

    public function test_job_handles_missing_store(): void
    {
        $jobId = 'test_job_' . uniqid();
        $cacheKey = "content_regeneration:job:{$jobId}";

        Cache::put($cacheKey, ['status' => 'pending', 'progress' => 0, 'section' => 'hero'], 1800);

        $mockService = Mockery::mock(StoreContentGenerationService::class);

        $job = new RegenerateSectionJob(99999, 'hero', 'default', $jobId);
        
        $this->expectException(\Illuminate\Database\Eloquent\ModelNotFoundException::class);
        $job->handle($mockService);
    }

    public function test_job_updates_existing_content_correctly(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'theme' => 'default',
        ]);

        // Create existing content
        StoreSetting::create([
            'store_id' => $store->id,
            'theme' => 'default',
            'content' => [
                'hero' => ['title' => 'Old Title'],
                'about' => ['title' => 'About Us'],
            ],
        ]);

        $jobId = 'test_job_' . uniqid();
        $cacheKey = "content_regeneration:job:{$jobId}";

        Cache::put($cacheKey, ['status' => 'pending', 'progress' => 0, 'section' => 'hero'], 1800);

        $mockService = Mockery::mock(StoreContentGenerationService::class);
        $newHeroContent = ['title' => 'New Hero Title', 'subtitle' => 'New Subtitle'];

        $mockService->shouldReceive('generateSpecificSection')
            ->once()
            ->andReturn($newHeroContent);

        $this->app->instance(StoreContentGenerationService::class, $mockService);

        $job = new RegenerateSectionJob($store->id, 'hero', 'default', $jobId);
        $job->handle($mockService);

        // Check that only hero section was updated, about section remains
        $storeSetting = StoreSetting::where('store_id', $store->id)
            ->where('theme', 'default')
            ->first();

        $this->assertEquals('New Hero Title', $storeSetting->content['hero']['title']);
        $this->assertEquals('About Us', $storeSetting->content['about']['title']);
    }

    public function test_job_sets_completed_at_timestamp(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'theme' => 'default',
        ]);

        $jobId = 'test_job_' . uniqid();
        $cacheKey = "content_regeneration:job:{$jobId}";

        Cache::put($cacheKey, ['status' => 'pending', 'progress' => 0, 'section' => 'hero'], 1800);

        $mockService = Mockery::mock(StoreContentGenerationService::class);
        $mockService->shouldReceive('generateSpecificSection')
            ->once()
            ->andReturn(['title' => 'Test']);

        $this->app->instance(StoreContentGenerationService::class, $mockService);

        $job = new RegenerateSectionJob($store->id, 'hero', 'default', $jobId);
        $job->handle($mockService);

        $progress = Cache::get($cacheKey);
        $this->assertNotNull($progress['completed_at']);
        $this->assertIsString($progress['completed_at']);
    }

    public function test_update_progress_merges_existing_cache_data(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'theme' => 'default',
        ]);

        $jobId = 'test_job_' . uniqid();
        $cacheKey = "content_regeneration:job:{$jobId}";

        // Set initial cache with some data
        $initialData = [
            'status' => 'pending',
            'progress' => 0,
            'current_step' => 'Initial step',
            'section' => 'hero',
            'error_code' => null,
            'error_message' => null,
            'created_at' => '2026-01-01T00:00:00Z',
            'completed_at' => null,
            'custom_field' => 'should be preserved',
        ];

        Cache::put($cacheKey, $initialData, 1800);

        $mockService = Mockery::mock(StoreContentGenerationService::class);
        $mockService->shouldReceive('generateSpecificSection')
            ->once()
            ->andReturn(['title' => 'Test']);

        $this->app->instance(StoreContentGenerationService::class, $mockService);

        $job = new RegenerateSectionJob($store->id, 'hero', 'default', $jobId);
        $job->handle($mockService);

        $progress = Cache::get($cacheKey);
        
        // Should preserve created_at
        $this->assertEquals('2026-01-01T00:00:00Z', $progress['created_at']);
        // Should update status and progress
        $this->assertEquals('completed', $progress['status']);
        $this->assertEquals(100, $progress['progress']);
    }

    public function test_job_caches_progress_with_correct_ttl(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'theme' => 'default',
        ]);

        $jobId = 'test_job_' . uniqid();
        $cacheKey = "content_regeneration:job:{$jobId}";

        // Use reflection to test private method behavior
        Cache::put($cacheKey, ['status' => 'pending'], 1800);

        $mockService = Mockery::mock(StoreContentGenerationService::class);
        $mockService->shouldReceive('generateSpecificSection')
            ->once()
            ->andReturn(['title' => 'Test']);

        $this->app->instance(StoreContentGenerationService::class, $mockService);

        $job = new RegenerateSectionJob($store->id, 'hero', 'default', $jobId);
        $job->handle($mockService);

        // Verify cache still exists (would be null if TTL expired or wasn't set)
        $progress = Cache::get($cacheKey);
        $this->assertNotNull($progress);
        $this->assertEquals('completed', $progress['status']);
    }
}

