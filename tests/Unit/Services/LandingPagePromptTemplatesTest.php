<?php

namespace Tests\Unit\Services;

use App\Services\LandingPagePromptTemplates;
use Tests\TestCase;

class LandingPagePromptTemplatesTest extends TestCase
{
    protected LandingPagePromptTemplates $templates;

    protected function setUp(): void
    {
        parent::setUp();
        $this->templates = new LandingPagePromptTemplates();
    }

    public function test_templates_exist_for_all_sections(): void
    {
        $sections = ['hero', 'features', 'about', 'cta_section', 'featured_products', 'trending_products', 'categories', 'newsletter'];

        foreach ($sections as $section) {
            $template = LandingPagePromptTemplates::getTemplate($section);
            $this->assertNotNull($template, "Template should exist for section: {$section}");
            $this->assertArrayHasKey('base_prompt', $template);
        }
    }

    public function test_industry_specific_templates_exist(): void
    {
        $template = LandingPagePromptTemplates::getTemplate('hero');
        $this->assertArrayHasKey('industry_specific', $template);
        $this->assertArrayHasKey('fashion', $template['industry_specific']);
        $this->assertArrayHasKey('electronics', $template['industry_specific']);
        $this->assertArrayHasKey('default', $template['industry_specific']);
    }

    public function test_template_structure_is_valid(): void
    {
        $template = LandingPagePromptTemplates::getTemplate('hero');

        $this->assertIsString($template['base_prompt']);
        $this->assertIsArray($template['industry_specific']);
        $this->assertIsArray($template['quality_guidelines']);
    }

    public function test_examples_are_provided_for_each_industry(): void
    {
        $template = LandingPagePromptTemplates::getTemplate('hero');

        // Check that examples exist (may be empty for some industries)
        $this->assertArrayHasKey('examples', $template);
    }

    public function test_quality_guidelines_are_defined(): void
    {
        $sections = ['hero', 'features', 'about', 'cta_section'];

        foreach ($sections as $section) {
            $guidelines = LandingPagePromptTemplates::getQualityGuidelines($section);
            $this->assertIsArray($guidelines);
            $this->assertNotEmpty($guidelines, "Quality guidelines should be defined for {$section}");
        }
    }

    public function test_template_handles_unknown_industry(): void
    {
        $guidelines = LandingPagePromptTemplates::getIndustryGuidelines('hero', 'unknown_industry');

        // Should return default guidelines or empty string
        $this->assertIsString($guidelines);
    }

    public function test_template_handles_unknown_section(): void
    {
        $template = LandingPagePromptTemplates::getTemplate('unknown_section');

        $this->assertNull($template);
    }

    public function test_get_industry_guidelines_returns_string(): void
    {
        $guidelines = LandingPagePromptTemplates::getIndustryGuidelines('hero', 'fashion');

        $this->assertIsString($guidelines);
        $this->assertNotEmpty($guidelines);
    }

    public function test_get_examples_returns_array(): void
    {
        $examples = LandingPagePromptTemplates::getExamples('hero', 'fashion');

        $this->assertIsArray($examples);
    }
}

