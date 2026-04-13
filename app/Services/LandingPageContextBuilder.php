<?php

namespace App\Services;

use App\Models\Store;

class LandingPageContextBuilder
{
    /**
     * Build comprehensive context from store data
     */
    public function buildStoreContext(Store $store): array
    {
        $industry = $store->industry ?? 'default';

        return [
            'store_name' => $store->name ?? '',
            'store_name_ar' => $store->name_ar ?? null,
            'store_name_en' => $store->name_en ?? null,
            'store_description' => $store->description ?? '',
            'industry' => $industry,
            'business_type' => $this->determineBusinessType($industry, $store->theme ?? 'default'),
            'target_audience' => $this->getTargetAudience($industry),
            'brand_color' => $store->color ?? null,
            'language' => $store->user->lang ?? 'en',
            'cultural_context' => $this->getCulturalContext($store->user->lang ?? 'en'),
            'unique_selling_points' => $this->extractUSPs($store->description ?? ''),
            'industry_insights' => $this->getIndustryInsights($industry),
            'brand_voice' => $this->getBrandVoice($industry, $store->description),
            'store_theme' => $store->theme ?? 'default',
        ];
    }

    /**
     * Get industry insights
     */
    public function getIndustryInsights(string $industry): array
    {
        $insights = [
            'fashion' => [
                'keywords' => ['style', 'trend', 'fashion', 'wardrobe', 'outfit', 'designer', 'quality'],
                'pain_points' => ['finding the right style', 'staying on trend', 'quality concerns'],
                'benefits' => ['express yourself', 'look confident', 'stay fashionable'],
            ],
            'electronics' => [
                'keywords' => ['technology', 'innovation', 'smart', 'reliable', 'cutting-edge', 'performance'],
                'pain_points' => ['outdated technology', 'reliability issues', 'complex setup'],
                'benefits' => ['stay current', 'improve efficiency', 'enhance lifestyle'],
            ],
            'beauty-cosmetics' => [
                'keywords' => ['beauty', 'glow', 'radiant', 'natural', 'skincare', 'confidence'],
                'pain_points' => ['skin concerns', 'finding right products', 'quality ingredients'],
                'benefits' => ['feel confident', 'look radiant', 'self-care'],
            ],
            'jewelry' => [
                'keywords' => ['elegant', 'luxury', 'timeless', 'craftsmanship', 'precious', 'sophisticated'],
                'pain_points' => ['authenticity concerns', 'quality verification', 'finding unique pieces'],
                'benefits' => ['express elegance', 'cherish forever', 'make statements'],
            ],
            'furniture-interior' => [
                'keywords' => ['comfort', 'style', 'home', 'design', 'quality', 'transformation'],
                'pain_points' => ['mismatched styles', 'quality concerns', 'space optimization'],
                'benefits' => ['create beautiful spaces', 'enhance comfort', 'express style'],
            ],
            'baby-kids' => [
                'keywords' => ['safe', 'quality', 'fun', 'comfort', 'development', 'care'],
                'pain_points' => ['safety concerns', 'quality verification', 'age-appropriate products'],
                'benefits' => ['peace of mind', 'happy children', 'quality assurance'],
            ],
            'cars-automotive' => [
                'keywords' => ['performance', 'reliable', 'quality', 'durable', 'innovation', 'expertise'],
                'pain_points' => ['reliability concerns', 'finding right parts', 'quality verification'],
                'benefits' => ['dependable performance', 'long-lasting', 'expert support'],
            ],
            'perfume-fragrances' => [
                'keywords' => ['luxury', 'elegant', 'sophisticated', 'unique', 'exclusive', 'scent'],
                'pain_points' => ['finding signature scent', 'quality concerns', 'authenticity'],
                'benefits' => ['express personality', 'feel luxurious', 'unique experience'],
            ],
            'watches' => [
                'keywords' => ['precision', 'elegant', 'craftsmanship', 'timeless', 'sophisticated', 'quality'],
                'pain_points' => ['authenticity concerns', 'quality verification', 'finding right style'],
                'benefits' => ['timeless elegance', 'reliable precision', 'make statements'],
            ],
            'default' => [
                'keywords' => ['quality', 'value', 'trust', 'excellence', 'customer service'],
                'pain_points' => ['quality concerns', 'finding right products', 'trust issues'],
                'benefits' => ['quality assurance', 'great value', 'trusted service'],
            ],
        ];

        return $insights[$industry] ?? $insights['default'];
    }

