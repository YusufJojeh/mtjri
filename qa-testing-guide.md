# QA Testing Guide for Multi-Language Documentation

This guide provides comprehensive testing procedures for the multi-language documentation system.

## Phase 3: Quality Assurance Testing

### 1. Content Accuracy Review

#### Checklist:
- [ ] Verify translations are accurate and contextually appropriate
- [ ] Check technical terms are correctly translated (or kept in English if standard)
- [ ] Ensure brand name "Matjrii" is preserved consistently across all translations
- [ ] Verify proper nouns and product names are handled correctly
- [ ] Check for machine translation artifacts (unnatural phrasing, literal translations)

#### Test Procedure:
1. Sample 5-10 articles from each language
2. Review title, description, and first 2-3 sections of content
3. Verify technical accuracy
4. Check brand name consistency
5. Note any issues in testing log

#### Files to Review:
- Random samples from `resources/docs/{locale}/{category}/*.json`
- Focus on: title, description, content (first sections)

---

### 2. Language Purity Check

#### Checklist:
- [ ] Arabic documentation is fully in Arabic (no English mixing)
- [ ] English documentation is fully in English (no other language mixing)
- [ ] Spanish documentation is fully in Spanish
- [ ] French documentation is fully in French
- [ ] German documentation is fully in German
- [ ] All other languages are fully in their target language
- [ ] Brand names (Matjrii, Stripe, PayPal, etc.) are preserved as-is
- [ ] Technical terms are handled appropriately (translated or kept in English)

#### Test Procedure:
1. Run `php check-documentation-language.php` for automated language purity check
2. Review the generated report for any language mixing issues
3. Manually verify flagged files to confirm if issues are real or false positives
4. Check that brand names and technical terms are handled correctly
5. Fix any genuine language mixing issues

#### Automated Check:
```bash
php check-documentation-language.php
```
Review `documentation-language-report.json` for detailed language mixing issues.

#### Report Structure:
The script generates a comprehensive report showing:
- Summary by language (total files, files with issues, clean percentage)
- Detailed list of files with language mixing issues
- For each problematic file:
  - Which fields have issues (title, description, content, meta_description)
  - Percentage of wrong language detected
  - Sample snippets showing the issue
  - Severity level (minor, moderate, severe)

#### Expected Results:
- **Arabic (ar)**: Should be 100% Arabic script, except for brand names
- **English (en)**: Should be 100% Latin script
- **Spanish (es)**: Should be 100% Latin script (Spanish)
- **French (fr)**: Should be 100% Latin script (French)
- **German (de)**: Should be 100% Latin script (German)
- **Other languages**: Should match their expected character sets

#### Handling False Positives:
The script may flag legitimate cases:
- **Brand names**: "Matjrii", "Stripe", "PayPal" in Arabic text are acceptable
- **Technical terms**: Some technical terms may remain in English
- **URLs and links**: Should be preserved as-is

Review flagged files manually to determine if they need fixing or are acceptable.

#### Manual Verification:
1. Open flagged file in text editor
2. Check the flagged field (title, description, content, meta_description)
3. Identify if English words are:
   - Brand names (acceptable)
   - Technical terms (may be acceptable)
   - Actual content that should be translated (needs fixing)
4. Fix any genuine issues by translating the content

#### Files to Check:
- All JSON files in `resources/docs/{locale}/{category}/*.json`
- Focus on languages with existing content:
  - Arabic (ar) - ~34 articles
  - Spanish (es) - ~33 articles
  - French (fr) - ~33 articles
  - German (de) - ~33 articles
  - English (en) - ~64 articles (reference)

---

### 3. Links Verification

#### Checklist:
- [ ] All internal links (`/docs/...`) work correctly
- [ ] Link slugs match translated article slugs (slugs should NOT be translated)
- [ ] Navigation between articles works in each language
- [ ] Previous/Next article links work correctly
- [ ] Category links work correctly

#### Test Procedure:
1. Run `php check-translation-links.php` to get automated report
2. Manually test 10 random links from different languages
3. Verify links maintain language context when clicked
4. Test navigation flow: category → article → next article

#### Automated Check:
```bash
php check-translation-links.php
```
Review `translation-links-report.json` for broken links.

#### Manual Test Scenarios:
1. Open article in language X
2. Click internal link to another article
3. Verify article loads in same language X
4. Verify target article exists and displays correctly
5. Test Previous/Next navigation
6. Test category navigation

---

