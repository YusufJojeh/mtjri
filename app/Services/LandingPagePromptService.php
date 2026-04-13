<?php

namespace App\Services;

use App\Models\Store;

class LandingPagePromptService
{
    protected LandingPageContextBuilder $contextBuilder;
    protected LandingPagePromptTemplates $templates;

    public function __construct(
        LandingPageContextBuilder $contextBuilder,
        LandingPagePromptTemplates $templates
    ) {
        $this->contextBuilder = $contextBuilder;
        $this->templates = $templates;
    }

    /**
     * Build hero section prompt
     */
    public function buildHeroPrompt(Store $store, array $defaults): string
    {
        return $this->buildSectionPrompt('hero', $store, $defaults);
    }

    /**
     * Build features section prompt
     */
    public function buildFeaturesPrompt(Store $store, array $defaults): string
    {
        return $this->buildSectionPrompt('features', $store, $defaults);
    }

    /**
     * Build about section prompt
     */
    public function buildAboutPrompt(Store $store, array $defaults): string
    {
        return $this->buildSectionPrompt('about', $store, $defaults);
    }

    /**
     * Build CTA section prompt
     */
    public function buildCTAPrompt(Store $store, array $defaults): string
    {
        return $this->buildSectionPrompt('cta_section', $store, $defaults);
    }

    /**
     * Build prompt for any section
     */
    public function buildSectionPrompt(string $section, Store $store, array $defaults): string
    {
        $template = LandingPagePromptTemplates::getTemplate($section);
        if (!$template) {
            throw new \InvalidArgumentException("Template not found for section: {$section}");
        }

        $context = $this->contextBuilder->buildStoreContext($store);
        $industry = $context['industry'];
        $industryGuidelines = LandingPagePromptTemplates::getIndustryGuidelines($section, $industry);
        $qualityGuidelines = LandingPagePromptTemplates::getQualityGuidelines($section);
        $examples = LandingPagePromptTemplates::getExamples($section, $industry);

        // Build the prompt
        $prompt = $this->buildPromptStructure(
            $template['base_prompt'],
            $section,
            $context,
            $industryGuidelines,
            $qualityGuidelines,
            $examples,
            $defaults
        );

        return $prompt;
    }

