<?php

/**
 * Translation Key Audit Script
 * 
 * This script checks all translation JSON files for:
 * - Missing keys (present in master but missing in target)
 * - Extra keys (present in target but not in master)
 * - Key count differences
 * 
 * Usage: php check-translations.php [master-locale]
 * Example: php check-translations.php en
 */

// Get master locale from command line or default to 'en'
$masterLocale = $argv[1] ?? 'en';
$langDir = __DIR__ . '/resources/lang';
$masterFile = "{$langDir}/{$masterLocale}.json";

if (!file_exists($masterFile)) {
    die("Error: Master translation file not found: {$masterFile}\n");
}

// Load master translations
$masterTranslations = json_decode(file_get_contents($masterFile), true);
if (!$masterTranslations) {
    die("Error: Failed to parse master translation file: {$masterFile}\n");
}

$masterKeys = array_keys($masterTranslations);
$masterKeyCount = count($masterKeys);
sort($masterKeys);

echo "=== Translation Key Audit ===\n";
echo "Master Locale: {$masterLocale}\n";
echo "Master Key Count: {$masterKeyCount}\n";
echo str_repeat('=', 50) . "\n\n";

// Get all JSON files in lang directory
$jsonFiles = glob("{$langDir}/*.json");
$results = [];

foreach ($jsonFiles as $file) {
    $locale = basename($file, '.json');
    
    // Skip language.json and master file
    if ($locale === 'language' || $locale === $masterLocale) {
        continue;
    }
    
    $translations = json_decode(file_get_contents($file), true);
    if (!$translations) {
        echo "Warning: Failed to parse {$file}\n";
        continue;
    }
    
    $targetKeys = array_keys($translations);
    $targetKeyCount = count($targetKeys);
    sort($targetKeys);
    
    // Find missing keys (in master but not in target)
    $missingKeys = array_diff($masterKeys, $targetKeys);
    
    // Find extra keys (in target but not in master)
    $extraKeys = array_diff($targetKeys, $masterKeys);
    
    $results[$locale] = [
        'file' => $file,
        'keyCount' => $targetKeyCount,
        'missingKeys' => $missingKeys,
        'extraKeys' => $extraKeys,
        'missingCount' => count($missingKeys),
        'extraCount' => count($extraKeys),
        'coverage' => round((($masterKeyCount - count($missingKeys)) / $masterKeyCount) * 100, 2)
    ];
}

// Sort results by coverage (lowest first)
uasort($results, function($a, $b) {
    return $a['coverage'] <=> $b['coverage'];
});

// Display results
foreach ($results as $locale => $data) {
    echo "Locale: {$locale}\n";
    echo "  Key Count: {$data['keyCount']} / {$masterKeyCount} (Coverage: {$data['coverage']}%)\n";
    echo "  Missing Keys: {$data['missingCount']}\n";
    echo "  Extra Keys: {$data['extraCount']}\n";
    
    if ($data['missingCount'] > 0 && $data['missingCount'] <= 20) {
        echo "  Missing Key List:\n";
        foreach (array_slice($data['missingKeys'], 0, 20) as $key) {
            echo "    - {$key}\n";
        }
        if ($data['missingCount'] > 20) {
            echo "    ... and " . ($data['missingCount'] - 20) . " more\n";
        }
    } elseif ($data['missingCount'] > 20) {
        echo "  First 20 Missing Keys:\n";
        foreach (array_slice($data['missingKeys'], 0, 20) as $key) {
            echo "    - {$key}\n";
        }
        echo "    ... and " . ($data['missingCount'] - 20) . " more\n";
    }
    
    if ($data['extraCount'] > 0 && $data['extraCount'] <= 10) {
        echo "  Extra Keys (not in master):\n";
        foreach (array_slice($data['extraKeys'], 0, 10) as $key) {
            echo "    + {$key}\n";
        }
        if ($data['extraCount'] > 10) {
            echo "    ... and " . ($data['extraCount'] - 10) . " more\n";
        }
    }
    
    echo "\n";
}

// Summary
echo str_repeat('=', 50) . "\n";
echo "Summary:\n";
$totalLocales = count($results);
$completeLocales = count(array_filter($results, fn($r) => $r['missingCount'] === 0));
$highCoverage = count(array_filter($results, fn($r) => $r['coverage'] >= 95));
$lowCoverage = count(array_filter($results, fn($r) => $r['coverage'] < 80));

echo "Total Locales Checked: {$totalLocales}\n";
echo "Complete (100%): {$completeLocales}\n";
echo "High Coverage (≥95%): {$highCoverage}\n";
echo "Low Coverage (<80%): {$lowCoverage}\n";

// Export detailed report to JSON
$reportFile = __DIR__ . '/translation-audit-report.json';
$report = [
    'generated_at' => date('Y-m-d H:i:s'),
    'master_locale' => $masterLocale,
    'master_key_count' => $masterKeyCount,
    'locales' => $results
];

file_put_contents($reportFile, json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
echo "\nDetailed report saved to: {$reportFile}\n";

