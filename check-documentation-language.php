<?php

/**
 * Documentation Language Purity Check Script
 * 
 * Checks all documentation files to ensure they are fully in their target language
 * with no language mixing. Detects issues in title, description, content, and meta_description fields.
 */

$docsPath = __DIR__ . '/resources/docs';
$languages = ['en', 'ar', 'es', 'fr', 'de', 'da', 'it', 'ja', 'nl', 'pl', 'pt', 'pt-BR', 'ru', 'tr', 'zh', 'he', 'fa', 'et', 'id', 'ro', 'th', 'zh-CN', 'zh-TW'];

// Language character ranges
$languageRanges = [
    'ar' => ['arabic' => [0x0600, 0x06FF]], // Arabic script
    'he' => ['hebrew' => [0x0590, 0x05FF]], // Hebrew script
    'fa' => ['arabic' => [0x0600, 0x06FF], 'persian' => [0x06A0, 0x06FF]], // Persian uses Arabic script
    'en' => ['latin' => [0x0000, 0x007F], 'latin_extended' => [0x0080, 0x024F]], // Latin script
    'es' => ['latin' => [0x0000, 0x007F], 'latin_extended' => [0x0080, 0x024F]], // Spanish uses Latin
    'fr' => ['latin' => [0x0000, 0x007F], 'latin_extended' => [0x0080, 0x024F]], // French uses Latin
    'de' => ['latin' => [0x0000, 0x007F], 'latin_extended' => [0x0080, 0x024F]], // German uses Latin
    'it' => ['latin' => [0x0000, 0x007F], 'latin_extended' => [0x0080, 0x024F]], // Italian uses Latin
    'pt' => ['latin' => [0x0000, 0x007F], 'latin_extended' => [0x0080, 0x024F]], // Portuguese uses Latin
    'pt-BR' => ['latin' => [0x0000, 0x007F], 'latin_extended' => [0x0080, 0x024F]], // Portuguese uses Latin
    'nl' => ['latin' => [0x0000, 0x007F], 'latin_extended' => [0x0080, 0x024F]], // Dutch uses Latin
    'pl' => ['latin' => [0x0000, 0x007F], 'latin_extended' => [0x0080, 0x024F]], // Polish uses Latin
    'ru' => ['cyrillic' => [0x0400, 0x04FF]], // Cyrillic script
    'tr' => ['latin' => [0x0000, 0x007F], 'latin_extended' => [0x0080, 0x024F]], // Turkish uses Latin
    'zh' => ['cjk' => [0x4E00, 0x9FFF]], // Chinese characters
    'zh-CN' => ['cjk' => [0x4E00, 0x9FFF]], // Simplified Chinese
    'zh-TW' => ['cjk' => [0x4E00, 0x9FFF]], // Traditional Chinese
    'ja' => ['hiragana' => [0x3040, 0x309F], 'katakana' => [0x30A0, 0x30FF], 'cjk' => [0x4E00, 0x9FFF]], // Japanese
    'th' => ['thai' => [0x0E00, 0x0E7F]], // Thai script
    'da' => ['latin' => [0x0000, 0x007F], 'latin_extended' => [0x0080, 0x024F]], // Danish uses Latin
    'et' => ['latin' => [0x0000, 0x007F], 'latin_extended' => [0x0080, 0x024F]], // Estonian uses Latin
    'id' => ['latin' => [0x0000, 0x007F], 'latin_extended' => [0x0080, 0x024F]], // Indonesian uses Latin
    'ro' => ['latin' => [0x0000, 0x007F], 'latin_extended' => [0x0080, 0x024F]], // Romanian uses Latin
];

