<?php

namespace App\Services;

class LandingPagePromptTemplates
{
    /**
     * Get templates for all sections
     */
    public static function getTemplates(): array
    {
        return [
            'hero' => self::getHeroTemplate(),
            'features' => self::getFeaturesTemplate(),
            'about' => self::getAboutTemplate(),
            'cta_section' => self::getCTATemplate(),
            'featured_products' => self::getFeaturedProductsTemplate(),
            'trending_products' => self::getTrendingProductsTemplate(),
            'categories' => self::getCategoriesTemplate(),
            'newsletter' => self::getNewsletterTemplate(),
        ];
    }

    /**
     * Get template for a specific section
     */
    public static function getTemplate(string $section): ?array
    {
        $templates = self::getTemplates();
        return $templates[$section] ?? null;
    }

    /**
     * Hero section template
     */
    private static function getHeroTemplate(): array
    {
        return [
            'base_prompt' => 'You are an expert e-commerce copywriter specializing in creating high-converting landing page content.',
            'industry_specific' => [
                'fashion' => 'Focus on style, trends, personal expression, and fashion-forward designs. Emphasize elegance, quality, and the latest fashion trends.',
                'electronics' => 'Emphasize technology, innovation, cutting-edge features, and reliability. Highlight product specifications and modern solutions.',
                'beauty-cosmetics' => 'Focus on beauty, self-care, confidence, and quality ingredients. Emphasize transformation and personal care.',
                'jewelry' => 'Emphasize elegance, craftsmanship, luxury, and timeless beauty. Highlight quality materials and exquisite designs.',
                'furniture-interior' => 'Focus on comfort, style, home transformation, and quality craftsmanship. Emphasize creating beautiful living spaces.',
                'baby-kids' => 'Emphasize safety, quality, fun, and child-friendly products. Highlight care, comfort, and developmental benefits.',
                'cars-automotive' => 'Focus on performance, reliability, innovation, and quality. Emphasize technical excellence and durability.',
                'perfume-fragrances' => 'Emphasize luxury, elegance, unique scents, and sophistication. Highlight sensory experiences and exclusivity.',
                'watches' => 'Focus on precision, craftsmanship, style, and timeless elegance. Emphasize quality and sophistication.',
                'default' => 'Focus on quality, value, customer satisfaction, and unique offerings. Emphasize benefits and trust.',
            ],
            'quality_guidelines' => [
                'title_length' => '3-8 words',
                'subtitle_length' => '1 sentence',
                'description_length' => '2-3 sentences',
                'cta_action' => 'actionable and urgent',
                'badge_text' => 'short, catchy (1-3 words)',
            ],
            'examples' => [
                'fashion' => [
                    'title' => 'Discover Your Style',
                    'subtitle' => 'Curated fashion pieces that express your unique personality',
                    'description' => 'Shop our exclusive collection of trendy and timeless fashion. From casual essentials to statement pieces, find everything you need to build your perfect wardrobe.',
                ],
                'electronics' => [
                    'title' => 'Innovation Meets Excellence',
                    'subtitle' => 'Cutting-edge technology for modern living',
                    'description' => 'Explore our range of premium electronics designed to enhance your daily life. Experience the latest innovations with products you can trust.',
                ],
            ],
        ];
    }

    /**
     * Features section template
     */
    private static function getFeaturesTemplate(): array
    {
        return [
            'base_prompt' => 'You are an expert at identifying and articulating unique selling points (USPs) for e-commerce businesses.',
            'industry_specific' => [
                'fashion' => 'Focus on style variety, quality materials, trend updates, and customer service. Emphasize fashion expertise and personal styling.',
                'electronics' => 'Emphasize technical support, warranty, latest technology, and product reliability. Highlight innovation and customer service.',
                'beauty-cosmetics' => 'Focus on natural ingredients, expert recommendations, beauty tips, and product effectiveness. Emphasize customer care.',
                'jewelry' => 'Emphasize craftsmanship, authenticity, certification, and customization. Highlight quality and customer service.',
                'default' => 'Focus on quality, customer service, value, and unique benefits. Emphasize trust and reliability.',
            ],
            'quality_guidelines' => [
                'feature_count' => '3-6 features',
                'title_length' => 'short, catchy (2-5 words)',
                'description_length' => '1 sentence',
                'focus' => 'benefits over features',
            ],
            'examples' => [
                'fashion' => [
                    ['title' => 'Trending Styles', 'description' => 'Stay ahead with the latest fashion trends curated by our style experts.'],
                    ['title' => 'Quality Guaranteed', 'description' => 'Premium materials and craftsmanship in every piece we offer.'],
                ],
            ],
        ];
    }

    /**
     * About section template
     */
    private static function getAboutTemplate(): array
    {
        return [
            'base_prompt' => 'You are an expert storyteller specializing in brand narratives that build trust and connect with customers.',
            'industry_specific' => [
                'fashion' => 'Focus on fashion passion, style expertise, customer empowerment, and trend awareness. Emphasize helping customers express themselves.',
                'electronics' => 'Emphasize technological expertise, innovation commitment, and customer support. Highlight knowledge and reliability.',
                'beauty-cosmetics' => 'Focus on beauty expertise, ingredient knowledge, and customer transformation. Emphasize care and results.',
                'jewelry' => 'Emphasize craftsmanship tradition, quality commitment, and creating meaningful pieces. Highlight heritage and excellence.',
                'default' => 'Focus on business values, customer commitment, and unique approach. Emphasize trust and quality.',
            ],
            'quality_guidelines' => [
                'length' => '3-5 sentences',
                'focus' => 'passion, values, uniqueness, trust',
                'tone' => 'authentic and engaging',
            ],
            'examples' => [
                'fashion' => 'We are passionate about fashion and believe everyone deserves to express their unique style. With years of experience in curating quality pieces, we bring you the latest trends and timeless classics. Our commitment is to help you build a wardrobe that reflects your personality and makes you feel confident every day.',
            ],
        ];
    }

