<?php

/**
 * Translation Status Report Script
 * 
 * Generates a report showing translation completeness across all languages.
 * Identifies missing articles per language.
 */

$docsPath = __DIR__ . '/resources/docs';
$languages = ['en', 'ar', 'es', 'fr', 'de', 'da', 'it', 'ja', 'nl', 'pl', 'pt', 'pt-BR', 'ru', 'tr', 'zh', 'he', 'fa', 'et', 'id', 'ro', 'th', 'zh-CN', 'zh-TW'];

// Get all English articles (base)
$enArticles = [];
$categories = [];

if (is_dir($docsPath . '/en')) {
    $categoryDirs = glob($docsPath . '/en/*', GLOB_ONLYDIR);
    foreach ($categoryDirs as $categoryDir) {
        $categoryName = basename($categoryDir);
        $categories[] = $categoryName;
        $jsonFiles = glob($categoryDir . '/*.json');
        foreach ($jsonFiles as $jsonFile) {
            $slug = basename($jsonFile, '.json');
            $enArticles[] = [
                'slug' => $slug,
                'category' => $categoryName,
                'path' => $categoryName . '/' . $slug . '.json'
            ];
        }
    }
}

$totalArticles = count($enArticles);
echo "=== TRANSLATION STATUS REPORT ===\n\n";
echo "Total English Articles: {$totalArticles}\n\n";
echo "Categories: " . implode(', ', $categories) . "\n\n";

// Check each language
$report = [];
$missingReports = [];

foreach ($languages as $lang) {
    $langPath = $docsPath . '/' . $lang;
    $articles = [];
    $missing = [];
    
    if (is_dir($langPath)) {
        foreach ($categories as $category) {
            $categoryPath = $langPath . '/' . $category;
            if (is_dir($categoryPath)) {
                $jsonFiles = glob($categoryPath . '/*.json');
                foreach ($jsonFiles as $jsonFile) {
                    $slug = basename($jsonFile, '.json');
                    $articles[] = $slug;
                }
            }
        }
    }
    
    // Find missing articles
    foreach ($enArticles as $enArticle) {
        if (!in_array($enArticle['slug'], $articles)) {
            $missing[] = $enArticle;
        }
    }
    
    $count = count($articles);
    $missingCount = count($missing);
    $percentage = $totalArticles > 0 ? round(($count / $totalArticles) * 100, 1) : 0;
    
    $report[$lang] = [
        'total' => $count,
        'missing' => $missingCount,
        'percentage' => $percentage,
        'missing_articles' => $missing
    ];
    
    if ($missingCount > 0) {
        $missingReports[$lang] = $missing;
    }
}

// Display summary table
echo str_pad("Language", 12) . str_pad("Articles", 12) . str_pad("Missing", 12) . str_pad("Complete %", 15) . "\n";
echo str_repeat("-", 51) . "\n";

foreach ($report as $lang => $data) {
    $status = $data['percentage'] == 100 ? "✓" : " ";
    echo str_pad($lang, 12) . 
         str_pad($data['total'], 12) . 
         str_pad($data['missing'], 12) . 
         str_pad($data['percentage'] . "% " . $status, 15) . "\n";
}

// Generate missing articles reports
echo "\n=== MISSING ARTICLES BY LANGUAGE ===\n\n";

$topLanguages = ['ar', 'es', 'fr', 'de'];
$remainingLanguages = array_diff($languages, ['en'], $topLanguages);

echo "--- TOP 4 LANGUAGES ---\n";
foreach ($topLanguages as $lang) {
    if (isset($missingReports[$lang]) && count($missingReports[$lang]) > 0) {
        echo "\n{$lang} - Missing " . count($missingReports[$lang]) . " articles:\n";
        foreach ($missingReports[$lang] as $article) {
            echo "  - {$article['category']}/{$article['slug']}.json\n";
        }
    } else {
        echo "\n{$lang} - Complete!\n";
    }
}

echo "\n--- REMAINING 18 LANGUAGES ---\n";
foreach ($remainingLanguages as $lang) {
    if (isset($missingReports[$lang]) && count($missingReports[$lang]) > 0) {
        echo "\n{$lang} - Missing " . count($missingReports[$lang]) . " articles:\n";
        $count = 0;
        foreach ($missingReports[$lang] as $article) {
            if ($count < 10) { // Show first 10
                echo "  - {$article['category']}/{$article['slug']}.json\n";
                $count++;
            }
        }
        if (count($missingReports[$lang]) > 10) {
            echo "  ... and " . (count($missingReports[$lang]) - 10) . " more\n";
        }
    } else if (!isset($report[$lang]) || $report[$lang]['total'] == 0) {
        echo "\n{$lang} - No translations found\n";
    } else {
        echo "\n{$lang} - Complete!\n";
    }
}

// Save detailed missing articles list to file
$missingJson = [];
foreach ($languages as $lang) {
    if ($lang === 'en') continue;
    if (isset($missingReports[$lang])) {
        $missingJson[$lang] = $missingReports[$lang];
    } else {
        $missingJson[$lang] = [];
    }
}

file_put_contents(__DIR__ . '/missing-translations.json', json_encode($missingJson, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
echo "\n\nDetailed missing articles list saved to: missing-translations.json\n";