    /**
     * Get target audience based on industry
     */
    public function getTargetAudience(string $industry): string
    {
        $audiences = [
            'fashion' => 'fashion-conscious individuals who value style and self-expression',
            'electronics' => 'tech-savvy consumers seeking innovative and reliable technology solutions',
            'beauty-cosmetics' => 'beauty enthusiasts who prioritize quality ingredients and effective results',
            'jewelry' => 'individuals who appreciate elegance, craftsmanship, and timeless beauty',
            'furniture-interior' => 'homeowners and decorators looking to create beautiful and comfortable living spaces',
            'baby-kids' => 'parents who prioritize safety, quality, and child-friendly products',
            'cars-automotive' => 'vehicle owners and enthusiasts seeking reliable and quality automotive solutions',
            'perfume-fragrances' => 'sophisticated individuals who appreciate luxury scents and personal expression',
            'watches' => 'individuals who value precision, craftsmanship, and timeless elegance',
            'default' => 'quality-conscious consumers seeking value and excellent service',
        ];

        return $audiences[$industry] ?? $audiences['default'];
    }

    /**
     * Get brand voice based on industry and description
     */
    public function getBrandVoice(string $industry, ?string $description): string
    {
        $baseVoices = [
            'fashion' => 'stylish, confident, trend-forward, and empowering',
            'electronics' => 'innovative, reliable, tech-forward, and solution-oriented',
            'beauty-cosmetics' => 'caring, confident, transformative, and empowering',
            'jewelry' => 'elegant, sophisticated, timeless, and luxurious',
            'furniture-interior' => 'warm, inviting, stylish, and transformative',
            'baby-kids' => 'caring, safe, fun, and trustworthy',
            'cars-automotive' => 'reliable, performance-focused, expert, and trustworthy',
            'perfume-fragrances' => 'luxurious, sophisticated, elegant, and exclusive',
            'watches' => 'precise, elegant, sophisticated, and timeless',
            'default' => 'professional, trustworthy, customer-focused, and quality-oriented',
        ];

        $voice = $baseVoices[$industry] ?? $baseVoices['default'];

        // If description contains specific tone indicators, adjust voice
        if ($description) {
            $descriptionLower = strtolower($description);
            if (str_contains($descriptionLower, 'luxury') || str_contains($descriptionLower, 'premium')) {
                $voice .= ', premium';
            }
            if (str_contains($descriptionLower, 'affordable') || str_contains($descriptionLower, 'value')) {
                $voice .= ', accessible';
            }
        }

        return $voice;
    }

    /**
     * Extract unique selling points from description
     */
    public function extractUSPs(?string $description): array
    {
        if (empty($description)) {
            return [];
        }

        $usps = [];
        $descriptionLower = strtolower($description);

        // Common USP indicators
        $uspPatterns = [
            'quality' => ['quality', 'premium', 'high-quality', 'excellent quality'],
            'price' => ['affordable', 'best price', 'value', 'competitive'],
            'service' => ['customer service', 'support', 'help', 'assistance'],
            'selection' => ['wide selection', 'variety', 'extensive', 'range'],
            'shipping' => ['free shipping', 'fast delivery', 'quick shipping'],
            'warranty' => ['warranty', 'guarantee', 'protection', 'assurance'],
            'expertise' => ['expert', 'professional', 'specialized', 'knowledge'],
            'exclusive' => ['exclusive', 'unique', 'limited', 'special'],
        ];

        foreach ($uspPatterns as $uspType => $keywords) {
            foreach ($keywords as $keyword) {
                if (str_contains($descriptionLower, $keyword)) {
                    $usps[] = $uspType;
                    break;
                }
            }
        }

        return array_unique($usps);
    }

    /**
     * Get cultural context for language
     */
    public function getCulturalContext(string $langCode): array
    {
        $contexts = [
            'ar' => [
                'greeting_style' => 'warm and respectful',
                'communication_style' => 'formal yet friendly',
                'cultural_values' => 'hospitality, respect, tradition',
            ],
            'es' => [
                'greeting_style' => 'warm and enthusiastic',
                'communication_style' => 'friendly and expressive',
                'cultural_values' => 'passion, family, community',
            ],
            'fr' => [
                'greeting_style' => 'elegant and refined',
                'communication_style' => 'sophisticated and polite',
                'cultural_values' => 'elegance, quality, refinement',
            ],
            'de' => [
                'greeting_style' => 'direct and professional',
                'communication_style' => 'efficient and clear',
                'cultural_values' => 'precision, quality, efficiency',
            ],
            'ja' => [
                'greeting_style' => 'polite and respectful',
                'communication_style' => 'formal and considerate',
                'cultural_values' => 'respect, quality, harmony',
            ],
            'zh' => [
                'greeting_style' => 'respectful and warm',
                'communication_style' => 'polite and considerate',
                'cultural_values' => 'respect, harmony, tradition',
            ],
            'default' => [
                'greeting_style' => 'friendly and professional',
                'communication_style' => 'clear and engaging',
                'cultural_values' => 'quality, service, trust',
            ],
        ];

        return $contexts[$langCode] ?? $contexts['default'];
    }

    /**
     * Determine business type from industry and theme
     */
    private function determineBusinessType(string $industry, string $theme): string
    {
        if ($industry && $industry !== 'default') {
            return $industry;
        }

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
            default => 'general e-commerce store',
        };
    }
}

