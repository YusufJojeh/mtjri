<?php

/**
 * Translation Link Checker Script
 * 
 * Verifies internal links in translated article content.
 * Checks that link targets exist in the target language.
 */

$docsPath = __DIR__ . '/resources/docs';
$languages = ['ar', 'es', 'fr', 'de', 'da', 'it', 'ja', 'nl', 'pl', 'pt', 'pt-BR', 'ru', 'tr', 'zh', 'he', 'fa', 'et', 'id', 'ro', 'th', 'zh-CN', 'zh-TW'];

echo "=== TRANSLATION LINK CHECKER ===\n\n";

$allIssues = [];
$totalLinks = 0;
$brokenLinks = 0;

// Build article index for each language
foreach ($languages as $lang) {
    $langPath = $docsPath . '/' . $lang;
    
    if (!is_dir($langPath)) {
        continue;
    }
    
    $articles = [];
    $categoryDirs = glob($langPath . '/*', GLOB_ONLYDIR);
    
    foreach ($categoryDirs as $categoryDir) {
        $categoryName = basename($categoryDir);
        $jsonFiles = glob($categoryDir . '/*.json');
        
        foreach ($jsonFiles as $jsonFile) {
            $content = json_decode(file_get_contents($jsonFile), true);
            if ($content && isset($content['slug'])) {
                $articles[$content['slug']] = [
                    'category' => $categoryName,
                    'slug' => $content['slug']
                ];
            }
        }
    }
    
    // Check links in articles
    foreach ($categoryDirs as $categoryDir) {
        $categoryName = basename($categoryDir);
        $jsonFiles = glob($categoryDir . '/*.json');
        
        foreach ($jsonFiles as $jsonFile) {
            $slug = basename($jsonFile, '.json');
            $relativePath = $lang . '/' . $categoryName . '/' . basename($jsonFile);
            
            $content = json_decode(file_get_contents($jsonFile), true);
            if (!$content || !isset($content['content'])) {
                continue;
            }
            
            $htmlContent = $content['content'];
            
            // Extract links from HTML
            preg_match_all('/href=["\']([^"\']+)["\']/', $htmlContent, $matches);
            
            if (empty($matches[1])) {
                continue;
            }
            
            foreach ($matches[1] as $link) {
                $totalLinks++;
                
                // Only check internal /docs/ links
                if (strpos($link, '/docs/') !== 0) {
                    continue; // External links or anchors
                }
                
                // Extract slug from link
                // Format: /docs/article-slug or /docs/article-slug#anchor
                $linkPath = parse_url($link, PHP_URL_PATH);
                $linkSlug = basename($linkPath);
                
                // Check if article exists in this language
                if (!isset($articles[$linkSlug])) {
                    $brokenLinks++;
                    $allIssues[] = [
                        'language' => $lang,
                        'file' => $relativePath,
                        'link' => $link,
                        'target_slug' => $linkSlug,
                        'issue' => 'Target article not found in language'
                    ];
                }
            }
        }
    }
}

echo "Total links checked: {$totalLinks}\n";
echo "Broken links found: {$brokenLinks}\n\n";

if (!empty($allIssues)) {
    echo "=== BROKEN LINKS ===\n\n";
    
    // Group by language
    $byLanguage = [];
    foreach ($allIssues as $issue) {
        $byLanguage[$issue['language']][] = $issue;
    }
    
    foreach ($byLanguage as $lang => $issues) {
        echo "{$lang} - " . count($issues) . " broken link(s):\n";
        foreach (array_slice($issues, 0, 10) as $issue) {
            echo "  {$issue['file']}: {$issue['link']} (target: {$issue['target_slug']})\n";
        }
        if (count($issues) > 10) {
            echo "  ... and " . (count($issues) - 10) . " more\n";
        }
        echo "\n";
    }
}

// Save full report
$report = [
    'summary' => [
        'total_links' => $totalLinks,
        'broken_links' => $brokenLinks
    ],
    'issues' => $allIssues
];

file_put_contents(__DIR__ . '/translation-links-report.json', json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
echo "Full link report saved to: translation-links-report.json\n";

exit($brokenLinks > 0 ? 1 : 0);

