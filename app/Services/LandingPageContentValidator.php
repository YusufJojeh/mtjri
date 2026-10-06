<?php

namespace App\Services;

class LandingPageContentValidator
{
    /**
     * Validate a section's content
     */
    public function validateSection(string $section, mixed $content, array $defaults): array
    {
        $errors = [];
        $warnings = [];

        // Check if content is array
        if (!is_array($content)) {
            return [
                'valid' => false,
                'errors' => ['Content must be an array'],
                'warnings' => [],
            ];
        }

        // Check for placeholder text
        $placeholderText = $this->detectPlaceholderText($content);
        if (!empty($placeholderText)) {
            $warnings[] = "Potential placeholder text detected: " . implode(', ', $placeholderText);
        }

        // Section-specific validation
        switch ($section) {
            case 'hero':
                $heroValidation = $this->validateHero($content, $defaults);
                $errors = array_merge($errors, $heroValidation['errors']);
                $warnings = array_merge($warnings, $heroValidation['warnings']);
                break;

            case 'features':
                $featuresValidation = $this->validateFeatures($content, $defaults);
                $errors = array_merge($errors, $featuresValidation['errors']);
                $warnings = array_merge($warnings, $featuresValidation['warnings']);
                break;

            case 'about':
                $aboutValidation = $this->validateAbout($content, $defaults);
                $errors = array_merge($errors, $aboutValidation['errors']);
                $warnings = array_merge($warnings, $aboutValidation['warnings']);
                break;

            case 'cta_section':
                $ctaValidation = $this->validateCTA($content, $defaults);
                $errors = array_merge($errors, $ctaValidation['errors']);
                $warnings = array_merge($warnings, $ctaValidation['warnings']);
                break;

            default:
                // Generic validation for other sections
                $genericValidation = $this->validateGeneric($content, $defaults);
                $errors = array_merge($errors, $genericValidation['errors']);
                $warnings = array_merge($warnings, $genericValidation['warnings']);
        }

        // Check brand consistency
        $consistencyCheck = $this->checkBrandConsistency($content);
        if (!$consistencyCheck['consistent']) {
            $warnings[] = $consistencyCheck['message'];
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'warnings' => $warnings,
        ];
    }

    /**
     * Validate hero section
     */
    public function validateHero(array $content, array $defaults): array
    {
        $errors = [];
        $warnings = [];

        // Required fields
        $requiredFields = ['title', 'subtitle', 'button_text'];
        foreach ($requiredFields as $field) {
            if (!isset($content[$field]) || empty(trim($content[$field]))) {
                $errors[] = "Required field '{$field}' is missing or empty";
            }
        }

        // Check title length (3-8 words)
        if (isset($content['title'])) {
            $wordCount = str_word_count($content['title']);
            if ($wordCount < 3 || $wordCount > 8) {
                $warnings[] = "Title should be 3-8 words (current: {$wordCount} words)";
            }
        }

        // Check subtitle length (should be 1 sentence)
        if (isset($content['subtitle'])) {
            $sentenceCount = substr_count($content['subtitle'], '.') + substr_count($content['subtitle'], '!') + substr_count($content['subtitle'], '?');
            if ($sentenceCount > 1) {
                $warnings[] = "Subtitle should be 1 sentence (current: {$sentenceCount} sentences)";
            }
        }

        // Check description length (2-3 sentences)
        if (isset($content['description'])) {
            $sentenceCount = substr_count($content['description'], '.') + substr_count($content['description'], '!') + substr_count($content['description'], '?');
            if ($sentenceCount < 2 || $sentenceCount > 3) {
                $warnings[] = "Description should be 2-3 sentences (current: {$sentenceCount} sentences)";
            }
        }

        return ['errors' => $errors, 'warnings' => $warnings];
    }

    /**
     * Validate features section
     */
    public function validateFeatures(array $content, array $defaults): array
    {
        $errors = [];
        $warnings = [];

        // Check if items exist
        if (!isset($content['items']) || !is_array($content['items'])) {
            $errors[] = "Features section must have 'items' array";
            return ['errors' => $errors, 'warnings' => $warnings];
        }

        // Check item count (3-6 features)
        $itemCount = count($content['items']);
        if ($itemCount < 3 || $itemCount > 6) {
            $warnings[] = "Features should be 3-6 items (current: {$itemCount} items)";
        }

        // Validate each feature
        foreach ($content['items'] as $index => $item) {
            if (!is_array($item)) {
                $errors[] = "Feature item {$index} must be an array";
                continue;
            }

            if (!isset($item['title']) || empty(trim($item['title']))) {
                $errors[] = "Feature item {$index} is missing 'title'";
            }

            if (!isset($item['description']) || empty(trim($item['description']))) {
                $errors[] = "Feature item {$index} is missing 'description'";
            }

            // Check description is 1 sentence
            if (isset($item['description'])) {
                $sentenceCount = substr_count($item['description'], '.') + substr_count($item['description'], '!') + substr_count($item['description'], '?');
                if ($sentenceCount > 1) {
                    $warnings[] = "Feature item {$index} description should be 1 sentence";
                }
            }
        }

        return ['errors' => $errors, 'warnings' => $warnings];
    }