### 4. Completeness Check

#### Checklist:
- [ ] All 64 articles exist in all 22 languages
- [ ] No missing categories
- [ ] All articles have required fields
- [ ] All articles are properly categorized

#### Test Procedure:
1. Run `php qa-completeness-check.php` for automated report
2. Verify report shows 100% completeness for all languages
3. Spot-check random articles across languages

#### Automated Check:
```bash
php qa-completeness-check.php
```
Review `qa-completeness-report.json` for missing articles.

#### Expected Results:
- 64 articles in English (base)
- 64 articles in each of 21 other languages
- Total: 1,344 translated articles (64 × 21)

---

### 5. HTML Content Quality

#### Checklist:
- [ ] HTML structure is valid
- [ ] Headings hierarchy is correct (h1, h2, h3, etc.)
- [ ] Lists, links, and formatting are preserved
- [ ] No broken HTML tags
- [ ] No unclosed tags
- [ ] Special characters are properly encoded (UTF-8)
- [ ] HTML entities are handled correctly

#### Test Procedure:
1. Run `php validate-translations.php` for automated validation
2. Sample 10 articles from different languages
3. View source HTML in browser developer tools
4. Check for HTML validation errors
5. Verify formatting displays correctly

#### Automated Check:
```bash
php validate-translations.php
```
Review `translation-validation-report.json` for HTML issues.

#### RTL Languages (ar, he, fa):
- [ ] Content displays correctly in RTL mode
- [ ] Text alignment is correct
- [ ] Lists align properly
- [ ] Images and layout work in RTL

#### Manual HTML Check:
1. Open article in browser
2. Right-click → Inspect Element
3. Check HTML structure in Elements panel
4. Look for validation warnings in Console
5. Verify visual formatting matches intended design

---

### 6. Metadata Quality

#### Checklist:
- [ ] Meta descriptions are appropriate length (150-160 chars ideal)
- [ ] Titles are translated and descriptive
- [ ] Descriptions accurately reflect article content
- [ ] SEO-friendly titles and descriptions

#### Test Procedure:
1. Sample 20 articles from different languages
2. Check title length and quality
3. Check meta_description length and relevance
4. Verify descriptions match article content

#### Automated Check:
Create script to check metadata length:
```php
// Check meta_description length
foreach ($articles as $article) {
    $metaLength = mb_strlen($article['meta_description'] ?? '');
    if ($metaLength < 120 || $metaLength > 170) {
        // Flag for review
    }
}
```

---

## Phase 4: Functional Testing

### 1. Language Switching

#### Test Scenarios:

**Scenario 1: Language Switcher on Documentation Pages**
1. Navigate to `/docs` or any article page
2. Click language switcher
3. Select different language
4. Verify page reloads with new language
5. Verify article content changes to selected language
6. Test all 22 languages

**Scenario 2: URL Locale Parameter**
1. Navigate to `/docs/introduction?locale=ar`
2. Verify Arabic article loads
3. Navigate to `/docs/introduction?locale=fr`
4. Verify French article loads
5. Test all languages via URL parameter

**Scenario 3: Fallback to English**
1. Navigate to article that doesn't exist in language X
2. Verify system falls back to English
3. Check no error page is shown
4. Verify English content displays correctly

#### Files to Test:
- `resources/js/pages/documentation/index.tsx`
- `resources/js/pages/documentation/show.tsx`
- `app/Http/Controllers/DocumentationController.php`

#### Expected Behavior:
- Language switcher updates page immediately
- URL parameter `?locale={code}` works correctly
- Fallback to English when translation missing
- Language preference persists (localStorage/cookie)

---

### 2. Search Functionality

#### Test Scenarios:

**Scenario 1: Search in Different Languages**
1. Open documentation page in language X
2. Use search functionality
3. Enter search term in language X
4. Verify results show articles in language X
5. Test search with translated titles

**Scenario 2: Search Results Language Matching**
1. Search for term while on Arabic page
2. Verify results show Arabic articles
3. Switch to French
4. Search same concept
5. Verify results show French articles

#### Expected Behavior:
- Search works in all languages
- Results match current language
- Search terms match translated content
- Search results are relevant and accurate

---

### 3. Navigation Testing

#### Test Scenarios:

**Scenario 1: Category Navigation**
1. Navigate to documentation index
2. Click category in sidebar
3. Verify category articles list displays
4. Test all categories in different languages
5. Verify category names are translated (if applicable)