    /**
     * Build complete prompt structure
     */
    private function buildPromptStructure(
        string $basePrompt,
        string $section,
        array $context,
        string $industryGuidelines,
        array $qualityGuidelines,
        array $examples,
        array $defaults
    ): string {
        $language = $context['language'];
        $langInstruction = $language !== 'en'
            ? "Provide response in {$this->getLanguageName($language)} language. "
            : "";

        $prompt = "{$basePrompt}\n\n";
        $prompt .= "CONTEXT:\n";
        $prompt .= "- Store Name: {$context['store_name']}\n";

        if (!empty($context['store_description'])) {
            $prompt .= "- Business Description: {$context['store_description']}\n";
        }

        $prompt .= "- Industry: {$context['industry']}\n";
        $prompt .= "- Business Type: {$context['business_type']}\n";
        $prompt .= "- Target Audience: {$context['target_audience']}\n";

        if ($context['brand_color']) {
            $prompt .= "- Brand Color: {$context['brand_color']}\n";
        }

        $prompt .= "- Language: {$language}\n";

        if (!empty($context['unique_selling_points'])) {
            $prompt .= "- Unique Selling Points: " . implode(', ', $context['unique_selling_points']) . "\n";
        }

        $prompt .= "\nTASK:\n";
        $prompt .= "Generate a high-converting {$section} section for this {$context['industry']} e-commerce store.\n";
        $prompt .= $langInstruction;

        // Add section-specific requirements
        $prompt .= "\nREQUIREMENTS:\n";
        $prompt .= $this->buildSectionRequirements($section, $qualityGuidelines, $context);

        // Add industry-specific guidelines
        if ($industryGuidelines) {
            $prompt .= "\nINDUSTRY-SPECIFIC GUIDELINES:\n";
            $prompt .= "{$industryGuidelines}\n";
        }

        // Add SEO guidelines
        $prompt .= "\nSEO OPTIMIZATION:\n";
        $prompt .= "- Include relevant keywords naturally: " . implode(', ', $context['industry_insights']['keywords'] ?? []) . "\n";
        $prompt .= "- Make content search-friendly and engaging\n";
        $prompt .= "- Use language that addresses customer pain points: " . implode(', ', $context['industry_insights']['pain_points'] ?? []) . "\n";

        // Add examples if available
        if (!empty($examples)) {
            $prompt .= "\nEXAMPLES:\n";
            $prompt .= json_encode($examples, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
        }

        // Add output format
        $prompt .= "\nOUTPUT FORMAT:\n";
        $prompt .= "The output MUST be a valid JSON object matching this structure exactly:\n";
        $prompt .= json_encode($defaults, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";

        // Add quality requirements
        $prompt .= "\nQUALITY REQUIREMENTS:\n";
        foreach ($qualityGuidelines as $key => $value) {
            $prompt .= "- {$key}: {$value}\n";
        }

        // Add brand voice
        $prompt .= "\nBRAND VOICE:\n";
        $prompt .= "The content should reflect: {$context['brand_voice']}\n";

        // Final instruction
        $prompt .= "\nIMPORTANT:\n";
        $prompt .= "Create original, creative content specifically for this business. ";
        $prompt .= "DO NOT just return the default values provided in the structure. ";
        $prompt .= "Make the content unique, engaging, and conversion-focused. ";
        $prompt .= "Ensure all text is in {$this->getLanguageName($language)} language.";

        return $prompt;
    }

    /**
     * Build section-specific requirements
     */
    private function buildSectionRequirements(string $section, array $qualityGuidelines, array $context): string
    {
        $requirements = [];

        switch ($section) {
            case 'hero':
                $requirements[] = "1. Title: {$qualityGuidelines['title_length']}, catchy, brand-focused";
                if (isset($context['store_name'])) {
                    $requirements[] = "   - Consider including store name if it enhances the message";
                }
                $requirements[] = "2. Subtitle: {$qualityGuidelines['subtitle_length']}, value proposition";
                $requirements[] = "   - Address target audience pain points: " . implode(', ', $context['industry_insights']['pain_points'] ?? []);
                $requirements[] = "3. Description: {$qualityGuidelines['description_length']}, highlighting key benefits";
                $requirements[] = "   - Emphasize benefits: " . implode(', ', $context['industry_insights']['benefits'] ?? []);
                $requirements[] = "4. CTA Button: {$qualityGuidelines['cta_action']} text (e.g., 'Shop Now', 'Discover More', 'Get Started')";
                if (isset($qualityGuidelines['badge_text'])) {
                    $requirements[] = "5. Badge Text: {$qualityGuidelines['badge_text']}";
                }
                break;

            case 'features':
                $requirements[] = "1. Provide {$qualityGuidelines['feature_count']} unique selling points";
                $requirements[] = "2. Each feature should have:";
                $requirements[] = "   - Title: {$qualityGuidelines['title_length']}";
                $requirements[] = "   - Description: {$qualityGuidelines['description_length']}";
                $requirements[] = "3. Focus on: {$qualityGuidelines['focus']}";
                $requirements[] = "4. Make features relevant to: {$context['target_audience']}";
                break;

            case 'about':
                $requirements[] = "1. Write {$qualityGuidelines['length']} compelling brand story";
                $requirements[] = "2. Focus on: {$qualityGuidelines['focus']}";
                $requirements[] = "3. Tone: {$qualityGuidelines['tone']}";
                $requirements[] = "4. Connect with: {$context['target_audience']}";
                break;

            case 'cta_section':
                $requirements[] = "1. Title: {$qualityGuidelines['title_length']}, compelling and conversion-focused";
                $requirements[] = "2. Description: {$qualityGuidelines['description_length']}, persuasive";
                $requirements[] = "3. Button Text: {$qualityGuidelines['button_text']}";
                $requirements[] = "4. Focus: {$qualityGuidelines['focus']}";
                break;

            case 'featured_products':
            case 'trending_products':
            case 'categories':
                $requirements[] = "1. Title: {$qualityGuidelines['title_length']}, engaging";
                $requirements[] = "2. Description: {$qualityGuidelines['description_length']}";
                $requirements[] = "3. Focus: {$qualityGuidelines['focus']}";
                $requirements[] = "4. Make it relevant to: {$context['business_type']}";
                break;

            case 'newsletter':
                $requirements[] = "1. Title: {$qualityGuidelines['title_length']}, compelling headline";
                $requirements[] = "2. Subtitle: {$qualityGuidelines['subtitle_length']}";
                $requirements[] = "3. Focus: {$qualityGuidelines['focus']}";
                break;

            default:
                $requirements[] = "Generate high-quality, conversion-focused content for this section.";
        }

        return implode("\n", $requirements);
    }

    /**
     * Get human-readable language name
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
            default => 'English',
        };
    }
}

