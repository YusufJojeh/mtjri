<?php

/**
 * Translation Audit Script
 * 
 * This script analyzes translation JSON files to detect:
 * - Missing keys (present in master but missing in target)
 * - Extra keys (present in target but not in master)
 * - Key count differences
 * 
 * Usage: php resources/lang/audit-translations.php [master-locale] [target-locale]
 * Example: php resources/lang/audit-translations.php en ar
 */

$langPath = __DIR__;
$masterLocale = $argv[1] ?? 'en';
$targetLocale = $argv[2] ?? null;

// Load master translation file
$masterFile = "$langPath/{$masterLocale}.json";
if (!file_exists($masterFile)) {
    die("Error: Master file not found: $masterFile\n");
}

$masterData = json_decode(file_get_contents($masterFile), true);
if (!$masterData) {
    die("Error: Failed to parse master file: $masterFile\n");
}

$masterKeys = array_keys($masterData);
$masterKeyCount = count($masterKeys);

echo "=== Translation Audit Report ===\n\n";
echo "Master locale: $masterLocale (keys: $masterKeyCount)\n\n";

// If target locale specified, analyze only that one
if ($targetLocale) {
    analyzeLocale($targetLocale, $masterKeys, $masterKeyCount, $langPath);
} else {
    // Analyze all locales
    $languageDataFile = "$langPath/language.json";
    if (file_exists($languageDataFile)) {
        $languages = json_decode(file_get_contents($languageDataFile), true);
        $locales = array_column($languages, 'code');
    } else {
        // Fallback: scan all JSON files
        $locales = [];
        foreach (glob("$langPath/*.json") as $file) {
            $basename = basename($file, '.json');
            if ($basename !== 'language' && $basename !== $masterLocale) {
                $locales[] = $basename;
            }
        }
    }
    
    foreach ($locales as $locale) {
        if ($locale === $masterLocale) continue;
        analyzeLocale($locale, $masterKeys, $masterKeyCount, $langPath);
        echo "\n";
    }
}

function analyzeLocale($locale, $masterKeys, $masterKeyCount, $langPath) {
    $targetFile = "$langPath/{$locale}.json";
    
    if (!file_exists($targetFile)) {
        echo "❌ $locale: File not found\n";
        return;
    }
    
    $targetData = json_decode(file_get_contents($targetFile), true);
    if (!$targetData) {
        echo "❌ $locale: Failed to parse JSON file\n";
        return;
    }
    
    $targetKeys = array_keys($targetData);
    $targetKeyCount = count($targetKeys);
    
    // Find missing keys
    $missingKeys = array_diff($masterKeys, $targetKeys);
    $missingCount = count($missingKeys);
    
    // Find extra keys
    $extraKeys = array_diff($targetKeys, $masterKeys);
    $extraCount = count($extraKeys);
    
    // Calculate completeness percentage
    $completeness = $masterKeyCount > 0 
        ? round((($masterKeyCount - $missingCount) / $masterKeyCount) * 100, 2)
        : 0;
    
    // Status indicator
    $status = $completeness >= 100 ? '✅' : ($completeness >= 95 ? '⚠️' : '❌');
    
    echo "$status $locale:\n";
    echo "   Keys: $targetKeyCount / $masterKeyCount ($completeness% complete)\n";
    
    if ($missingCount > 0) {
        echo "   Missing keys: $missingCount\n";
        if ($missingCount <= 20) {
            echo "   Missing: " . implode(', ', array_slice($missingKeys, 0, 20));
            if ($missingCount > 20) {
                echo " ... and " . ($missingCount - 20) . " more";
            }
            echo "\n";
        }
    }
    
    if ($extraCount > 0) {
        echo "   Extra keys: $extraCount (not in master)\n";
        if ($extraCount <= 10) {
            echo "   Extra: " . implode(', ', array_slice($extraKeys, 0, 10));
            if ($extraCount > 10) {
                echo " ... and " . ($extraCount - 10) . " more";
            }
            echo "\n";
        }
    }
    
    if ($missingCount === 0 && $extraCount === 0) {
        echo "   ✓ Perfect match!\n";
    }
}

echo "\n=== End of Report ===\n";
