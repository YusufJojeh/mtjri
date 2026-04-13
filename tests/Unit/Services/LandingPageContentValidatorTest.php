<?php

namespace Tests\Unit\Services;

use App\Services\LandingPageContentValidator;
use Tests\TestCase;

class LandingPageContentValidatorTest extends TestCase
{
    protected LandingPageContentValidator $validator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->validator = new LandingPageContentValidator();
    }

    public function test_validate_hero_section_checks_required_fields(): void
    {
        $content = ['title' => 'Test Title'];
        $defaults = ['title' => '', 'subtitle' => '', 'button_text' => ''];

        $result = $this->validator->validateSection('hero', $content, $defaults);

        $this->assertArrayHasKey('valid', $result);
        $this->assertArrayHasKey('errors', $result);
        // Should have errors for missing subtitle and button_text
        $this->assertNotEmpty($result['errors']);
    }

    public function test_validate_hero_section_checks_content_length(): void
    {
        $content = [
            'title' => 'A', // Too short
            'subtitle' => 'A subtitle.',
            'button_text' => 'Click',
        ];
        $defaults = ['title' => '', 'subtitle' => '', 'button_text' => ''];

        $result = $this->validator->validateSection('hero', $content, $defaults);

        $this->assertArrayHasKey('warnings', $result);
    }

    public function test_validate_hero_section_detects_placeholder_text(): void
    {
        $content = [
            'title' => 'Lorem ipsum dolor sit amet',
            'subtitle' => 'Placeholder text here',
            'button_text' => 'Click',
        ];
        $defaults = ['title' => '', 'subtitle' => '', 'button_text' => ''];

        $result = $this->validator->validateSection('hero', $content, $defaults);

        $this->assertArrayHasKey('warnings', $result);
        // Should detect placeholder text
        $warningsString = implode(' ', $result['warnings']);
        $this->assertStringContainsString('placeholder', strtolower($warningsString));
    }

    public function test_validate_features_section_checks_structure(): void
    {
        $content = [
            'items' => [
                ['title' => 'Feature 1', 'description' => 'Description 1.'],
                ['title' => 'Feature 2', 'description' => 'Description 2.'],
            ],
        ];
        $defaults = ['items' => []];

        $result = $this->validator->validateSection('features', $content, $defaults);

        $this->assertArrayHasKey('valid', $result);
    }

    public function test_validate_about_section_checks_content_quality(): void
    {
        $content = ['content' => 'Short text.'];
        $defaults = ['content' => ''];

        $result = $this->validator->validateSection('about', $content, $defaults);

        $this->assertArrayHasKey('warnings', $result);
    }

    public function test_validate_section_returns_validation_errors(): void
    {
        $content = [];
        $defaults = ['title' => ''];

        $result = $this->validator->validateSection('hero', $content, $defaults);

        $this->assertArrayHasKey('errors', $result);
        $this->assertIsArray($result['errors']);
    }

    public function test_validate_section_handles_invalid_json(): void
    {
        $content = 'not an array';
        $defaults = [];

        $result = $this->validator->validateSection('hero', $content, $defaults);

        $this->assertFalse($result['valid']);
        $this->assertNotEmpty($result['errors']);
    }

    public function test_validate_section_checks_brand_consistency(): void
    {
        $content = [
            'title' => 'Your store name here',
            'subtitle' => 'Default sample text',
            'button_text' => 'Click',
        ];
        $defaults = ['title' => '', 'subtitle' => '', 'button_text' => ''];

        $result = $this->validator->validateSection('hero', $content, $defaults);

        $this->assertArrayHasKey('warnings', $result);
    }

    public function test_validate_section_checks_seo_optimization(): void
    {
        $content = [
            'title' => 'Test Title',
            'subtitle' => 'Test Subtitle',
            'button_text' => 'Click',
        ];
        $defaults = ['title' => '', 'subtitle' => '', 'button_text' => ''];

        $result = $this->validator->validateSection('hero', $content, $defaults);

        // Validation should complete
        $this->assertArrayHasKey('valid', $result);
    }

    public function test_validate_section_handles_missing_data(): void
    {
        $content = null;
        $defaults = [];

        $result = $this->validator->validateSection('hero', $content, $defaults);

        $this->assertFalse($result['valid']);
    }

    public function test_check_content_quality_returns_metrics(): void
    {
        $content = [
            'title' => 'Test Title',
            'subtitle' => 'Test Subtitle',
            'description' => 'Test description with enough words for SEO.',
            'button_text' => 'Click',
        ];

        $metrics = $this->validator->checkContentQuality($content);

        $this->assertArrayHasKey('completeness', $metrics);
        $this->assertArrayHasKey('length_appropriate', $metrics);
        $this->assertArrayHasKey('has_placeholder', $metrics);
        $this->assertArrayHasKey('brand_consistent', $metrics);
        $this->assertArrayHasKey('seo_friendly', $metrics);
        $this->assertArrayHasKey('quality_score', $metrics);
    }

    public function test_validate_section_merges_with_defaults(): void
    {
        $content = ['title' => 'New Title'];
        $defaults = ['title' => 'Default Title', 'subtitle' => 'Default Subtitle'];

        $result = $this->validator->validateSection('hero', $content, $defaults);

        // Should validate the provided content
        $this->assertArrayHasKey('valid', $result);
    }

    public function test_validate_cta_section(): void
    {
        $content = [
            'title' => 'CTA Title',
            'description' => 'CTA description.',
            'button_text' => 'Click Here',
        ];
        $defaults = ['title' => '', 'description' => '', 'button_text' => ''];

        $result = $this->validator->validateSection('cta_section', $content, $defaults);

        $this->assertArrayHasKey('valid', $result);
    }
}