    /**
     * CTA section template
     */
    private static function getCTATemplate(): array
    {
        return [
            'base_prompt' => 'You are an expert at creating compelling call-to-action content that drives conversions.',
            'industry_specific' => [
                'fashion' => 'Focus on style discovery, exclusive collections, and fashion inspiration. Create urgency around new arrivals.',
                'electronics' => 'Emphasize technology upgrades, innovation access, and staying current. Highlight product availability.',
                'beauty-cosmetics' => 'Focus on beauty transformation, self-care journey, and exclusive offers. Emphasize results.',
                'jewelry' => 'Emphasize elegance, special occasions, and timeless pieces. Create exclusivity and luxury appeal.',
                'default' => 'Focus on value, quality, and customer benefits. Create urgency and exclusivity.',
            ],
            'quality_guidelines' => [
                'title_length' => 'strong, compelling (4-8 words)',
                'description_length' => '1-2 sentences',
                'button_text' => 'clear, inviting, action-oriented',
                'focus' => 'urgency or exclusivity',
            ],
            'examples' => [
                'fashion' => [
                    'title' => 'Start Your Style Journey Today',
                    'description' => 'Join thousands of fashion lovers and discover pieces that define your unique style.',
                    'button_text' => 'Shop Now',
                ],
            ],
        ];
    }

    /**
     * Featured products section template
     */
    private static function getFeaturedProductsTemplate(): array
    {
        return [
            'base_prompt' => 'You are an expert at creating engaging product section content that encourages browsing and discovery.',
            'industry_specific' => [
                'fashion' => 'Focus on curated collections, style inspiration, and must-have pieces. Emphasize fashion-forward selections.',
                'electronics' => 'Emphasize top-rated products, latest technology, and customer favorites. Highlight innovation.',
                'default' => 'Focus on quality selections, customer favorites, and handpicked items. Emphasize value.',
            ],
            'quality_guidelines' => [
                'title_length' => 'engaging, descriptive (3-6 words)',
                'description_length' => '1-2 sentences',
                'focus' => 'encouraging browsing',
            ],
        ];
    }

    /**
     * Trending products section template
     */
    private static function getTrendingProductsTemplate(): array
    {
        return [
            'base_prompt' => 'You are an expert at creating content that highlights trending and popular products.',
            'industry_specific' => [
                'fashion' => 'Focus on current trends, popular styles, and what\'s hot right now. Emphasize trend awareness.',
                'electronics' => 'Emphasize latest releases, popular tech, and innovative products. Highlight cutting-edge technology.',
                'default' => 'Focus on popular items, customer favorites, and trending products. Emphasize popularity.',
            ],
            'quality_guidelines' => [
                'title_length' => 'catchy, trend-focused (3-6 words)',
                'description_length' => '1-2 sentences',
                'focus' => 'trending and popular',
            ],
        ];
    }

    /**
     * Categories section template
     */
    private static function getCategoriesTemplate(): array
    {
        return [
            'base_prompt' => 'You are an expert at creating category browsing content that helps customers navigate and discover products.',
            'industry_specific' => [
                'fashion' => 'Focus on style categories, fashion types, and shopping by occasion. Emphasize style exploration.',
                'electronics' => 'Emphasize product categories, technology types, and shopping by function. Highlight organization.',
                'default' => 'Focus on product organization, easy navigation, and category discovery. Emphasize convenience.',
            ],
            'quality_guidelines' => [
                'title_length' => 'clear, descriptive (3-6 words)',
                'description_length' => '1-2 sentences',
                'focus' => 'navigation and discovery',
            ],
        ];
    }

    /**
     * Newsletter section template
     */
    private static function getNewsletterTemplate(): array
    {
        return [
            'base_prompt' => 'You are an expert at creating compelling newsletter signup content that encourages subscriptions.',
            'industry_specific' => [
                'fashion' => 'Focus on style tips, trend alerts, exclusive fashion offers, and style inspiration. Emphasize fashion community.',
                'electronics' => 'Emphasize tech updates, product launches, exclusive deals, and technology insights. Highlight innovation news.',
                'beauty-cosmetics' => 'Focus on beauty tips, product launches, exclusive offers, and self-care advice. Emphasize beauty community.',
                'default' => 'Focus on exclusive offers, tips, updates, and community benefits. Emphasize value.',
            ],
            'quality_guidelines' => [
                'title_length' => 'compelling headline (4-8 words)',
                'subtitle_length' => '1 sentence',
                'focus' => 'exclusive offers, tips, or community',
            ],
        ];
    }

    /**
     * Get industry-specific guidelines for a section
     */
    public static function getIndustryGuidelines(string $section, string $industry): string
    {
        $template = self::getTemplate($section);
        if (!$template) {
            return '';
        }

        return $template['industry_specific'][$industry]
            ?? $template['industry_specific']['default']
            ?? '';
    }

    /**
     * Get quality guidelines for a section
     */
    public static function getQualityGuidelines(string $section): array
    {
        $template = self::getTemplate($section);
        return $template['quality_guidelines'] ?? [];
    }

    /**
     * Get examples for a section and industry
     */
    public static function getExamples(string $section, string $industry): array
    {
        $template = self::getTemplate($section);
        if (!$template) {
            return [];
        }

        return $template['examples'][$industry] ?? $template['examples']['default'] ?? [];
    }
}