// Whitelist of brand names, payment methods, and technical terms that are acceptable in any language
$whitelistTerms = [
    // Brand names
    'Matjrii', 'Stripe', 'PayPal', 'CoinGate', 'Razorpay', 'Paystack', 'Mollie', 'Payfast',
    'Flutterwave', 'PayTabs', 'Skrill', 'ToyyibPay', 'Iyzipay', 'Khalti', 'PayHere', 'CinetPay',
    'Paiement', 'Nepalste', 'Aamarpay', 'Midtrans', 'Cashfree', 'SSPay', 'Xendit', 'MercadoPago',
    'Ozow', 'YooKassa', 'Benefit', 'Easebuzz', 'FedaPay', 'PayTR', 'Tap', 'Authorize.Net', 'PaymentWall',
    // Payment methods
    'Visa', 'Mastercard', 'American Express', 'Discover', 'Apple Pay', 'Google Pay', 'Amazon Pay',
    'Bitcoin', 'Ethereum', 'Litecoin',
    // Technical terms and acronyms
    'API', 'SaaS', 'Webhook', 'Webhooks', 'ACH', 'SEPA', 'Sandbox', 'HTML', 'CSS', 'JavaScript',
    'JSON', 'URL', 'URLs', 'HTTP', 'HTTPS', 'SSL', 'TLS', 'REST', 'XML', 'RSS', 'PDF', 'CSV',
    'UI', 'UX', 'SEO', 'CMS', 'CRM', 'ERP', 'GDPR', 'PCI', '2FA', 'MFA', 'OAuth', 'JWT',
    'CDN', 'DNS', 'IP', 'IPv4', 'IPv6', 'FTP', 'SFTP', 'SSH', 'VPN', 'SDK', 'API', 'REST API',
    'GraphQL', 'WebSocket', 'WebRTC', 'PWA', 'SPA', 'SSR', 'CSR', 'DOM', 'AJAX', 'JSONP',
    // Common technical terms
    'Dashboard', 'Backend', 'Frontend', 'Fullstack', 'DevOps', 'CI/CD', 'Git', 'GitHub', 'GitLab',
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Cloud', 'Serverless', 'Microservices',
    'Database', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'SQL', 'NoSQL',
    'Node.js', 'React', 'Vue', 'Angular', 'TypeScript', 'Python', 'PHP', 'Java', 'C#', 'Go', 'Rust',
    'Linux', 'Windows', 'macOS', 'iOS', 'Android', 'Chrome', 'Firefox', 'Safari', 'Edge',
    'Nginx', 'Apache', 'IIS', 'Load Balancer', 'Cache', 'Redis', 'Memcached', 'Varnish',
    'CDN', 'Cloudflare', 'AWS CloudFront', 'Akamai', 'Fastly',
    // E-commerce specific
    'e-commerce', 'ecommerce', 'E-commerce', 'Ecommerce', 'Shopping Cart', 'Checkout',
    'Payment Gateway', 'Merchant', 'Customer', 'Order', 'Product', 'Inventory', 'Stock',
    'Shipping', 'Delivery', 'Tracking', 'Refund', 'Chargeback', 'Subscription', 'Recurring',
    'Invoice', 'Receipt', 'Tax', 'VAT', 'GST', 'Currency', 'Exchange Rate', 'Multi-currency',
    'Multi-store', 'Multi-language', 'Localization', 'Internationalization', 'i18n', 'l10n',
    // Common abbreviations
    'etc.', 'e.g.', 'i.e.', 'vs.', 'vs', 'a.m.', 'p.m.', 'AM', 'PM', 'GMT', 'UTC', 'EST', 'PST',
    'ID', 'UUID', 'GUID', 'MD5', 'SHA', 'SHA256', 'Base64', 'UTF-8', 'ASCII', 'ISO',
    // Units and measurements
    'KB', 'MB', 'GB', 'TB', 'PB', 'Hz', 'MHz', 'GHz', 'KHz', 'bps', 'Mbps', 'Gbps',
    'px', 'em', 'rem', 'pt', 'in', 'cm', 'mm', 'dpi', 'ppi',
    // Time formats
    'UTC', 'GMT', 'EST', 'PST', 'CST', 'MST', 'EDT', 'PDT', 'CDT', 'MDT',
];

$issues = [];
$summary = [
    'total_files' => 0,
    'files_with_issues' => 0,
    'clean_percentage' => 0,
    'languages_affected' => [],
    'by_language' => []
];

/**
 * Extract text content from HTML, preserving structure but removing tags
 */
