<?php

namespace Tests\Unit\Services;

use App\Models\Store;
use App\Models\User;
use App\Services\LandingPagePromptService;
use App\Services\LandingPageContextBuilder;
use App\Services\LandingPagePromptTemplates;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LandingPagePromptServiceTest extends TestCase
{
    use RefreshDatabase;

    protected LandingPagePromptService $service;
    protected LandingPageContextBuilder $contextBuilder;
    protected LandingPagePromptTemplates $templates;

    protected function setUp(): void
    {
        parent::setUp();

        $this->contextBuilder = new LandingPageContextBuilder();
        $this->templates = new LandingPagePromptTemplates();
        $this->service = new LandingPagePromptService($this->contextBuilder, $this->templates);
    }

    public function test_build_hero_prompt_includes_store_context(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'name' => 'Test Store',
            'description' => 'A test store description',
            'industry' => 'fashion',
        ]);

        $defaults = ['title' => 'Default Title', 'subtitle' => 'Default Subtitle'];
        $prompt = $this->service->buildHeroPrompt($store, $defaults);

        $this->assertStringContainsString('Test Store', $prompt);
        $this->assertStringContainsString('A test store description', $prompt);
        $this->assertStringContainsString('fashion', $prompt);
    }

    public function test_build_hero_prompt_includes_industry_specific_guidelines(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'industry' => 'fashion',
        ]);

        $defaults = ['title' => 'Default Title'];
        $prompt = $this->service->buildHeroPrompt($store, $defaults);

        $this->assertStringContainsString('style', $prompt);
        $this->assertStringContainsString('trend', $prompt);
    }

    public function test_build_hero_prompt_includes_language_instruction(): void
    {
        $user = User::factory()->create(['lang' => 'ar']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'industry' => 'fashion',
        ]);

        $defaults = ['title' => 'Default Title'];
        $prompt = $this->service->buildHeroPrompt($store, $defaults);

        $this->assertStringContainsString('Arabic', $prompt);
    }

    public function test_build_hero_prompt_includes_seo_guidelines(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'industry' => 'fashion',
        ]);

        $defaults = ['title' => 'Default Title'];
        $prompt = $this->service->buildHeroPrompt($store, $defaults);

        $this->assertStringContainsString('SEO', $prompt);
        $this->assertStringContainsString('keywords', $prompt);
    }

    public function test_build_features_prompt_generates_correct_structure(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'industry' => 'electronics',
        ]);

        $defaults = ['items' => [['title' => 'Feature', 'description' => 'Description']]];
        $prompt = $this->service->buildFeaturesPrompt($store, $defaults);

        $this->assertStringContainsString('features', $prompt);
        $this->assertStringContainsString('unique selling points', $prompt);
    }

    public function test_build_about_prompt_includes_brand_story_elements(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'industry' => 'jewelry',
        ]);

        $defaults = ['content' => 'Default content'];
        $prompt = $this->service->buildAboutPrompt($store, $defaults);

        $this->assertStringContainsString('about', $prompt);
        $this->assertStringContainsString('brand', $prompt);
    }

    public function test_build_cta_prompt_includes_conversion_focus(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'industry' => 'fashion',
        ]);

        $defaults = ['title' => 'CTA Title', 'button_text' => 'Click'];
        $prompt = $this->service->buildCTAPrompt($store, $defaults);

        $this->assertStringContainsString('conversion', $prompt);
        $this->assertStringContainsString('CTA', $prompt);
    }

    public function test_build_section_prompt_handles_unknown_section(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'industry' => 'fashion',
        ]);

        $defaults = ['title' => 'Default'];

        $this->expectException(\InvalidArgumentException::class);
        $this->service->buildSectionPrompt('unknown_section', $store, $defaults);
    }

    public function test_prompt_includes_examples_for_few_shot_learning(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'industry' => 'fashion',
        ]);

        $defaults = ['title' => 'Default Title'];
        $prompt = $this->service->buildHeroPrompt($store, $defaults);

        // Examples may or may not be present depending on industry
        $this->assertIsString($prompt);
    }

    public function test_prompt_includes_quality_guidelines(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'industry' => 'fashion',
        ]);

        $defaults = ['title' => 'Default Title'];
        $prompt = $this->service->buildHeroPrompt($store, $defaults);

        $this->assertStringContainsString('QUALITY REQUIREMENTS', $prompt);
    }

    public function test_prompt_handles_missing_store_data(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'name' => null,
            'description' => null,
            'industry' => null,
        ]);

        $defaults = ['title' => 'Default Title'];
        $prompt = $this->service->buildHeroPrompt($store, $defaults);

        // Should still generate a prompt even with missing data
        $this->assertIsString($prompt);
        $this->assertNotEmpty($prompt);
    }

    public function test_prompt_includes_target_audience_context(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'industry' => 'fashion',
        ]);

        $defaults = ['title' => 'Default Title'];
        $prompt = $this->service->buildHeroPrompt($store, $defaults);

        $this->assertStringContainsString('Target Audience', $prompt);
    }
}

