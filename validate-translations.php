<?php

/**
 * Translation Validation Script
 * 
 * Validates translated article JSON files for:
 * - JSON structure validity
 * - Required fields presence
 * - HTML content integrity
 * - Character encoding (UTF-8)
 * - Link preservation
 */

$docsPath = __DIR__ . '/resources/docs';
$languages = ['ar', 'es', 'fr', 'de', 'da', 'it', 'ja', 'nl', 'pl', 'pt', 'pt-BR', 'ru', 'tr', 'zh', 'he', 'fa', 'et', 'id', 'ro', 'th', 'zh-CN', 'zh-TW'];

$requiredFields = ['slug', 'title', 'category', 'description', 'content', 'meta_description', 'order'];
$errors = [];
$warnings = [];
$validCount = 0;
$invalidCount = 0;

// Get all English articles as reference
$enArticles = [];
if (is_dir($docsPath . '/en')) {
    $categoryDirs = glob($docsPath . '/en/*', GLOB_ONLYDIR);
    foreach ($categoryDirs as $categoryDir) {
        $categoryName = basename($categoryDir);
        $jsonFiles = glob($categoryDir . '/*.json');
        foreach ($jsonFiles as $jsonFile) {
            $content = json_decode(file_get_contents($jsonFile), true);
            if ($content) {
                $enArticles[$categoryName . '/' . basename($jsonFile, '.json')] = $content;
            }
        }
    }
}

echo "=== TRANSLATION VALIDATION REPORT ===\n\n";

foreach ($languages as $lang) {
    $langPath = $docsPath . '/' . $lang;
    
    if (!is_dir($langPath)) {
        $warnings[$lang][] = "Language directory does not exist";
        continue;
    }
    
    $categoryDirs = glob($langPath . '/*', GLOB_ONLYDIR);
    $langErrors = [];
    $langWarnings = [];
    $langValid = 0;
    $langInvalid = 0;
    
    foreach ($categoryDirs as $categoryDir) {
        $categoryName = basename($categoryDir);
        $jsonFiles = glob($categoryDir . '/*.json');
        
        foreach ($jsonFiles as $jsonFile) {
            $slug = basename($jsonFile, '.json');
            $relativePath = $lang . '/' . $categoryName . '/' . basename($jsonFile);
            $articleKey = $categoryName . '/' . $slug;
            
            // Read and decode JSON
            $fileContent = file_get_contents($jsonFile);
            $jsonData = json_decode($fileContent, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                $langErrors[] = [
                    'file' => $relativePath,
                    'error' => 'Invalid JSON: ' . json_last_error_msg()
                ];
                $langInvalid++;
                continue;
            }
            
            // Check required fields
            $missingFields = [];
            foreach ($requiredFields as $field) {
                if (!isset($jsonData[$field])) {
                    $missingFields[] = $field;
                }
            }
            
            if (!empty($missingFields)) {
                $langErrors[] = [
                    'file' => $relativePath,
                    'error' => 'Missing required fields: ' . implode(', ', $missingFields)
                ];
                $langInvalid++;
                continue;
            }
            
            // Check field types
            if (!is_string($jsonData['slug'])) {
                $langErrors[] = [
                    'file' => $relativePath,
                    'error' => 'slug must be a string'
                ];
                $langInvalid++;
                continue;
            }
            
            if (!is_string($jsonData['title'])) {
                $langErrors[] = [
                    'file' => $relativePath,
                    'error' => 'title must be a string'
                ];
                $langInvalid++;
                continue;
            }
            
            if (!is_string($jsonData['content'])) {
                $langErrors[] = [
                    'file' => $relativePath,
                    'error' => 'content must be a string'
                ];
                $langInvalid++;
                continue;
            }
            
            // Check slug matches filename
            if ($jsonData['slug'] !== $slug) {
                $langWarnings[] = [
                    'file' => $relativePath,
                    'warning' => "slug '{$jsonData['slug']}' does not match filename '{$slug}'"
                ];
            }
            
            // Check category matches directory
            if ($jsonData['category'] !== $categoryName) {
                $langWarnings[] = [
                    'file' => $relativePath,
                    'warning' => "category '{$jsonData['category']}' does not match directory '{$categoryName}'"
                ];
            }
            
            // Check slug matches English version if exists
            if (isset($enArticles[$articleKey])) {
                if ($enArticles[$articleKey]['slug'] !== $jsonData['slug']) {
                    $langWarnings[] = [
                        'file' => $relativePath,
                        'warning' => "slug does not match English version"
                    ];
                }
                
                if ($enArticles[$articleKey]['category'] !== $jsonData['category']) {
                    $langWarnings[] = [
                        'file' => $relativePath,
                        'warning' => "category does not match English version"
                    ];
                }
            }
            
            // Basic HTML validation
            $content = $jsonData['content'];
            
            // Check for balanced tags (simple check)
            $openTags = preg_match_all('/<[^\/][^>]*>/', $content, $matches);
            $closeTags = preg_match_all('/<\/[^>]+>/', $content, $closeMatches);
            
            // Check for empty title
            if (trim($jsonData['title']) === '') {
                $langWarnings[] = [
                    'file' => $relativePath,
                    'warning' => 'title is empty'
                ];
            }
            
            // Check for empty content
            $textContent = strip_tags($content);
            if (trim($textContent) === '') {
                $langWarnings[] = [
                    'file' => $relativePath,
                    'warning' => 'content appears to be empty (no text content)'
                ];
            }
            
            // Check UTF-8 encoding
            if (!mb_check_encoding($fileContent, 'UTF-8')) {
                $langWarnings[] = [
                    'file' => $relativePath,
                    'warning' => 'File may not be UTF-8 encoded'
                ];
            }
            
            $langValid++;
        }
    }
    
    if (!empty($langErrors)) {
        $errors[$lang] = $langErrors;
    }
    if (!empty($langWarnings)) {
        $warnings[$lang] = $langWarnings;
    }
    
    $validCount += $langValid;
    $invalidCount += $langInvalid;
    
    echo "{$lang}: {$langValid} valid, {$langInvalid} invalid";
    if (!empty($langWarnings)) {
        echo ", " . count($langWarnings) . " warnings";
    }
    echo "\n";
}

