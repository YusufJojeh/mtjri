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
use Illuminate\Support\Facades\Log;

class GenerateStoreContentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $storeId;
    public $theme;

    /**
     * Create a new job instance.
     *
     * @param int $storeId
     * @param string $theme
     * @return void
     */
    public function __construct(int $storeId, string $theme)
    {
        $this->storeId = $storeId;
        $this->theme = $theme;
    }

    /**
     * Execute the job.
     *
     * @param StoreContentGenerationService $contentGenerationService
     * @return void
     */
    public function handle(StoreContentGenerationService $contentGenerationService)
    {
        Log::info('Starting GenerateStoreContentJob for store ' . $this->storeId . ' with theme ' . $this->theme);

        // Let a missing store throw immediately: it is a job configuration
        // error, not a recoverable generation failure, and the broad catch
        // below writes a failed status keyed on $this->storeId, which would
        // violate the store_settings FK constraint for a nonexistent store.
        $store = Store::findOrFail($this->storeId);

        try {
            // Update status to processing
            StoreSetting::updateOrCreate(
                ['store_id' => $this->storeId, 'theme' => $this->theme],
                [
                    'content_generation_status' => 'processing',
                    'content' => StoreSetting::getSettings($this->storeId, $this->theme)
                ]
            );

            // Generate content
            $generatedContent = $contentGenerationService->generateContent($store, $this->theme);

            // Validate overall content quality
            $validator = app(\App\Services\LandingPageContentValidator::class);
            $sectionsGenerated = 0;
            $sectionsWithErrors = 0;

            $sections = ['hero', 'features', 'about', 'cta_section', 'featured_products', 'trending_products', 'categories', 'newsletter'];
            foreach ($sections as $section) {
                if (isset($generatedContent[$section])) {
                    $sectionsGenerated++;
                    $validation = $validator->validateSection($section, $generatedContent[$section], []);
                    if (!$validation['valid']) {
                        $sectionsWithErrors++;
                    }
                }
            }

            // Determine final status
            $status = ($sectionsGenerated > 0 && $sectionsWithErrors < $sectionsGenerated)
                ? 'completed'
                : 'failed';

            // Save generated content to store settings and update status
            StoreSetting::updateOrCreate(
                ['store_id' => $this->storeId, 'theme' => $this->theme],
                [
                    'content' => $generatedContent,
                    'content_generation_status' => $status,
                    'content_generated_at' => now(),
                ]
            );

            if ($status === 'completed') {
                Log::info("Successfully generated and saved content for store {$this->storeId}. Sections generated: {$sectionsGenerated}, sections with errors: {$sectionsWithErrors}");
            } else {
                Log::warning("Content generation completed with issues for store {$this->storeId}. Sections generated: {$sectionsGenerated}, sections with errors: {$sectionsWithErrors}");
            }

        } catch (\Exception $e) {
            Log::error('Error in GenerateStoreContentJob for store ' . $this->storeId . ': ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());

            // Mark store content generation as failed in the database
            StoreSetting::updateOrCreate(
                ['store_id' => $this->storeId, 'theme' => $this->theme],
                [
                    'content_generation_status' => 'failed',
                    'content' => StoreSetting::getSettings($this->storeId, $this->theme)
                ]
            );
        }
    }
}

