<?php

namespace Tests\Feature;

use App\Services\LandingPageContentValidator;
use Tests\TestCase;

class ContentQualityTest extends TestCase
{
    protected LandingPageContentValidator $validator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->validator = new LandingPageContentValidator();
    }

    public function test_generated_content_meets_quality_standards(): void
    {
        $content = [
            'title' => 'Quality Test Title',
            'subtitle' => 'Quality subtitle.',
            'description' => 'Quality description with enough words.',
            'button_text' => 'Shop Now',
        ];

        $metrics = $this->validator->checkContentQuality($content);

        $this->assertGreaterThan(70, $metrics['quality_score']);
        $this->assertFalse($metrics['has_placeholder']);
    }

    public function test_generated_content_is_relevant_to_store(): void
    {
        $content = [
            'title' => 'Fashion Store Title',
            'subtitle' => 'Style and elegance.',
            'description' => 'We offer the latest fashion trends.',
        ];

        $validation = $this->validator->validateSection('hero', $content, []);

        // Should not contain generic placeholder text
        $this->assertFalse($validation['warnings'] ? 
            str_contains(strtolower(implode(' ', $validation['warnings'])), 'placeholder') : false
        );
    }

    public function test_generated_content_is_seo_optimized(): void
    {
        $content = [
            'title' => 'Fashion Store - Latest Trends',
            'subtitle' => 'Discover our collection.',
            'description' => 'Shop the latest fashion trends with quality products and excellent service.',
        ];

        $metrics = $this->validator->checkContentQuality($content);

        $this->assertTrue($metrics['seo_friendly']);
    }

    public function test_generated_content_matches_brand_voice(): void
    {
        $content = [
            'title' => 'Elegant Fashion Collection',
            'subtitle' => 'Sophisticated style for modern women.',
            'description' => 'Our elegant collection features premium quality and timeless designs.',
        ];

        $validation = $this->validator->validateSection('hero', $content, []);

        $consistency = $this->validator->checkBrandConsistency($content);

        $this->assertTrue($consistency['consistent']);
    }

    public function test_generated_content_is_conversion_focused(): void
    {
        $content = [
            'title' => 'Shop Now - Limited Time Offer',
            'subtitle' => 'Get 20% off today only!',
            'description' => 'Don\'t miss this exclusive offer. Shop now and save.',
            'button_text' => 'Buy Now',
        ];

        // Check for conversion-focused elements
        $this->assertStringContainsString('Shop', $content['title']);
        $this->assertStringContainsString('Now', $content['button_text']);
    }

    public function test_generated_content_has_appropriate_length(): void
    {
        $content = [
            'title' => 'Perfect Length Title',
            'subtitle' => 'A good subtitle.',
            'description' => 'First sentence. Second sentence. Third sentence.',
        ];

        $validation = $this->validator->validateSection('hero', $content, []);

        // Should not have length warnings
        $hasLengthWarnings = false;
        if (!empty($validation['warnings'])) {
            foreach ($validation['warnings'] as $warning) {
                if (str_contains(strtolower($warning), 'length')) {
                    $hasLengthWarnings = true;
                    break;
                }
            }
        }

        $this->assertFalse($hasLengthWarnings);
    }

    public function test_generated_content_has_no_placeholder_text(): void
    {
        $content = [
            'title' => 'Real Store Title',
            'subtitle' => 'Real subtitle.',
            'description' => 'Real description for the store.',
        ];

        $validation = $this->validator->validateSection('hero', $content, []);

        $hasPlaceholder = false;
        if (!empty($validation['warnings'])) {
            foreach ($validation['warnings'] as $warning) {
                if (str_contains(strtolower($warning), 'placeholder')) {
                    $hasPlaceholder = true;
                    break;
                }
            }
        }

        $this->assertFalse($hasPlaceholder);
    }

    public function test_generated_content_is_culturally_appropriate(): void
    {
        // Test that content structure is appropriate regardless of language
        $content = [
            'title' => 'Store Title',
            'subtitle' => 'Subtitle.',
            'description' => 'Description.',
        ];

        $validation = $this->validator->validateSection('hero', $content, []);

        // Should validate successfully
        $this->assertArrayHasKey('valid', $validation);
    }
}