    /**
     * Validate about section
     */
    public function validateAbout(array $content, array $defaults): array
    {
        $errors = [];
        $warnings = [];

        // Check for content field
        if (!isset($content['content']) || empty(trim($content['content']))) {
            if (!isset($content['title']) || empty(trim($content['title']))) {
                $errors[] = "About section must have 'content' or 'title' field";
            }
        }

        // Check content length (3-5 sentences)
        $contentText = $content['content'] ?? $content['title'] ?? '';
        if ($contentText) {
            $sentenceCount = substr_count($contentText, '.') + substr_count($contentText, '!') + substr_count($contentText, '?');
            if ($sentenceCount < 3 || $sentenceCount > 5) {
                $warnings[] = "About content should be 3-5 sentences (current: {$sentenceCount} sentences)";
            }
        }

        return ['errors' => $errors, 'warnings' => $warnings];
    }

    /**
     * Validate CTA section
     */
    public function validateCTA(array $content, array $defaults): array
    {
        $errors = [];
        $warnings = [];

        // Required fields
        $requiredFields = ['title', 'button_text'];
        foreach ($requiredFields as $field) {
            if (!isset($content[$field]) || empty(trim($content[$field]))) {
                $errors[] = "Required field '{$field}' is missing or empty";
            }
        }

        // Check description length (1-2 sentences)
        if (isset($content['description'])) {
            $sentenceCount = substr_count($content['description'], '.') + substr_count($content['description'], '!') + substr_count($content['description'], '?');
            if ($sentenceCount < 1 || $sentenceCount > 2) {
                $warnings[] = "CTA description should be 1-2 sentences (current: {$sentenceCount} sentences)";
            }
        }

        return ['errors' => $errors, 'warnings' => $warnings];
    }

    /**
     * Generic validation for other sections
     */
    private function validateGeneric(array $content, array $defaults): array
    {
        $errors = [];
        $warnings = [];

        // Check if content has at least title or description
        if (!isset($content['title']) && !isset($content['description'])) {
            $errors[] = "Section must have at least 'title' or 'description'";
        }

        return ['errors' => $errors, 'warnings' => $warnings];
    }

    /**
     * Detect placeholder text
     */
    private function detectPlaceholderText(array $content): array
    {
        $placeholders = [];
        $placeholderPatterns = [
            'lorem ipsum',
            'placeholder',
            'sample text',
            'example',
            'your text here',
            'enter description',
            'add content',
            '[text]',
            '{text}',
        ];

        $contentString = json_encode($content, JSON_UNESCAPED_UNICODE);
        $contentLower = strtolower($contentString);

        foreach ($placeholderPatterns as $pattern) {
            if (str_contains($contentLower, $pattern)) {
                $placeholders[] = $pattern;
            }
        }

        return $placeholders;
    }

    /**
     * Check brand consistency
     */
    private function checkBrandConsistency(array $content): array
    {
        // Check for generic/default text that might indicate lack of customization
        $genericPhrases = [
            'default',
            'sample',
            'example',
            'your store',
            'your business',
        ];

        $contentString = json_encode($content, JSON_UNESCAPED_UNICODE);
        $contentLower = strtolower($contentString);

        foreach ($genericPhrases as $phrase) {
            if (str_contains($contentLower, $phrase)) {
                return [
                    'consistent' => false,
                    'message' => "Content may contain generic phrases. Ensure content is customized for the specific business.",
                ];
            }
        }

        return ['consistent' => true, 'message' => ''];
    }

    /**
     * Check content quality and return metrics
     */
    public function checkContentQuality(array $content): array
    {
        $metrics = [
            'completeness' => 0,
            'length_appropriate' => true,
            'has_placeholder' => false,
            'brand_consistent' => true,
            'seo_friendly' => false,
        ];

        // Check completeness
        $requiredFields = ['title', 'subtitle', 'description', 'button_text'];
        $presentFields = 0;
        foreach ($requiredFields as $field) {
            if (isset($content[$field]) && !empty(trim($content[$field]))) {
                $presentFields++;
            }
        }
        $metrics['completeness'] = ($presentFields / count($requiredFields)) * 100;

        // Check for placeholder text
        $placeholders = $this->detectPlaceholderText($content);
        $metrics['has_placeholder'] = !empty($placeholders);

        // Check brand consistency
        $consistency = $this->checkBrandConsistency($content);
        $metrics['brand_consistent'] = $consistency['consistent'];

        // Basic SEO check (has keywords, appropriate length)
        $contentString = json_encode($content, JSON_UNESCAPED_UNICODE);
        $wordCount = str_word_count($contentString);
        $metrics['seo_friendly'] = $wordCount >= 20 && $wordCount <= 500;

        // Calculate overall quality score
        $score = 0;
        if ($metrics['completeness'] >= 75) $score += 30;
        if (!$metrics['has_placeholder']) $score += 25;
        if ($metrics['brand_consistent']) $score += 25;
        if ($metrics['seo_friendly']) $score += 20;

        $metrics['quality_score'] = $score;

        return $metrics;
    }

    /**
     * Validate JSON structure matches defaults
     */
    public function validateStructure(array $content, array $defaults): bool
    {
        // Check if all required keys from defaults exist in content
        foreach (array_keys($defaults) as $key) {
            if (!array_key_exists($key, $content)) {
                // Some keys might be optional, so we check if it's a required field
                if (in_array($key, ['title', 'subtitle', 'button_text'])) {
                    return false;
                }
            }
        }

        return true;
    }
}

