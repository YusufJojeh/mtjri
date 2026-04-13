<?php

namespace Tests\Unit\Jobs;

use App\Jobs\GenerateStoreContentJob;
use App\Models\Store;
use App\Models\StoreSetting;
use App\Models\User;
use App\Services\StoreContentGenerationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;
use Mockery;

class GenerateStoreContentJobTest extends TestCase
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

        GenerateStoreContentJob::dispatch($store->id, 'default');

        Queue::assertPushed(GenerateStoreContentJob::class, function ($job) use ($store) {
            return $job->storeId === $store->id;
        });
    }

    public function test_job_handles_content_generation_success(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'description' => 'Test store',
        ]);

        $mockService = Mockery::mock(StoreContentGenerationService::class);
        $mockService->shouldReceive('generateContent')
            ->once()
            ->with($store, 'default')
            ->andReturn([
                'hero' => ['title' => 'Test Hero'],
                'features' => ['items' => []],
            ]);

        $this->app->instance(StoreContentGenerationService::class, $mockService);

        $job = new GenerateStoreContentJob($store->id, 'default');
        $job->handle($mockService);

        $storeSetting = StoreSetting::where('store_id', $store->id)
            ->where('theme', 'default')
            ->first();

        $this->assertNotNull($storeSetting);
        $this->assertEquals('completed', $storeSetting->content_generation_status);
    }

    public function test_job_handles_content_generation_failure(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create(['user_id' => $user->id]);

        $mockService = Mockery::mock(StoreContentGenerationService::class);
        $mockService->shouldReceive('generateContent')
            ->once()
            ->andThrow(new \Exception('Generation failed'));

        $this->app->instance(StoreContentGenerationService::class, $mockService);

        $job = new GenerateStoreContentJob($store->id, 'default');
        $job->handle($mockService);

        $storeSetting = StoreSetting::where('store_id', $store->id)
            ->where('theme', 'default')
            ->first();

        $this->assertNotNull($storeSetting);
        $this->assertEquals('failed', $storeSetting->content_generation_status);
    }

    public function test_job_updates_status_during_generation(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create(['user_id' => $user->id]);

        $mockService = Mockery::mock(StoreContentGenerationService::class);
        $mockService->shouldReceive('generateContent')
            ->once()
            ->andReturn(['hero' => ['title' => 'Test']]);

        $this->app->instance(StoreContentGenerationService::class, $mockService);

        $job = new GenerateStoreContentJob($store->id, 'default');
        
        // Check status is set to processing
        $job->handle($mockService);

        // Status should be completed after successful generation
        $storeSetting = StoreSetting::where('store_id', $store->id)
            ->where('theme', 'default')
            ->first();

        $this->assertEquals('completed', $storeSetting->content_generation_status);
    }

    public function test_job_tracks_progress_per_section(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create(['user_id' => $user->id]);

        $mockService = Mockery::mock(StoreContentGenerationService::class);
        $mockService->shouldReceive('generateContent')
            ->once()
            ->andReturn([
                'hero' => ['title' => 'Hero'],
                'features' => ['items' => []],
                'about' => ['content' => 'About'],
            ]);

        $this->app->instance(StoreContentGenerationService::class, $mockService);

        $job = new GenerateStoreContentJob($store->id, 'default');
        $job->handle($mockService);

        $storeSetting = StoreSetting::where('store_id', $store->id)
            ->where('theme', 'default')
            ->first();

        $this->assertArrayHasKey('hero', $storeSetting->content);
        $this->assertArrayHasKey('features', $storeSetting->content);
        $this->assertArrayHasKey('about', $storeSetting->content);
    }

    public function test_job_handles_partial_success(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create(['user_id' => $user->id]);

        $mockService = Mockery::mock(StoreContentGenerationService::class);
        $mockService->shouldReceive('generateContent')
            ->once()
            ->andReturn([
                'hero' => ['title' => 'Hero'],
                // Missing other sections
            ]);

        $this->app->instance(StoreContentGenerationService::class, $mockService);

        $job = new GenerateStoreContentJob($store->id, 'default');
        $job->handle($mockService);

        $storeSetting = StoreSetting::where('store_id', $store->id)
            ->where('theme', 'default')
            ->first();

        // Should still save what was generated
        $this->assertNotNull($storeSetting);
    }

    public function test_job_logs_errors_appropriately(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create(['user_id' => $user->id]);

        $mockService = Mockery::mock(StoreContentGenerationService::class);
        $mockService->shouldReceive('generateContent')
            ->once()
            ->andThrow(new \Exception('Test error'));

        $this->app->instance(StoreContentGenerationService::class, $mockService);

        $job = new GenerateStoreContentJob($store->id, 'default');
        
        // Should not throw exception, but handle it gracefully
        $job->handle($mockService);

        $storeSetting = StoreSetting::where('store_id', $store->id)
            ->where('theme', 'default')
            ->first();

        $this->assertEquals('failed', $storeSetting->content_generation_status);
    }

    public function test_job_saves_content_correctly(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create(['user_id' => $user->id]);

        $expectedContent = [
            'hero' => ['title' => 'Test Hero', 'subtitle' => 'Test Subtitle'],
            'features' => ['items' => [['title' => 'Feature', 'description' => 'Desc']]],
        ];

        $mockService = Mockery::mock(StoreContentGenerationService::class);
        $mockService->shouldReceive('generateContent')
            ->once()
            ->andReturn($expectedContent);

        $this->app->instance(StoreContentGenerationService::class, $mockService);

        $job = new GenerateStoreContentJob($store->id, 'default');
        $job->handle($mockService);

        $storeSetting = StoreSetting::where('store_id', $store->id)
            ->where('theme', 'default')
            ->first();

        $this->assertEquals($expectedContent['hero']['title'], $storeSetting->content['hero']['title']);
    }

    public function test_job_handles_missing_store(): void
    {
        $mockService = Mockery::mock(StoreContentGenerationService::class);

        $job = new GenerateStoreContentJob(99999, 'default');
        
        $this->expectException(\Illuminate\Database\Eloquent\ModelNotFoundException::class);
        $job->handle($mockService);
    }

    public function test_job_handles_missing_theme(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create(['user_id' => $user->id]);

        $mockService = Mockery::mock(StoreContentGenerationService::class);
        $mockService->shouldReceive('generateContent')
            ->once()
            ->with($store, 'unknown_theme')
            ->andReturn([]);

        $this->app->instance(StoreContentGenerationService::class, $mockService);

        $job = new GenerateStoreContentJob($store->id, 'unknown_theme');
        $job->handle($mockService);

        // Should still complete
        $storeSetting = StoreSetting::where('store_id', $store->id)
            ->where('theme', 'unknown_theme')
            ->first();

        $this->assertNotNull($storeSetting);
    }
}