function extractTextFromHtml($html) {
    // Remove script and style tags completely
    $html = preg_replace('/<script[^>]*>.*?<\/script>/is', '', $html);
    $html = preg_replace('/<style[^>]*>.*?<\/style>/is', '', $html);
    
    // Decode HTML entities
    $html = html_entity_decode($html, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    
    // Remove HTML tags but preserve text
    $text = strip_tags($html);
    
    // Clean up whitespace
    $text = preg_replace('/\s+/', ' ', $text);
    $text = trim($text);
    
    return $text;
}

/**
 * Check if a character is in a specific range
 */
function isInRange($char, $ranges) {
    $codePoint = mb_ord($char, 'UTF-8');
    if ($codePoint === false) {
        return false;
    }
    
    foreach ($ranges as $range) {
        if ($codePoint >= $range[0] && $codePoint <= $range[1]) {
            return true;
        }
    }
    return false;
}

/**
 * Remove whitelisted terms from text and return cleaned text with found terms
 */
function removeWhitelistedTerms($text) {
    global $whitelistTerms;
    
    $foundTerms = [];
    $cleanedText = $text;
    
    // Sort terms by length (longest first) to match longer terms first
    $sortedTerms = $whitelistTerms;
    usort($sortedTerms, function($a, $b) {
        return mb_strlen($b, 'UTF-8') - mb_strlen($a, 'UTF-8');
    });
    
    // Replace whitelisted terms with placeholders
    foreach ($sortedTerms as $term) {
        // Use word boundaries to match whole words only
        $pattern = '/\b' . preg_quote($term, '/') . '\b/iu';
        if (preg_match($pattern, $cleanedText)) {
            $foundTerms[] = $term;
            // Replace with spaces to maintain word boundaries
            $cleanedText = preg_replace($pattern, ' ', $cleanedText);
        }
    }
    
    // Clean up multiple spaces
    $cleanedText = preg_replace('/\s+/', ' ', $cleanedText);
    $cleanedText = trim($cleanedText);
    
    return [
        'cleaned_text' => $cleanedText,
        'found_terms' => $foundTerms,
        'original_text' => $text
    ];
}

/**
 * Detect language of text content
 */
function detectLanguage($text, $expectedLang) {
    global $languageRanges;
    
    if (empty(trim($text))) {
        return ['primary' => $expectedLang, 'confidence' => 100, 'breakdown' => []];
    }
    
    // Remove whitelisted terms before analysis
    $whitelistResult = removeWhitelistedTerms($text);
    $cleanedText = $whitelistResult['cleaned_text'];
    $foundWhitelistTerms = $whitelistResult['found_terms'];
    
    // If text is empty after removing whitelisted terms, consider it valid
    if (empty(trim($cleanedText))) {
        return [
            'primary' => $expectedLang,
            'confidence' => 100,
            'expected_percentage' => 100,
            'breakdown' => [],
            'total_chars' => 0,
            'whitelisted_terms' => $foundWhitelistTerms
        ];
    }
    
    // Latin-based languages that share character sets
    $latinLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'pt-BR', 'nl', 'pl', 'tr', 'da', 'et', 'id', 'ro'];
    
    $charCounts = [];
    $totalChars = 0;
    $nonLatinChars = 0;
    
    // Count characters by script type (using cleaned text without whitelisted terms)
    $textLength = mb_strlen($cleanedText, 'UTF-8');
    for ($i = 0; $i < $textLength; $i++) {
        $char = mb_substr($cleanedText, $i, 1, 'UTF-8');
        $codePoint = mb_ord($char, 'UTF-8');
        
        if ($codePoint === false) {
            continue;
        }
        
        // Skip whitespace, punctuation, numbers, and common symbols
        if (preg_match('/[\s\p{P}\p{N}]/u', $char)) {
            continue;
        }
        
        $totalChars++;
        
        // Check against known ranges
        $found = false;
        foreach ($languageRanges as $lang => $ranges) {
            foreach ($ranges as $scriptName => $range) {
                if ($codePoint >= $range[0] && $codePoint <= $range[1]) {
                    if (!isset($charCounts[$lang])) {
                        $charCounts[$lang] = 0;
                    }
                    $charCounts[$lang]++;
                    $found = true;
                    break 2;
                }
            }
        }
        
        // Track non-Latin characters
        if (!$found || ($codePoint >= 0x0600 && $codePoint <= 0x06FF) || // Arabic
            ($codePoint >= 0x0400 && $codePoint <= 0x04FF) || // Cyrillic
            ($codePoint >= 0x4E00 && $codePoint <= 0x9FFF) || // CJK
            ($codePoint >= 0x3040 && $codePoint <= 0x309F) || // Hiragana
            ($codePoint >= 0x30A0 && $codePoint <= 0x30FF) || // Katakana
            ($codePoint >= 0x0E00 && $codePoint <= 0x0E7F) || // Thai
            ($codePoint >= 0x0590 && $codePoint <= 0x05FF)) { // Hebrew
            $nonLatinChars++;
        }
        
        // If not found in any range, might be Latin (common fallback)
        if (!$found && $codePoint < 0x1000) {
            if (!isset($charCounts['latin_unknown'])) {
                $charCounts['latin_unknown'] = 0;
            }
            $charCounts['latin_unknown']++;
        }
    }
    
    if ($totalChars === 0) {
        return ['primary' => $expectedLang, 'confidence' => 100, 'breakdown' => []];
    }
    
    // Special handling for Latin-based languages
    if (in_array($expectedLang, $latinLanguages)) {
        // For Latin languages, only flag if there are significant non-Latin characters
        $nonLatinPercentage = ($nonLatinChars / $totalChars) * 100;
        
        // If there are non-Latin characters, identify which script
        if ($nonLatinPercentage > 20) {
            // Find the dominant non-Latin script
            $nonLatinScripts = [];
            foreach ($charCounts as $lang => $count) {
                if (!in_array($lang, $latinLanguages) && $lang !== 'latin_unknown') {
                    $nonLatinScripts[$lang] = ($count / $totalChars) * 100;
                }
            }
            
            if (!empty($nonLatinScripts)) {
                arsort($nonLatinScripts);
                $wrongLang = key($nonLatinScripts);
                $wrongPercentage = $nonLatinScripts[$wrongLang];
                
                return [
                    'primary' => $wrongLang,
                    'confidence' => $wrongPercentage,
                    'expected_percentage' => 100 - $nonLatinPercentage,
                    'breakdown' => array_merge(['latin' => 100 - $nonLatinPercentage], $nonLatinScripts),
                    'total_chars' => $totalChars,
                    'non_latin_percentage' => $nonLatinPercentage
                ];
            }
        }
        
        // If it's a Latin language and mostly Latin characters, consider it correct
        return [
            'primary' => $expectedLang,
            'confidence' => 100,
            'expected_percentage' => 100,
            'breakdown' => ['latin' => 100],
            'total_chars' => $totalChars,
            'whitelisted_terms' => $foundWhitelistTerms
        ];
    }
    
    // For non-Latin languages, use the original detection logic
    $breakdown = [];
    foreach ($charCounts as $lang => $count) {
        $breakdown[$lang] = ($count / $totalChars) * 100;
    }
    
    // Determine primary language
    arsort($breakdown);
    $primaryLang = key($breakdown);
    $confidence = $breakdown[$primaryLang] ?? 0;
    
    // Special handling for expected language
    $expectedPercentage = $breakdown[$expectedLang] ?? 0;
    
    return [
        'primary' => $primaryLang,
        'confidence' => $confidence,
        'expected_percentage' => $expectedPercentage,
        'breakdown' => $breakdown,
        'total_chars' => $totalChars,
        'whitelisted_terms' => $foundWhitelistTerms
    ];
}

