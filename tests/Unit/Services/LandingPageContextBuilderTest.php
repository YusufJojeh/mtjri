<?php

namespace Tests\Unit\Services;

use App\Models\Store;
use App\Models\User;
use App\Services\LandingPageContextBuilder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LandingPageContextBuilderTest extends TestCase
{
    use RefreshDatabase;

    protected LandingPageContextBuilder $builder;

    protected function setUp(): void
    {
        parent::setUp();
        $this->builder = new LandingPageContextBuilder();
    }

    public function test_build_store_context_includes_all_fields(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'name' => 'Test Store',
            'description' => 'Test Description',
            'industry' => 'fashion',
            'color' => '#3b82f6',
        ]);

        $context = $this->builder->buildStoreContext($store);

        $this->assertArrayHasKey('store_name', $context);
        $this->assertArrayHasKey('store_description', $context);
        $this->assertArrayHasKey('industry', $context);
        $this->assertArrayHasKey('business_type', $context);
        $this->assertArrayHasKey('target_audience', $context);
        $this->assertArrayHasKey('brand_color', $context);
        $this->assertArrayHasKey('language', $context);
        $this->assertArrayHasKey('cultural_context', $context);
        $this->assertArrayHasKey('unique_selling_points', $context);
        $this->assertArrayHasKey('industry_insights', $context);
        $this->assertArrayHasKey('brand_voice', $context);
    }

    public function test_build_store_context_handles_missing_data(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'name' => null,
            'description' => null,
            'industry' => null,
        ]);

        $context = $this->builder->buildStoreContext($store);

        $this->assertIsArray($context);
        $this->assertArrayHasKey('store_name', $context);
    }

    public function test_get_industry_insights_returns_relevant_data(): void
    {
        $insights = $this->builder->getIndustryInsights('fashion');

        $this->assertIsArray($insights);
        $this->assertArrayHasKey('keywords', $insights);
        $this->assertArrayHasKey('pain_points', $insights);
        $this->assertArrayHasKey('benefits', $insights);
        $this->assertContains('style', $insights['keywords']);
    }

    public function test_get_target_audience_matches_industry(): void
    {
        $audience = $this->builder->getTargetAudience('fashion');

        $this->assertIsString($audience);
        $this->assertStringContainsString('fashion', $audience);
    }

    public function test_get_brand_voice_reflects_industry(): void
    {
        $voice = $this->builder->getBrandVoice('fashion', 'A fashion store');

        $this->assertIsString($voice);
        $this->assertStringContainsString('style', $voice);
    }

    public function test_context_includes_cultural_adaptations(): void
    {
        $user = User::factory()->create(['lang' => 'ar']);
        $store = Store::factory()->create(['user_id' => $user->id]);

        $context = $this->builder->buildStoreContext($store);

        $this->assertArrayHasKey('cultural_context', $context);
        $this->assertIsArray($context['cultural_context']);
        $this->assertArrayHasKey('greeting_style', $context['cultural_context']);
    }

    public function test_context_includes_unique_selling_points(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'description' => 'We offer quality products with free shipping and excellent customer service',
        ]);

        $context = $this->builder->buildStoreContext($store);

        $this->assertArrayHasKey('unique_selling_points', $context);
        $this->assertIsArray($context['unique_selling_points']);
    }

    public function test_context_builder_handles_empty_store(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'name' => '',
            'description' => '',
        ]);

        $context = $this->builder->buildStoreContext($store);

        $this->assertIsArray($context);
    }

    public function test_context_includes_store_branding_elements(): void
    {
        $user = User::factory()->create(['lang' => 'en']);
        $store = Store::factory()->create([
            'user_id' => $user->id,
            'color' => '#ff0000',
        ]);

        $context = $this->builder->buildStoreContext($store);

        $this->assertEquals('#ff0000', $context['brand_color']);
    }

    public function test_context_includes_language_preferences(): void
    {
        $user = User::factory()->create(['lang' => 'fr']);
        $store = Store::factory()->create(['user_id' => $user->id]);

        $context = $this->builder->buildStoreContext($store);

        $this->assertEquals('fr', $context['language']);
    }

    public function test_get_industry_insights_handles_unknown_industry(): void
    {
        $insights = $this->builder->getIndustryInsights('unknown_industry');

        $this->assertIsArray($insights);
        $this->assertArrayHasKey('keywords', $insights);
    }
}

