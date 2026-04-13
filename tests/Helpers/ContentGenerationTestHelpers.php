<?php

namespace Tests\Helpers;

use App\Models\Store;
use App\Models\User;
use App\Contracts\OpenAIContentGenerator;
use Mockery\MockInterface;

class ContentGenerationTestHelpers
{
    /**
     * Create a mock store with optional attributes
     */
    public static function createMockStore(array $attributes = []): Store
    {
        $user = User::factory()->create($attributes['user'] ?? []);
        
        return Store::factory()->create(array_merge([
            'user_id' => $user->id,
            'name' => 'Test Store',
            'description' => 'A test e-commerce store',
            'industry' => 'fashion',
        ], $attributes));
    }

    /**
     * Create a mock OpenAI client
     */
    public static function createMockOpenAIClient(): MockInterface
    {
        return \Mockery::mock(OpenAIContentGenerator::class);
    }

    /**
     * Create a mock Unsplash client response
     */
    public static function mockUnsplashResponse(string $url = 'https://images.unsplash.com/photo-1'): array
    {
        return [
            'results' => [
                [
                    'id' => 'photo-1',
                    'urls' => ['regular' => $url],
                    'links' => [
                        'download_location' => 'https://api.unsplash.com/photos/photo-1/download',
                        'html' => 'https://unsplash.com/photos/photo-1',
                    ],
                    'user' => [
                        'name' => 'John Doe',
                        'username' => 'johndoe',
                        'links' => ['html' => 'https://unsplash.com/@johndoe'],
                    ],
                ],
            ],
        ];
    }

    /**
     * Mock OpenAI response
     */
    public static function mockOpenAIResponse(array $content): array
    {
        return $content;
    }

    /**
     * Assert content structure matches expected format
     */
    public static function assertContentStructure(array $content, string $section): void
    {
        switch ($section) {
            case 'hero':
                \PHPUnit\Framework\Assert::assertArrayHasKey('title', $content);
                \PHPUnit\Framework\Assert::assertArrayHasKey('subtitle', $content);
                break;
            case 'features':
                \PHPUnit\Framework\Assert::assertArrayHasKey('items', $content);
                \PHPUnit\Framework\Assert::assertIsArray($content['items']);
                break;
            case 'about':
                \PHPUnit\Framework\Assert::assertTrue(
                    isset($content['content']) || isset($content['title']),
                    'About section must have content or title'
                );
                break;
            case 'cta_section':
                \PHPUnit\Framework\Assert::assertArrayHasKey('title', $content);
                \PHPUnit\Framework\Assert::assertArrayHasKey('button_text', $content);
                break;
        }
    }

    /**
     * Assert content quality
     */
    public static function assertContentQuality(array $content): void
    {
        // Check for placeholder text
        $contentString = json_encode($content);
        \PHPUnit\Framework\Assert::assertStringNotContainsString('lorem ipsum', strtolower($contentString));
        \PHPUnit\Framework\Assert::assertStringNotContainsString('placeholder', strtolower($contentString));
        
        // Check content is not empty
        \PHPUnit\Framework\Assert::assertNotEmpty($content);
    }

    /**
     * Get expected prompt structure for a section
     */
    public static function getExpectedPromptStructure(string $section): array
    {
        return match($section) {
            'hero' => ['title', 'subtitle', 'description', 'button_text'],
            'features' => ['items'],
            'about' => ['content', 'title'],
            'cta_section' => ['title', 'description', 'button_text'],
            default => [],
        };
    }
}

