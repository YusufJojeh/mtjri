<?php

namespace App\Services;

use App\Models\Store;
use App\Models\StoreSetting;
use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Contracts\OpenAIContentGenerator;

class StoreContentGenerationService
{
    protected OpenAIContentGenerator $openAIContentGenerator;
    protected LandingPagePromptService $promptService;
    protected LandingPageContentValidator $validator;
    protected LandingPageContextBuilder $contextBuilder;

    public function __construct(
        OpenAIContentGenerator $openAIContentGenerator,
        LandingPagePromptService $promptService,
        LandingPageContentValidator $validator,
        LandingPageContextBuilder $contextBuilder
    ) {
        $this->openAIContentGenerator = $openAIContentGenerator;
        $this->promptService = $promptService;
        $this->validator = $validator;
        $this->contextBuilder = $contextBuilder;
    }

    /**
     * Generate content and images for a store\'s landing page.
     *
     * @param Store $store
     * @param string $theme
     * @return array
     */
    public function generateContent(Store $store, string $theme): array
    {
        // Check OpenAI configuration first
        $configCheck = $this->checkOpenAIConfig();
        if (!$configCheck['success']) {
            Log::error('OpenAI config error: ' . $configCheck['message']);
            throw new \Exception($configCheck['message']);
        }

        // Get theme defaults to understand the structure
        $themeDefaults = StoreSetting::getThemeDefaults($theme);
        $storeColor = $this->mapHexToUnsplashColor($store->color);

        $generatedContent = [];
        $generatedImages = [];
        $errors = [];

        // Define sections to generate
        $sections = ['hero', 'features', 'about', 'cta_section', 'featured_products', 'trending_products', 'categories', 'newsletter'];

        // Generate content for each section with improved error handling
        foreach ($sections as $section) {
            if (!isset($themeDefaults[$section])) {
                continue;
            }

            try {
                $sectionContent = $this->generateSectionWithRetry($store, $section, $themeDefaults[$section], $theme);

                if ($sectionContent) {
                    // Validate content before adding
                    $validation = $this->validator->validateSection($section, $sectionContent, $themeDefaults[$section]);

                    if (!$validation['valid']) {
                        Log::warning("Validation failed for {$section} section: " . implode(', ', $validation['errors']));
                        // Still use the content but log warnings
                        if (!empty($validation['warnings'])) {
                            Log::info("Validation warnings for {$section}: " . implode(', ', $validation['warnings']));
                        }
                    }

                    $generatedContent[$section] = $sectionContent;

                    // Handle image generation for sections that need it
                    if (in_array($section, ['hero', 'about'])) {
                        $context = $this->contextBuilder->buildStoreContext($store);
                        $imageQuery = "{$context['business_type']} {$context['store_description']} {$section} image";
                        $image = $this->fetchImageFromUnsplash($imageQuery, $storeColor);
                        if ($image) {
                            $generatedContent[$section]['image'] = $image;
                        }
                    }
                } else {
                    Log::warning("Failed to generate content for {$section} section, using defaults");
                    $errors[] = $section;
                }
            } catch (\Exception $e) {
                Log::error("Error generating {$section} section: " . $e->getMessage());
                $errors[] = $section;
                // Continue with other sections even if one fails
            }
        }

        // Merge generated content with theme defaults to ensure full structure
        $finalContent = array_replace_recursive($themeDefaults, $generatedContent);

        // Log summary
        if (!empty($errors)) {
            Log::warning("Content generation completed with errors for sections: " . implode(', ', $errors));
        } else {
            Log::info("Content generation completed successfully for all sections");
        }

        return $finalContent;
    }

    /**
     * Generate a section with retry logic
     */
    private function generateSectionWithRetry(Store $store, string $section, array $defaults, string $theme, int $maxRetries = 2, ?callable $progressCallback = null): ?array
    {
        $userLanguage = $store->user->lang ?? 'en';

        for ($attempt = 0; $attempt <= $maxRetries; $attempt++) {
            try {
                // Build prompt using the new prompt service
                $prompt = $this->promptService->buildSectionPrompt($section, $store, $defaults);

                // Report progress for AI generation
                if ($progressCallback) {
                    $attemptProgress = (int)(($attempt / ($maxRetries + 1)) * 100);
                    $progressCallback($attemptProgress);
                }

                // Generate content
                $content = $this->openAIContentGenerator->generateText($prompt, $userLanguage);

                if (isset($content['error'])) {
                    if ($attempt < $maxRetries) {
                        Log::warning("Attempt " . ($attempt + 1) . " failed for {$section}, retrying...");
                        usleep(1000000 * ($attempt + 1)); // Exponential backoff
                        continue;
                    }
                    Log::error("OpenAI content generation failed for {$section} section after {$maxRetries} retries: " . $content['error']);
                    return null;
                }

                // Validate structure
                if (!$this->validator->validateStructure($content, $defaults)) {
                    Log::warning("Generated content structure doesn't match defaults for {$section}");
                    // Still return content, but merge with defaults
                    return array_replace_recursive($defaults, $content);
                }

                if ($progressCallback) {
                    $progressCallback(100);
                }

                return $content;
            } catch (\Exception $e) {
                if ($attempt < $maxRetries) {
                    Log::warning("Exception on attempt " . ($attempt + 1) . " for {$section}: " . $e->getMessage());
                    usleep(1000000 * ($attempt + 1));
                    continue;
                }
                Log::error("Exception generating {$section} after {$maxRetries} retries: " . $e->getMessage());
                return null;
            }
        }

        return null;
    }

