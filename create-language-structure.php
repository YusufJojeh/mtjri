<?php

/**
 * Create Language Directory Structure Script
 * 
 * Creates directory structure for all target languages
 * based on the English article structure.
 */

$docsPath = __DIR__ . '/resources/docs';
$targetLanguages = ['da', 'it', 'ja', 'nl', 'pl', 'pt', 'pt-BR', 'ru', 'tr', 'zh', 'he', 'fa', 'et', 'id', 'ro', 'th', 'zh-CN', 'zh-TW'];

echo "=== CREATING LANGUAGE DIRECTORY STRUCTURE ===\n\n";

// Get categories from English directory
$enPath = $docsPath . '/en';
$categories = [];

if (!is_dir($enPath)) {
    echo "ERROR: English directory not found at {$enPath}\n";
    exit(1);
}

$categoryDirs = glob($enPath . '/*', GLOB_ONLYDIR);
foreach ($categoryDirs as $categoryDir) {
    $categories[] = basename($categoryDir);
}

echo "Found categories: " . implode(', ', $categories) . "\n\n";

$created = 0;
$existing = 0;

foreach ($targetLanguages as $lang) {
    $langPath = $docsPath . '/' . $lang;
    
    // Create language directory if it doesn't exist
    if (!is_dir($langPath)) {
        if (mkdir($langPath, 0755, true)) {
            echo "Created directory: {$lang}/\n";
            $created++;
        } else {
            echo "ERROR: Could not create directory: {$lang}/\n";
            continue;
        }
    } else {
        $existing++;
    }
    
    // Create category subdirectories
    foreach ($categories as $category) {
        $categoryPath = $langPath . '/' . $category;
        
        if (!is_dir($categoryPath)) {
            if (mkdir($categoryPath, 0755, true)) {
                echo "  Created: {$lang}/{$category}/\n";
            } else {
                echo "  ERROR: Could not create {$lang}/{$category}/\n";
            }
        }
    }
}

echo "\n=== SUMMARY ===\n";
echo "New language directories created: {$created}\n";
echo "Existing language directories: {$existing}\n";
echo "Total languages processed: " . count($targetLanguages) . "\n";
echo "Categories per language: " . count($categories) . "\n\n";
echo "Directory structure created successfully!\n";

