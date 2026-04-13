<?php

namespace App\Jobs;

use App\Models\Store;
use App\Models\StoreSetting;
use App\Services\StoreContentGenerationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class RegenerateSectionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $storeId;
    protected $sectionName;
    protected $theme;
    protected $jobId;

    /**
     * Create a new job instance.
     *
     * @param int $storeId
     * @param string $sectionName
     * @param string $theme
     * @param string $jobId
     * @return void
     */
    public function __construct(int $storeId, string $sectionName, string $theme, string $jobId)
    {
        $this->storeId = $storeId;
        $this->sectionName = $sectionName;
        $this->theme = $theme;
        $this->jobId = $jobId;
    }

    /**
     * Execute the job.
     *
     * @param StoreContentGenerationService $contentGenerationService
     * @return void
     */
    public function handle(StoreContentGenerationService $contentGenerationService)
    {
        $cacheKey = "content_regeneration:job:{$this->jobId}";
        
        try {
            // Update status to processing
            $this->updateProgress([
                'status' => 'processing',
                'progress' => 10,
                'current_step' => __('Starting generation...'),
                'section' => $this->sectionName,
                'error_code' => null,
                'error_message' => null,
            ]);

            $store = Store::findOrFail($this->storeId);

            // Generate content with progress callback
            $generatedSectionContent = $contentGenerationService->generateSpecificSection(
                $store,
                $this->sectionName,
                function ($progress, $message) {
                    $this->updateProgress([
                        'status' => 'processing',
                        'progress' => $progress,
                        'current_step' => $message,
                        'section' => $this->sectionName,
                    ]);
                }
            );

            if (empty($generatedSectionContent)) {
                $this->updateProgress([
                    'status' => 'failed',
                    'progress' => 0,
                    'current_step' => __('Generation failed'),
                    'section' => $this->sectionName,
                    'error_code' => 'GENERATION_FAILED',
                    'error_message' => __('Failed to generate content for section.'),
                    'completed_at' => now()->toIso8601String(),
                ]);

                // Update StoreSetting with failed status
                StoreSetting::updateOrCreate(
                    ['store_id' => $this->storeId, 'theme' => $this->theme],
                    ['content_generation_status' => 'failed']
                );

                return;
            }

            // Get quality metrics
            $validator = app(\App\Services\LandingPageContentValidator::class);
            $qualityMetrics = null;
            try {
                $qualityMetrics = $validator->checkContentQuality($generatedSectionContent);
            } catch (\Exception $e) {
                Log::warning("Failed to check quality metrics: " . $e->getMessage());
            }

            // Retrieve existing settings and merge with theme defaults
            $existingContent = StoreSetting::getSettings($this->storeId, $this->theme);
            
            // Update only the specific section
            $existingContent[$this->sectionName] = $generatedSectionContent;

            // Save updated content back
            StoreSetting::updateSettings($this->storeId, $this->theme, $existingContent);

            // Mark as completed
            $this->updateProgress([
                'status' => 'completed',
                'progress' => 100,
                'current_step' => __('Complete'),
                'section' => $this->sectionName,
                'error_code' => null,
                'error_message' => null,
                'content' => $generatedSectionContent,
                'quality_metrics' => $qualityMetrics,
                'completed_at' => now()->toIso8601String(),
            ]);

            // Update StoreSetting status
            StoreSetting::updateOrCreate(
                ['store_id' => $this->storeId, 'theme' => $this->theme],
                [
                    'content_generation_status' => 'completed',
                    'content_generated_at' => now(),
                ]
            );

            Log::info("Successfully regenerated section {$this->sectionName} for store {$this->storeId}");

        } catch (\Exception $e) {
            Log::error("Error in RegenerateSectionJob for store {$this->storeId}, section {$this->sectionName}: " . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            // Determine error code
            $errorCode = 'GENERATION_FAILED';
            $errorMessage = $e->getMessage();

            if (str_contains($errorMessage, 'API key') || str_contains($errorMessage, 'OpenAI')) {
                $errorCode = 'OPENAI_KEY_MISSING';
                $errorMessage = __('OpenAI API key is not configured. Please configure it in settings.');
            } elseif (str_contains($errorMessage, 'rate limit') || str_contains($errorMessage, '429')) {
                $errorCode = 'OPENAI_RATE_LIMIT';
                $errorMessage = __('Rate limit exceeded. Please wait a moment and try again.');
            } elseif (str_contains($errorMessage, 'timeout')) {
                $errorCode = 'TIMEOUT';
                $errorMessage = __('Generation timed out. Please try again.');
            }

            $this->updateProgress([
                'status' => 'failed',
                'progress' => 0,
                'current_step' => __('Generation failed'),
                'section' => $this->sectionName,
                'error_code' => $errorCode,
                'error_message' => $errorMessage,
                'completed_at' => now()->toIso8601String(),
            ]);

            // Update StoreSetting with failed status
            StoreSetting::updateOrCreate(
                ['store_id' => $this->storeId, 'theme' => $this->theme],
                ['content_generation_status' => 'failed']
            );
        }
    }

    /**
     * Update progress in cache
     */
    protected function updateProgress(array $progressData)
    {
        $cacheKey = "content_regeneration:job:{$this->jobId}";
        
        $existing = Cache::get($cacheKey, [
            'status' => 'pending',
            'progress' => 0,
            'current_step' => '',
            'section' => $this->sectionName,
            'error_code' => null,
            'error_message' => null,
            'created_at' => now()->toIso8601String(),
            'completed_at' => null,
        ]);

        $updated = array_merge($existing, $progressData);
        
        // Store in cache for 30 minutes (1800 seconds)
        Cache::put($cacheKey, $updated, 1800);
    }
}