    /**
     * Generate content and images for a specific section of a store's landing page.
     *
     * @param Store $store
     * @param string $sectionName
     * @param callable|null $progressCallback Callback function with (progress, message) parameters
     * @return array|null
     */
    public function generateSpecificSection(Store $store, string $sectionName, ?callable $progressCallback = null): ?array
    {
        // Check OpenAI configuration first
        $configCheck = $this->checkOpenAIConfig();
        if (!$configCheck['success']) {
            Log::error('OpenAI config error: ' . $configCheck['message']);
            if ($progressCallback) {
                $progressCallback(0, $configCheck['message']);
            }
            throw new \Exception($configCheck['message']);
        }

        if ($progressCallback) {
            $progressCallback(10, __('Starting generation...'));
        }

        $theme = $store->theme ?? 'default';
        $themeDefaults = StoreSetting::getThemeDefaults($theme);

        if (!isset($themeDefaults[$sectionName])) {
            Log::warning("Theme defaults for section '{$sectionName}' not found in theme '{$theme}'.");
            if ($progressCallback) {
                $progressCallback(0, __('Section not found in theme.'));
            }
            return null;
        }

        if ($progressCallback) {
            $progressCallback(30, __('Building prompt...'));
        }

        // Generate section with retry logic
        $generatedSectionContent = $this->generateSectionWithRetry(
            $store, 
            $sectionName, 
            $themeDefaults[$sectionName], 
            $theme,
            2, // maxRetries
            function ($progress) use ($progressCallback) {
                if ($progressCallback) {
                    // Map retry progress (0-100) to our range (30-50)
                    $mappedProgress = 30 + (int)($progress * 0.2);
                    $progressCallback($mappedProgress, __('Generating content with AI...'));
                }
            }
        );

        if (!$generatedSectionContent) {
            if ($progressCallback) {
                $progressCallback(0, __('Generation failed after retries.'));
            }
            return null;
        }

        if ($progressCallback) {
            $progressCallback(80, __('Validating content...'));
        }

        // Validate content
        $validation = $this->validator->validateSection($sectionName, $generatedSectionContent, $themeDefaults[$sectionName]);
        if (!$validation['valid']) {
            Log::warning("Validation failed for {$sectionName}: " . implode(', ', $validation['errors']));
            if ($progressCallback) {
                $progressCallback(85, __('Content validation completed with warnings.'));
            }
        }

        // Handle image generation for sections that need it
        if (in_array($sectionName, ['hero', 'about'])) {
            if ($progressCallback) {
                $progressCallback(90, __('Generating images...'));
            }
            $context = $this->contextBuilder->buildStoreContext($store);
            $storeColor = $this->mapHexToUnsplashColor($store->color);
            $imageQuery = "{$context['business_type']} {$context['store_description']} {$sectionName} image";
            $image = $this->fetchImageFromUnsplash($imageQuery, $storeColor);
            if ($image) {
                $generatedSectionContent['image'] = $image;
            }
        }

        if ($progressCallback) {
            $progressCallback(95, __('Finalizing...'));
        }

        // Merge with theme defaults to ensure full structure
        return array_replace_recursive($themeDefaults[$sectionName], $generatedSectionContent);
    }

    /**
     * Check if OpenAI is configured correctly.
     *
     * @return array Returns an array with 'success' => true|false and 'message'.
     */
    public function checkOpenAIConfig(): array
    {
        $chatgptKey = Setting::getGlobal('chatgptKey');
        $chatgptModel = Setting::getGlobal('chatgptModel');

        if (empty($chatgptKey)) {
            return ['success' => false, 'message' => 'OpenAI API key is not configured.'];
        }

        if (empty($chatgptModel)) {
            return ['success' => false, 'message' => 'OpenAI model is not configured.'];
        }

        return ['success' => true, 'message' => 'OpenAI is configured correctly.'];
    }


    /**
     * Map hex color to Unsplash-supported color filter.
     *
     * @param string|null $hex
     * @return string|null
     */
    private function mapHexToUnsplashColor(?string $hex): ?string
    {
        if (!$hex) return null;

        $mapping = [
            '#3b82f6' => 'blue',    // Tailwind blue-500
            '#10b981' => 'green',   // Tailwind green-500
            '#8b5cf6' => 'purple',  // Tailwind purple-500
            '#f97316' => 'orange',  // Tailwind orange-500
            '#ef4444' => 'red',     // Tailwind red-500
            '#ffffff' => 'white',   // White
            '#000000' => 'black',   // Black
            '#fcd34d' => 'yellow',  // Tailwind yellow-300
            // Add more mappings as needed based on common brand colors
        ];

        return $mapping[strtolower($hex)] ?? null;
    }

