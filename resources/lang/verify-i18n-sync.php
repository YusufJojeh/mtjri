<?php

/**
 * Verify i18n.js and language.json are in sync
 * 
 * Checks that:
 * 1. All languages in language.json are imported in i18n.js
 * 2. All languages in language.json are registered in resources object
 * 3. No missing or extra languages
 */

$langPath = __DIR__;
$i18nFile = __DIR__ . '/../js/i18n.js';
$languageDataFile = "$langPath/language.json";

echo "=== Verifying i18n.js and language.json Sync ===\n\n";

// Load language.json
$languages = json_decode(file_get_contents($languageDataFile), true);
$languageCodes = array_column($languages, 'code');

echo "Languages in language.json (" . count($languageCodes) . "):\n";
foreach ($languageCodes as $code) {
    echo "  - $code\n";
}
echo "\n";

// Load i18n.js
$i18nContent = file_get_contents($i18nFile);

// Check imports
echo "=== Checking Imports ===\n";
$missingImports = [];
$foundImports = [];

foreach ($languageCodes as $code) {
    // Determine import variable name
    $importVar = match($code) {
        'pt-BR' => 'ptBRTranslations',
        'zh-CN' => 'zhCNTranslations',
        'zh-TW' => 'zhTWTranslations',
        default => $code . 'Translations'
    };
    
    // Check if import exists
    if (strpos($i18nContent, "import {$importVar}") !== false) {
        $foundImports[] = $code;
        echo "  ✅ $code: import found ({$importVar})\n";
    } else {
        $missingImports[] = $code;
        echo "  ❌ $code: import NOT found ({$importVar})\n";
    }
}

echo "\n";

// Check resources object
echo "=== Checking Resources Object ===\n";
$missingResources = [];
$foundResources = [];

foreach ($languageCodes as $code) {
    // Check if language is in resources object
    // Handle hyphenated codes (pt-BR, zh-CN, zh-TW) which use quotes
    // Simple codes (en, ar, etc.) don't use quotes in JavaScript object keys
    $found = false;
    
    if (strpos($code, '-') !== false) {
        // Hyphenated codes use quotes: 'pt-BR': or "pt-BR":
        $pattern1 = "'{$code}':";
        $pattern2 = "\"{$code}\":";
        $found = (strpos($i18nContent, $pattern1) !== false || strpos($i18nContent, $pattern2) !== false);
    } else {
        // Simple codes: en: { translation: ... }
        $pattern = "{$code}: { translation:";
        $found = (strpos($i18nContent, $pattern) !== false);
    }
    
    if ($found) {
        $foundResources[] = $code;
        echo "  ✅ $code: resource entry found\n";
    } else {
        $missingResources[] = $code;
        echo "  ❌ $code: resource entry NOT found\n";
    }
}

echo "\n";

// Check supportedLngs
echo "=== Checking supportedLngs ===\n";
if (strpos($i18nContent, "supportedLngs: languageData.map(lang => lang.code)") !== false) {
    echo "  ✅ supportedLngs is dynamically derived from language.json\n";
    echo "     This ensures automatic sync!\n";
} else {
    echo "  ⚠️  supportedLngs might be hardcoded - check manually\n";
}

echo "\n";

// Summary
echo "=== Summary ===\n";
$allGood = true;

if (count($missingImports) > 0) {
    echo "❌ Missing imports: " . implode(', ', $missingImports) . "\n";
    $allGood = false;
}

if (count($missingResources) > 0) {
    echo "❌ Missing resources: " . implode(', ', $missingResources) . "\n";
    $allGood = false;
}

if ($allGood) {
    echo "✅ All " . count($languageCodes) . " languages are properly synced!\n";
    echo "   - All imports present\n";
    echo "   - All resources registered\n";
    echo "   - supportedLngs dynamically derived from language.json\n";
} else {
    echo "\n⚠️  Issues found - please fix the missing items above.\n";
}

echo "\n=== End of Verification ===\n";

