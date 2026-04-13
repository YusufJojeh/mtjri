<?php

/**
 * Translation Import Template Helper
 * 
 * This script provides a template structure for importing translations.
 * Use this to validate JSON structure before importing.
 */

$docsPath = __DIR__ . '/resources/docs/en';
$categories = [];

// Get all English articles as templates
if (is_dir($docsPath)) {
    $categoryDirs = glob($docsPath . '/*', GLOB_ONLYDIR);
    foreach ($categoryDirs as $categoryDir) {
        $categoryName = basename($categoryDir);
        $categories[$categoryName] = [];
        
        $jsonFiles = glob($categoryDir . '/*.json');
        foreach ($jsonFiles as $jsonFile) {
            $content = json_decode(file_get_contents($jsonFile), true);
            if ($content) {
                $slug = basename($jsonFile, '.json');
                $categories[$categoryName][$slug] = [
                    'slug' => $content['slug'],
                    'category' => $content['category'],
                    'order' => $content['order'] ?? 999,
                    'fields_to_translate' => [
                        'title' => $content['title'],
                        'description' => $content['description'],
                        'meta_description' => $content['meta_description'] ?? '',
                        'content' => 'HTML content (preserve structure)'
                    ]
                ];
            }
        }
    }
}

// Generate template structure documentation
$templateDoc = "# Translation Import Template Structure\n\n";
$templateDoc .= "## Article JSON Structure\n\n";
$templateDoc .= "Each translated article must follow this structure:\n\n";
$templateDoc .= "```json\n";
$templateDoc .= "{\n";
$templateDoc .= "  \"slug\": \"article-slug\",           // MUST match English version\n";
$templateDoc .= "  \"title\": \"Translated Title\",       // REQUIRED - translate this\n";
$templateDoc .= "  \"category\": \"category-name\",        // MUST match English version\n";
$templateDoc .= "  \"description\": \"Translated desc\",  // REQUIRED - translate this\n";
$templateDoc .= "  \"content\": \"<h1>HTML...</h1>\",     // REQUIRED - translate HTML content\n";
$templateDoc .= "  \"meta_description\": \"Meta...\",     // REQUIRED - translate this\n";
$templateDoc .= "  \"order\": 1,                         // MUST match English version\n";
$templateDoc .= "  \"updated_at\": \"2026-01-11\",        // Set to translation date\n";
$templateDoc .= "  \"reading_time\": 3                   // Should match or adjust\n";
$templateDoc .= "}\n";
$templateDoc .= "```\n\n";

$templateDoc .= "## Translation Guidelines\n\n";
$templateDoc .= "1. **slug**: Keep exactly as English (do not translate)\n";
$templateDoc .= "2. **category**: Keep exactly as English (do not translate)\n";
$templateDoc .= "3. **title**: Translate to target language\n";
$templateDoc .= "4. **description**: Translate to target language\n";
$templateDoc .= "5. **content**: Translate HTML content, preserve all HTML tags and structure\n";
$templateDoc .= "6. **meta_description**: Translate to target language (150-160 chars ideal)\n";
$templateDoc .= "7. **order**: Keep exactly as English\n";
$templateDoc .= "8. **updated_at**: Set to translation completion date\n";
$templateDoc .= "9. **reading_time**: Keep or adjust based on language\n\n";

$templateDoc .= "## Categories and Articles\n\n";

foreach ($categories as $category => $articles) {
    $templateDoc .= "### {$category}\n\n";
    $templateDoc .= "Total articles: " . count($articles) . "\n\n";
    
    $templateDoc .= "| Slug | Title (EN) | Description (EN) |\n";
    $templateDoc .= "|------|------------|------------------|\n";
    
    $count = 0;
    foreach ($articles as $slug => $info) {
        if ($count++ < 5) { // Show first 5 as examples
            $title = substr($info['fields_to_translate']['title'], 0, 50);
            $desc = substr($info['fields_to_translate']['description'], 0, 60);
            $templateDoc .= "| {$slug} | {$title} | {$desc} |\n";
        }
    }
    
    if (count($articles) > 5) {
        $templateDoc .= "| ... | ... (" . (count($articles) - 5) . " more) | ... |\n";
    }
    
    $templateDoc .= "\n";
}

file_put_contents(__DIR__ . '/TRANSLATION_TEMPLATE.md', $templateDoc);
echo "Translation template documentation saved to: TRANSLATION_TEMPLATE.md\n";

// Also save JSON structure for programmatic use
$structure = [
    'categories' => $categories,
    'total_articles' => array_sum(array_map('count', $categories)),
    'guidelines' => [
        'preserve_fields' => ['slug', 'category', 'order'],
        'translate_fields' => ['title', 'description', 'content', 'meta_description'],
        'optional_fields' => ['updated_at', 'reading_time']
    ]
];

file_put_contents(__DIR__ . '/translation-structure.json', json_encode($structure, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
echo "Translation structure JSON saved to: translation-structure.json\n";