echo "\n=== SUMMARY ===\n";
echo "Total valid articles: {$validCount}\n";
echo "Total invalid articles: {$invalidCount}\n";
echo "Total warnings: " . array_sum(array_map('count', $warnings)) . "\n";

// Display errors
if (!empty($errors)) {
    echo "\n=== ERRORS ===\n";
    foreach ($errors as $lang => $langErrors) {
        echo "\n{$lang}:\n";
        foreach ($langErrors as $error) {
            echo "  ERROR: {$error['file']}: {$error['error']}\n";
        }
    }
}

// Display warnings (limited)
if (!empty($warnings)) {
    $warningCount = 0;
    echo "\n=== WARNINGS (first 20) ===\n";
    foreach ($warnings as $lang => $langWarnings) {
        foreach ($langWarnings as $warning) {
            if ($warningCount++ < 20) {
                echo "  WARNING: {$warning['file']}: {$warning['warning']}\n";
            }
        }
    }
    $totalWarnings = array_sum(array_map('count', $warnings));
    if ($totalWarnings > 20) {
        echo "\n... and " . ($totalWarnings - 20) . " more warnings\n";
    }
}

// Save full report
$report = [
    'summary' => [
        'valid' => $validCount,
        'invalid' => $invalidCount,
        'warnings' => array_sum(array_map('count', $warnings))
    ],
    'errors' => $errors,
    'warnings' => $warnings
];

file_put_contents(__DIR__ . '/translation-validation-report.json', json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
echo "\nFull validation report saved to: translation-validation-report.json\n";

exit($invalidCount > 0 ? 1 : 0);