    /**
     * Fetch an image from Unsplash.
     *
     * @param string $query
     * @param int $retries
     * @return array|null
     */
    private function fetchImageFromUnsplash(string $query, ?string $color = null, int $retries = 0): ?array
    {
        try {
            $accessKey = Setting::getGlobal('unsplashAccessKey');
            $applicationId = Setting::getGlobal('unsplashApplicationId');
            $secretKey = Setting::getGlobal('unsplashSecretKey');

            $headers = [];

            if ($accessKey) {
                $headers['Authorization'] = 'Client-ID ' . $accessKey;
            } elseif ($applicationId && $secretKey) {
                Log::warning('Unsplash Application ID and Secret Key are set, but direct image fetching with these keys (via OAuth) is not yet implemented in StoreContentGenerationService. Proceeding only if accessKey is also set.');
                return null; // Or implement OAuth flow here
            } else {
                Log::error('Unsplash API keys (unsplashAccessKey or both unsplashApplicationId and unsplashSecretKey) are not set in settings.');
                return null;
            }

            $params = [
                'query' => $query,
                'orientation' => 'landscape',
                'per_page' => 1
            ];

            if ($color) {
                $params['color'] = $color;
            }

            $response = Http::withHeaders($headers)->get('https://api.unsplash.com/search/photos', $params);

            if ($response->successful() && !empty($response->json('results'))) {
                $results = $response->json('results');
                $imageUrl = $results[0]['urls']['regular'];
                Log::info('Unsplash API image fetched for query: ' . $query . ' URL: ' . $imageUrl);
                return [
                    'url' => $results[0]['urls']['regular'],
                    'download_location' => $results[0]['links']['download_location'],
                    'photographer_name' => $results[0]['user']['name'],
                    'photographer_username' => $results[0]['user']['username'], // إضافة username لسهولة بناء الروابط
                    'photographer_url' => $results[0]['user']['links']['html'],
                    'photo_page_url' => $results[0]['links']['html'],
                    'unsplash_id' => $results[0]['id'],
                ];
            }

            Log::warning('Unsplash API failed or returned no results for query: ' . $query . '. Status: ' . $response->status());

            // Get retry configuration
            $maxRetries = config('services.unsplash.retries', 2); // Default to 2 retries
            $retrySleep = config('services.unsplash.retry_sleep_ms', 1000); // Default to 1000ms (1 second)

            if ($retries < $maxRetries) {
                usleep($retrySleep * 1000); // Wait in microseconds
                return $this->fetchImageFromUnsplash($query, $retries + 1);
            }
            return null;

        } catch (\Exception $e) {
            Log::error('Unsplash API error: ' . $e->getMessage() . ' for query: ' . $query);

            // Get retry configuration
            $maxRetries = config('services.unsplash.retries', 2); // Default to 2 retries
            $retrySleep = config('services.unsplash.retry_sleep_ms', 1000); // Default to 1000ms (1 second)

            if ($retries < $maxRetries) {
                usleep($retrySleep * 1000); // Wait in microseconds
                return $this->fetchImageFromUnsplash($query, $retries + 1);
            }
            return null;
        }
    }

    /**
     * Determine business type based on theme. (Placeholder, can be refined)
     *
     * @param string $theme
     * @return string
     */
    public function determineBusinessType(?string $storeIndustry, string $theme): string
    {
        // Prioritize store industry if available
        if ($storeIndustry) {
            return $storeIndustry; // Use directly as the query term
        }

        // Fallback to theme-based business type
        return match($theme) {
            'fashion' => 'fashion boutique',
            'electronics' => 'electronics store',
            'beauty-cosmetics' => 'beauty and cosmetics shop',
            'jewelry' => 'jewelry store',
            'furniture-interior' => 'furniture and interior design shop',
            'baby-kids' => 'baby and kids products store',
            'cars-automotive' => 'cars and automotive parts store',
            'perfume-fragrances' => 'perfume and fragrances shop',
            'watches' => 'watches store',
            default => 'general e-commerce store'
        };
    }

    /**
     * Get human-readable language name for prompt.
     *
     * @param string $langCode
     * @return string
     */
    private function getLanguageName(string $langCode): string
    {
        return match($langCode) {
            'es' => 'Spanish',
            'ar' => 'Arabic',
            'da' => 'Danish',
            'de' => 'German',
            'fr' => 'French',
            'he' => 'Hebrew',
            'it' => 'Italian',
            'ja' => 'Japanese',
            'nl' => 'Dutch',
            'pl' => 'Polish',
            'pt' => 'Portuguese',
            'pt-BR' => 'Brazilian Portuguese',
            'ru' => 'Russian',
            'tr' => 'Turkish',
            'zh' => 'Chinese',
            default => 'English'
        };
    }

}
