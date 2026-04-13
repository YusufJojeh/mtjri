<?php

/**
 * Helper script to translate landing sections
 * This script helps identify which files need translation
 */

$langPath = __DIR__;
$masterFile = "$langPath/en.json";
$masterData = json_decode(file_get_contents($masterFile), true);

$languages = [
    'de' => 'German',
    'fr' => 'French',
    'it' => 'Italian',
    'ja' => 'Japanese',
    'nl' => 'Dutch',
    'pl' => 'Polish',
    'pt' => 'Portuguese',
    'pt-BR' => 'Portuguese (Brazil)',
    'ru' => 'Russian',
    'tr' => 'Turkish',
    'zh' => 'Chinese',
    'fa' => 'Persian/Farsi',
    'et' => 'Estonian',
    'id' => 'Indonesian',
    'ro' => 'Romanian',
    'th' => 'Thai',
    'zh-CN' => 'Chinese (Simplified)',
    'zh-TW' => 'Chinese (Traditional)'
];

echo "=== Translation Status ===\n\n";

foreach ($languages as $code => $name) {
    $file = "$langPath/{$code}.json";
    if (!file_exists($file)) {
        echo "❌ $code ($name): File not found\n";
        continue;
    }
    
    $data = json_decode(file_get_contents($file), true);
    if (!$data || !isset($data['landing']['hero']['title'])) {
        echo "⚠️  $code ($name): Missing landing section\n";
        continue;
    }
    
    // Check if title is still in English
    $title = $data['landing']['hero']['title'];
    $masterTitle = $masterData['landing']['hero']['title'];
    
    if ($title === $masterTitle) {
        echo "⚠️  $code ($name): Needs translation\n";
    } else {
        echo "✅ $code ($name): Translated\n";
    }
}