**Scenario 2: Previous/Next Article Links**
1. Open any article
2. Click "Next" button
3. Verify next article in same language loads
4. Verify correct article sequence
5. Test "Previous" button
6. Test at start/end of sequence

**Scenario 3: Breadcrumb Navigation**
1. Navigate through category → article
2. Verify breadcrumbs show correct path
3. Click breadcrumb link
4. Verify navigation works correctly

**Scenario 4: Table of Contents**
1. Open article with multiple headings
2. Verify table of contents generates
3. Click TOC link
4. Verify page scrolls to correct section
5. Test in different languages

#### Files to Test:
- `resources/js/pages/documentation/show.tsx` (TOC, Previous/Next)
- `resources/js/pages/documentation/index.tsx` (category navigation)
- `app/Http/Controllers/DocumentationController.php` (article sequencing)

---

### 4. Responsive Design Testing

#### Test Scenarios:

**Scenario 1: Mobile Device Testing**
1. Open documentation on mobile device (or browser dev tools)
2. Test article display on small screens
3. Verify navigation menu works on mobile
4. Test category navigation on mobile
5. Verify content is readable

**Scenario 2: RTL Languages on Mobile**
1. Open Arabic article on mobile
2. Verify RTL layout works correctly
3. Verify text alignment is correct
4. Test navigation menu in RTL
5. Test Hebrew and Farsi as well

**Scenario 3: Different Screen Sizes**
1. Test at 320px width (mobile)
2. Test at 768px width (tablet)
3. Test at 1024px width (desktop)
4. Verify layout adapts correctly
5. Verify no horizontal scrolling

#### Browser Dev Tools:
- Chrome DevTools: Toggle device toolbar (F12 → Device icon)
- Test viewports: 320px, 768px, 1024px, 1920px
- Test device emulation: iPhone, iPad, Android

---

### 5. Cross-Language Testing

#### Test Scenarios:

**Scenario 1: Switching Languages Mid-Article**
1. Open article in language X
2. Scroll to middle of article
3. Switch language to Y
4. Verify article reloads in language Y
5. Verify scroll position is maintained (or resets appropriately)

**Scenario 2: Deep Linking**
1. Copy URL of article in language X: `/docs/article-slug?locale=fr`
2. Open in new browser/incognito
3. Verify article loads in correct language
4. Test with all languages

**Scenario 3: Language Persistence**
1. Select language X
2. Navigate to different article
3. Verify language X persists
4. Close and reopen browser
5. Verify language preference persists (localStorage/cookie)

#### Expected Behavior:
- Language switching works smoothly
- Deep links load correct language
- Language preference persists across sessions
- URL parameters work correctly

---

## Testing Checklist Summary

### Pre-Testing Setup
- [ ] All translation files validated (`php validate-translations.php`)
- [ ] Language purity checked (`php check-documentation-language.php`)
- [ ] All links checked (`php check-translation-links.php`)
- [ ] Completeness verified (`php qa-completeness-check.php`)
- [ ] Development server running
- [ ] Test browsers ready (Chrome, Firefox, Safari)

### Testing Execution
- [ ] Content accuracy review (sample articles)
- [ ] Language purity check (automated + manual verification)
- [ ] Links verification (automated + manual)
- [ ] Completeness check (automated)
- [ ] HTML quality check (automated + visual)
- [ ] Metadata quality (sample check)
- [ ] Language switching (all languages)
- [ ] Search functionality (multiple languages)
- [ ] Navigation testing (categories, Previous/Next, TOC)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Cross-language features (switching, deep links, persistence)

### Post-Testing
- [ ] Document all issues found
- [ ] Create issue report
- [ ] Prioritize fixes
- [ ] Re-test after fixes

---

## Issue Reporting Template

When finding issues, document:

```
**Language**: ar/es/fr/de/etc.
**Article**: category/article-slug
**Issue Type**: Content/Link/Navigation/Display/etc.
**Severity**: Critical/High/Medium/Low
**Description**: [Detailed description]
**Steps to Reproduce**: [Step-by-step]
**Expected Behavior**: [What should happen]
**Actual Behavior**: [What actually happens]
**Screenshots**: [If applicable]
```

---

## Notes

- Test in multiple browsers (Chrome, Firefox, Safari, Edge)
- Test on multiple devices (desktop, tablet, mobile)
- Test with different screen sizes
- Pay special attention to RTL languages (ar, he, fa)
- Keep detailed testing logs
- Document all issues found

