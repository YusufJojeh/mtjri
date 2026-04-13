<?php

/**
 * Structure Comparison Script
 * 
 * Compares the structure of translation files to ensure they match exactly:
 * - Key order
 * - Nested object structure
 * - Key formatting
 * 
 * Usage: php resources/lang/compare-structure.php [master-locale] [target-locale]
 * Example: php resources/lang/compare-structure.php en ar
 */

$langPath = __DIR__;
$masterLocale = $argv[1] ?? 'en';
$targetLocale = $argv[2] ?? 'ar';

// Load both files
$masterFile = "$langPath/{$masterLocale}.json";
$targetFile = "$langPath/{$targetLocale}.json";

if (!file_exists($masterFile)) {
    die("Error: Master file not found: $masterFile\n");
}

if (!file_exists($targetFile)) {
    die("Error: Target file not found: $targetFile\n");
}

$masterData = json_decode(file_get_contents($masterFile), true);
$targetData = json_decode(file_get_contents($targetFile), true);

if (!$masterData || !$targetData) {
    die("Error: Failed to parse JSON files\n");
}

echo "=== Structure Comparison: $masterLocale (master) vs $targetLocale ===\n\n";

// Get all keys in order
$masterKeys = array_keys($masterData);
$targetKeys = array_keys($targetData);

// Check key order
$orderMismatches = [];
for ($i = 0; $i < min(count($masterKeys), count($targetKeys)); $i++) {
    if ($masterKeys[$i] !== $targetKeys[$i]) {
        $orderMismatches[] = [
            'position' => $i,
            'master' => $masterKeys[$i],
            'target' => $targetKeys[$i]
        ];
    }
}

if (count($orderMismatches) > 0) {
    echo "⚠️  KEY ORDER MISMATCHES: " . count($orderMismatches) . "\n";
    foreach (array_slice($orderMismatches, 0, 20) as $mismatch) {
        echo "   Position {$mismatch['position']}: Master has '{$mismatch['master']}', Target has '{$mismatch['target']}'\n";
    }
    if (count($orderMismatches) > 20) {
        echo "   ... and " . (count($orderMismatches) - 20) . " more\n";
    }
    echo "\n";
} else {
    echo "✅ Key order matches perfectly\n\n";
}

// Check nested object structure
function compareStructure($master, $target, $path = '') {
    $issues = [];
    
    if (is_array($master) && is_array($target)) {
        // Check if both are associative arrays (objects) or indexed arrays
        $masterIsObject = array_keys($master) !== range(0, count($master) - 1);
        $targetIsObject = array_keys($target) !== range(0, count($target) - 1);
        
        if ($masterIsObject !== $targetIsObject) {
            $issues[] = [
                'path' => $path ?: 'root',
                'issue' => $masterIsObject 
                    ? 'Master is object but target is array' 
                    : 'Master is array but target is object'
            ];
        }
        
        if ($masterIsObject) {
            // Compare keys
            $masterKeys = array_keys($master);
            $targetKeys = array_keys($target);
            
            $missing = array_diff($masterKeys, $targetKeys);
            $extra = array_diff($targetKeys, $masterKeys);
            
            foreach ($missing as $key) {
                $issues[] = [
                    'path' => $path ? "$path.$key" : $key,
                    'issue' => "Missing key: $key"
                ];
            }
            
            foreach ($extra as $key) {
                $issues[] = [
                    'path' => $path ? "$path.$key" : $key,
                    'issue' => "Extra key: $key (not in master)"
                ];
            }
            
            // Recursively check nested structures
            foreach ($masterKeys as $key) {
                if (isset($target[$key])) {
                    $nestedIssues = compareStructure(
                        $master[$key], 
                        $target[$key], 
                        $path ? "$path.$key" : $key
                    );
                    $issues = array_merge($issues, $nestedIssues);
                }
            }
        }
    } elseif (gettype($master) !== gettype($target)) {
        $issues[] = [
            'path' => $path ?: 'root',
            'issue' => "Type mismatch: Master is " . gettype($master) . ", Target is " . gettype($target)
        ];
    }
    
    return $issues;
}

$structureIssues = compareStructure($masterData, $targetData);

if (count($structureIssues) > 0) {
    echo "⚠️  STRUCTURE ISSUES: " . count($structureIssues) . "\n";
    foreach (array_slice($structureIssues, 0, 30) as $issue) {
        echo "   [{$issue['path']}] {$issue['issue']}\n";
    }
    if (count($structureIssues) > 30) {
        echo "   ... and " . (count($structureIssues) - 30) . " more\n";
    }
    echo "\n";
} else {
    echo "✅ Nested structure matches perfectly\n\n";
}

// Check for formatting differences in key names
$masterKeyStrings = array_map('json_encode', $masterKeys);
$targetKeyStrings = array_map('json_encode', $targetKeys);

$formattingIssues = [];
foreach ($masterKeys as $key) {
    if (!in_array($key, $targetKeys)) {
        // Check if it exists with different formatting
        $normalized = trim($key);
        foreach ($targetKeys as $targetKey) {
            if (trim($targetKey) === $normalized && $targetKey !== $key) {
                $formattingIssues[] = [
                    'master' => $key,
                    'target' => $targetKey,
                    'issue' => 'Whitespace/formatting difference'
                ];
            }
        }
    }
}

if (count($formattingIssues) > 0) {
    echo "⚠️  KEY FORMATTING DIFFERENCES: " . count($formattingIssues) . "\n";
    foreach ($formattingIssues as $issue) {
        echo "   Master: " . json_encode($issue['master']) . "\n";
        echo "   Target: " . json_encode($issue['target']) . "\n";
        echo "   Issue: {$issue['issue']}\n\n";
    }
} else {
    echo "✅ Key formatting matches\n\n";
}

echo "=== End of Comparison ===\n";

