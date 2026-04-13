# Translation Guide for Landing Page Content

## Status
- ✅ **Spanish (es)** - Fully translated
- ✅ **Arabic (ar)** - Already translated  
- ✅ **Hebrew (he)** - Already translated
- ⚠️ **20 languages** still need translation

## Languages Needing Translation
es, da, de, fr, it, ja, nl, pl, pt, pt-BR, ru, tr, zh, fa, et, id, ro, th, zh-CN, zh-TW

## Translation Process

### Option 1: Use Translation Service
1. Use Google Translate API, DeepL, or similar service
2. Translate the `landing` section from `en.json`
3. Update each language file's `landing` section

### Option 2: Manual Translation
1. Open `resources/lang/en.json`
2. Find the `landing` section (lines 2506-2734)
3. Translate each key to the target language
4. Update the corresponding language file

### Option 3: Use the Translation Script
Run the helper script to see what needs translation:
```bash
php resources/lang/check-translations.php
```

## Key Sections to Translate

All content under `landing` object:
- `landing.hero.*` - Hero section (title, subtitle, buttons, stats)
- `landing.features.*` - Features section
- `landing.whyChooseUs.*` - Why Choose Us section
- `landing.pricing.*` - Pricing section
- `landing.faq.*` - FAQ section
- `landing.newsletter.*` - Newsletter section
- `landing.about.*` - About section
- `landing.contact.*` - Contact section
- `landing.screenshots.*` - Screenshots section
- `landing.team.*` - Team section
- `landing.testimonials.*` - Testimonials section
- `landing.templates.*` - Templates section
- `landing.header.*` - Header menu

## Important Notes

1. **Keep structure identical** - Only translate values, not keys
2. **Preserve placeholders** - Keep URLs, numbers, and special characters
3. **Maintain context** - Ensure translations make sense in context
4. **Test after translation** - Verify the page displays correctly

## Example: Spanish Translation (Completed)

See `resources/lang/es.json` lines 2506-2734 for reference.