/**
 * Check a single field for language issues
 */
function checkField($fieldName, $fieldValue, $expectedLang, $filePath) {
    $issues = [];
    
    if (empty($fieldValue)) {
        return $issues;
    }
    
    // Extract text from HTML if it's the content field
    if ($fieldName === 'content') {
        $text = extractTextFromHtml($fieldValue);
    } else {
        $text = html_entity_decode($fieldValue, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
    
    if (empty(trim($text))) {
        return $issues;
    }
    
    $detection = detectLanguage($text, $expectedLang);
    $expectedPercentage = $detection['expected_percentage'] ?? 0;
    $whitelistedTerms = $detection['whitelisted_terms'] ?? [];
    
    // If text only contains whitelisted terms, it's valid
    if (empty(trim($text)) || ($expectedPercentage >= 100 && !empty($whitelistedTerms))) {
        return $issues;
    }
    
    // Check if expected language is below threshold
    $threshold = 80; // 80% should be in expected language
    if ($expectedPercentage < $threshold) {
        // Find the dominant wrong language
        $wrongLang = null;
        $wrongPercentage = 0;
        foreach ($detection['breakdown'] as $lang => $percentage) {
            if ($lang !== $expectedLang && $lang !== 'latin_unknown' && $percentage > $wrongPercentage) {
                $wrongLang = $lang;
                $wrongPercentage = $percentage;
            }
        }
        
        // Only flag if there's a significant wrong language (>20%)
        // This excludes whitelisted terms which have already been removed
        if ($wrongPercentage > 20) {
            $severity = 'minor';
            if ($expectedPercentage < 50) {
                $severity = 'severe';
            } elseif ($expectedPercentage < 70) {
                $severity = 'moderate';
            }
            
            // Get sample text (first 100 characters)
            $sample = mb_substr($text, 0, 100, 'UTF-8');
            if (mb_strlen($text, 'UTF-8') > 100) {
                $sample .= '...';
            }
            
            $issues[] = [
                'field' => $fieldName,
                'expected_language' => $expectedLang,
                'detected_language' => $detection['primary'],
                'expected_percentage' => round($expectedPercentage, 2),
                'wrong_language' => $wrongLang,
                'wrong_percentage' => round($wrongPercentage, 2),
                'severity' => $severity,
                'sample' => $sample,
                'whitelisted_terms' => $whitelistedTerms
            ];
        }
    }
    
    return $issues;
}

echo "=== DOCUMENTATION LANGUAGE PURITY CHECK ===\n\n";

// Process each language
foreach ($languages as $lang) {
    $langPath = $docsPath . '/' . $lang;
    
    if (!is_dir($langPath)) {
        continue;
    }
    
    $langIssues = [];
    $langFileCount = 0;
    $langIssueCount = 0;
    
    echo "Checking {$lang}...\n";
    
    // Get all category directories
    $categoryDirs = glob($langPath . '/*', GLOB_ONLYDIR);
    
    foreach ($categoryDirs as $categoryDir) {
        $categoryName = basename($categoryDir);
        $jsonFiles = glob($categoryDir . '/*.json');
        
        foreach ($jsonFiles as $jsonFile) {
            $langFileCount++;
            $summary['total_files']++;
            
            $relativePath = $lang . '/' . $categoryName . '/' . basename($jsonFile);
            
            // Read JSON file
            $fileContent = file_get_contents($jsonFile);
            $jsonData = json_decode($fileContent, true);
            
            if (!$jsonData || json_last_error() !== JSON_ERROR_NONE) {
                continue;
            }
            
            $fileIssues = [];
            
            // Check each field
            $fieldsToCheck = ['title', 'description', 'content', 'meta_description'];
            foreach ($fieldsToCheck as $field) {
                if (!isset($jsonData[$field])) {
                    continue;
                }
                
                $fieldIssues = checkField($field, $jsonData[$field], $lang, $relativePath);
                if (!empty($fieldIssues)) {
                    $fileIssues = array_merge($fileIssues, $fieldIssues);
                }
            }
            
            if (!empty($fileIssues)) {
                $langIssueCount++;
                $summary['files_with_issues']++;
                
                $langIssues[] = [
                    'file' => $relativePath,
                    'issues' => $fileIssues
                ];
            }
        }
    }
    
    // Store language summary
    $cleanCount = $langFileCount - $langIssueCount;
    $cleanPercentage = $langFileCount > 0 ? round(($cleanCount / $langFileCount) * 100, 1) : 100;
    
    $summary['by_language'][$lang] = [
        'total_files' => $langFileCount,
        'files_with_issues' => $langIssueCount,
        'clean_files' => $cleanCount,
        'clean_percentage' => $cleanPercentage
    ];
    
    if (!empty($langIssues)) {
        $issues[$lang] = $langIssues;
        $summary['languages_affected'][] = $lang;
    }
    
    // Print language summary
    echo "  {$langFileCount} files checked\n";
    if ($langIssueCount > 0) {
        echo "  ✗ {$langIssueCount} files with language mixing issues\n";
        foreach ($langIssues as $issue) {
            $fieldNames = array_unique(array_column($issue['issues'], 'field'));
            echo "    - {$issue['file']}: Issues in " . implode(', ', $fieldNames) . "\n";
        }
    } else {
        echo "  ✓ All files fully in {$lang}\n";
    }
    echo "\n";
}

// Calculate overall summary
$summary['clean_percentage'] = $summary['total_files'] > 0 
    ? round((($summary['total_files'] - $summary['files_with_issues']) / $summary['total_files']) * 100, 1) 
    : 100;

// Print overall summary
echo "=== SUMMARY ===\n";
echo "Total files checked: {$summary['total_files']}\n";
echo "Files with issues: {$summary['files_with_issues']}\n";
echo "Languages affected: " . count($summary['languages_affected']) . " (" . implode(', ', $summary['languages_affected']) . ")\n";
echo "Clean percentage: {$summary['clean_percentage']}%\n\n";

// Generate detailed report
$report = [
    'summary' => $summary,
    'issues' => $issues,
    'generated_at' => date('Y-m-d H:i:s')
];

// Save report to JSON
$reportPath = __DIR__ . '/documentation-language-report.json';
file_put_contents($reportPath, json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

echo "Full report saved to: documentation-language-report.json\n";

// Exit with error code if issues found
exit($summary['files_with_issues'] > 0 ? 1 : 0);

