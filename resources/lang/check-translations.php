<?php

/**
 * Check which languages need translation
 * Compares landing page content with English to find untranslated content
 */

$langPath = __DIR__;
$masterFile = "$langPath/en.json";
$languageDataFile = "$langPath/language.json";

$masterData = json_decode(file_get_contents($masterFile), true);
$languages = json_decode(file_get_contents($languageDataFile), true);

// Key landing page sections to check
$landingKeys = [
    'landing.hero.title',
    'landing.hero.subtitle',
    'landing.features.title',
    'landing.whyChooseUs.title',
    'landing.about.title',
];

echo "=== Translation Status Check ===\n\n";

$needsTranslation = [];

foreach ($languages as $lang) {
    $code = $lang['code'];
    if ($code === 'en') continue; // Skip English (master)
    
    $file = "$langPath/{$code}.json";
    if (!file_exists($file)) {
        echo "❌ $code: File not found\n";
        continue;
    }
    
    $data = json_decode(file_get_contents($file), true);
    if (!$data) {
        echo "❌ $code: Invalid JSON\n";
        continue;
    }
    
    // Check if landing section exists
    if (!isset($data['landing'])) {
        echo "⚠️  $code: Missing 'landing' section\n";
        $needsTranslation[] = $code;
        continue;
    }
    
    // Check key translations
    $untranslated = [];
    foreach ($landingKeys as $key) {
        $keys = explode('.', $key);
        $masterValue = $masterData;
        $targetValue = $data;
        
        foreach ($keys as $k) {
            $masterValue = $masterValue[$k] ?? null;
            $targetValue = $targetValue[$k] ?? null;
        }
        
        // If values are the same (English), it needs translation
        if ($masterValue && $targetValue && $masterValue === $targetValue) {
            $untranslated[] = $key;
        }
    }
    
    if (count($untranslated) > 0) {
        echo "⚠️  $code ({$lang['name']}): " . count($untranslated) . " keys still in English\n";
        $needsTranslation[] = $code;
    } else {
        echo "✅ $code ({$lang['name']}): Appears translated\n";
    }
}

echo "\n=== Summary ===\n";
echo "Languages needing translation: " . count($needsTranslation) . "\n";
if (count($needsTranslation) > 0) {
    echo "Codes: " . implode(', ', $needsTranslation) . "\n";
}

