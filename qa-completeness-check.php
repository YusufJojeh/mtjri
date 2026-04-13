<?php

/**
 * QA Completeness Check Script
 * 
 * Verifies all 64 articles exist in all 22 languages.
 * Generates comprehensive completeness report.
 */

$docsPath = __DIR__ . '/resources/docs';
$languages = ['en', 'ar', 'es', 'fr', 'de', 'da', 'it', 'ja', 'nl', 'pl', 'pt', 'pt-BR', 'ru', 'tr', 'zh', 'he', 'fa', 'et', 'id', 'ro', 'th', 'zh-CN', 'zh-TW'];

// Get all English articles as reference
$enArticles = [];
$categories = [];

if (is_dir($docsPath . '/en')) {
    $categoryDirs = glob($docsPath . '/en/*', GLOB_ONLYDIR);
    foreach ($categoryDirs as $categoryDir) {
        $categoryName = basename($categoryDir);
        $categories[] = $categoryName;
        $jsonFiles = glob($categoryDir . '/*.json');
        foreach ($jsonFiles as $jsonFile) {
            $content = json_decode(file_get_contents($jsonFile), true);
            if ($content && isset($content['slug'])) {
                $enArticles[] = [
                    'slug' => $content['slug'],
                    'category' => $categoryName,
                    'title' => $content['title'] ?? '',
                    'path' => $categoryName . '/' . basename($jsonFile, '.json') . '.json'
                ];
            }
        }
    }
}

$totalArticles = count($enArticles);
echo "=== QA COMPLETENESS CHECK ===\n\n";
echo "Total English Articles: {$totalArticles}\n";
echo "Total Languages: " . (count($languages) - 1) . " (excluding English)\n";
echo "Expected Total Translations: " . ($totalArticles * (count($languages) - 1)) . "\n\n";

$completenessReport = [];
$missingByLanguage = [];
$missingByCategory = [];

foreach ($languages as $lang) {
    if ($lang === 'en') {
        continue; // Skip English
    }
    
    $langPath = $docsPath . '/' . $lang;
    $articles = [];
    $missing = [];
    
    if (is_dir($langPath)) {
        foreach ($categories as $category) {
            $categoryPath = $langPath . '/' . $category;
            if (is_dir($categoryPath)) {
                $jsonFiles = glob($categoryPath . '/*.json');
                foreach ($jsonFiles as $jsonFile) {
                    $content = json_decode(file_get_contents($jsonFile), true);
                    if ($content && isset($content['slug'])) {
                        $articles[$content['slug'] . '|' . $category] = true;
                    }
                }
            }
        }
    }
    
    // Find missing articles
    foreach ($enArticles as $article) {
        $key = $article['slug'] . '|' . $article['category'];
        if (!isset($articles[$key])) {
            $missing[] = $article;
            if (!isset($missingByCategory[$article['category']])) {
                $missingByCategory[$article['category']] = [];
            }
            $missingByCategory[$article['category']][] = $lang;
        }
    }
    
    $count = count($articles);
    $missingCount = count($missing);
    $percentage = $totalArticles > 0 ? round(($count / $totalArticles) * 100, 1) : 0;
    
    $completenessReport[$lang] = [
        'total' => $count,
        'missing' => $missingCount,
        'percentage' => $percentage,
        'missing_articles' => $missing
    ];
    
    if ($missingCount > 0) {
        $missingByLanguage[$lang] = $missing;
    }
}

// Display summary
echo "=== COMPLETENESS SUMMARY ===\n\n";
echo str_pad("Language", 12) . str_pad("Articles", 12) . str_pad("Missing", 12) . str_pad("Complete %", 15) . str_pad("Status", 10) . "\n";
echo str_repeat("-", 61) . "\n";

$totalTranslated = 0;
$totalMissing = 0;

foreach ($completenessReport as $lang => $data) {
    $status = $data['percentage'] == 100 ? "✓ COMPLETE" : "⚠ INCOMPLETE";
    echo str_pad($lang, 12) . 
         str_pad($data['total'], 12) . 
         str_pad($data['missing'], 12) . 
         str_pad($data['percentage'] . "%", 15) . 
         str_pad($status, 10) . "\n";
    
    $totalTranslated += $data['total'];
    $totalMissing += $data['missing'];
}

echo "\n=== OVERALL STATISTICS ===\n";
echo "Total translations completed: {$totalTranslated}\n";
echo "Total translations missing: {$totalMissing}\n";
$overallPercentage = ($totalArticles * (count($languages) - 1)) > 0 
    ? round(($totalTranslated / ($totalArticles * (count($languages) - 1))) * 100, 1) 
    : 0;
echo "Overall completion: {$overallPercentage}%\n\n";

// Missing by category
echo "=== MISSING ARTICLES BY CATEGORY ===\n\n";
foreach ($categories as $category) {
    if (isset($missingByCategory[$category])) {
        $langs = array_unique($missingByCategory[$category]);
        echo "{$category}: " . count($langs) . " language(s) missing articles\n";
    }
}

// Save detailed report
$report = [
    'summary' => [
        'total_articles' => $totalArticles,
        'total_languages' => count($languages) - 1,
        'expected_translations' => $totalArticles * (count($languages) - 1),
        'completed_translations' => $totalTranslated,
        'missing_translations' => $totalMissing,
        'overall_completion' => $overallPercentage
    ],
    'by_language' => $completenessReport,
    'missing_by_category' => $missingByCategory
];

file_put_contents(__DIR__ . '/qa-completeness-report.json', json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
echo "\nDetailed completeness report saved to: qa-completeness-report.json\n";

// Check if all complete
if ($totalMissing === 0) {
    echo "\n✅ ALL ARTICLES COMPLETE IN ALL LANGUAGES!\n";
    exit(0);
} else {
    echo "\n⚠️  {$totalMissing} translations still missing\n";
    exit(1);
}

