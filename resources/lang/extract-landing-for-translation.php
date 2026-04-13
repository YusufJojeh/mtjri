<?php

/**
 * Extract landing section content for translation
 * 
 * This script extracts the landing section from en.json
 * and creates a clean JSON file that can be easily translated
 * using translation services or manual translation.
 */

$langPath = __DIR__;
$masterFile = "$langPath/en.json";

$masterData = json_decode(file_get_contents($masterFile), true);

if (!isset($masterData['landing'])) {
    die("Error: 'landing' section not found in en.json\n");
}

// Extract only the landing section
$landingContent = ['landing' => $masterData['landing']];

// Output as pretty JSON
$output = json_encode($landingContent, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

// Save to file
$outputFile = "$langPath/landing-translation-template.json";
file_put_contents($outputFile, $output);

echo "✅ Landing section extracted to: landing-translation-template.json\n";
echo "📝 This file contains all landing page content that needs translation.\n";
echo "💡 You can:\n";
echo "   1. Use this file with translation services (Google Translate API, DeepL, etc.)\n";
echo "   2. Translate manually and merge back into language files\n";
echo "   3. Use it as a reference for translation\n";
echo "\n";
echo "Total keys in landing section: " . countKeys($masterData['landing']) . "\n";

function countKeys($array, $prefix = '') {
    $count = 0;
    foreach ($array as $key => $value) {
        $fullKey = $prefix ? "$prefix.$key" : $key;
        if (is_array($value)) {
            $count += countKeys($value, $fullKey);
        } else {
            $count++;
        }
    }
    return $count;
}

