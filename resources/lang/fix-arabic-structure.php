<?php

/**
 * Fix Arabic Translation Structure
 * 
 * Ensures Arabic translation file matches the exact structure of English:
 * - Same key order
 * - Same nested structure
 * - Same formatting
 */

$langPath = __DIR__;
$masterFile = "$langPath/en.json";
$targetFile = "$langPath/ar.json";

if (!file_exists($masterFile)) {
    die("Error: Master file not found: $masterFile\n");
}

if (!file_exists($targetFile)) {
    die("Error: Target file not found: $targetFile\n");
}

echo "Loading files...\n";
$masterData = json_decode(file_get_contents($masterFile), true);
$targetData = json_decode(file_get_contents($targetFile), true);

if (!$masterData || !$targetData) {
    die("Error: Failed to parse JSON files\n");
}

echo "Master (en): " . count($masterData) . " keys\n";
echo "Target (ar): " . count($targetData) . " keys\n\n";

// Get keys in order from master
$masterKeys = array_keys($masterData);
$targetKeys = array_keys($targetData);

// Rebuild Arabic file with same key order as English
$reorderedData = [];
$missingTranslations = [];

foreach ($masterKeys as $key) {
    if (isset($targetData[$key])) {
        $reorderedData[$key] = $targetData[$key];
    } else {
        // Key missing - use English as fallback (shouldn't happen if audit passed)
        $reorderedData[$key] = $masterData[$key];
        $missingTranslations[] = $key;
    }
}

if (count($missingTranslations) > 0) {
    echo "⚠️  Missing translations (using English fallback): " . count($missingTranslations) . "\n";
    foreach (array_slice($missingTranslations, 0, 10) as $key) {
        echo "   - $key\n";
    }
    echo "\n";
}

// Check for extra keys in Arabic that don't exist in English
$extraKeys = array_diff($targetKeys, $masterKeys);
if (count($extraKeys) > 0) {
    echo "⚠️  Extra keys in Arabic (will be removed): " . count($extraKeys) . "\n";
    foreach (array_slice($extraKeys, 0, 10) as $key) {
        echo "   - $key\n";
    }
    echo "\n";
}

// Handle nested objects - ensure they maintain structure
function reorderNested($master, $target) {
    if (is_array($master) && is_array($target)) {
        $masterIsObject = array_keys($master) !== range(0, count($master) - 1);
        
        if ($masterIsObject) {
            $reordered = [];
            foreach (array_keys($master) as $key) {
                if (isset($target[$key])) {
                    $reordered[$key] = reorderNested($master[$key], $target[$key]);
                } else {
                    $reordered[$key] = $master[$key]; // Fallback to master
                }
            }
            return $reordered;
        }
    }
    return $target;
}

// Reorder nested structures
foreach ($reorderedData as $key => $value) {
    if (is_array($value) && isset($masterData[$key]) && is_array($masterData[$key])) {
        $reorderedData[$key] = reorderNested($masterData[$key], $value);
    }
}

// Write the reordered file
$output = json_encode($reorderedData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
file_put_contents($targetFile, $output);

echo "✅ Arabic file structure has been reordered to match English\n";
echo "✅ File saved: $targetFile\n";

