import json
import re

# Load both files
with open('resources/lang/en.json', 'r', encoding='utf-8') as f:
    en = json.load(f)

with open('resources/lang/ar.json', 'r', encoding='utf-8') as f:
    ar = json.load(f)

# Quality checks
issues = {
    'untranslated': [],
    'machine_translation_markers': [],
    'bracket_inconsistency': [],
    'html_broken': [],
    'placeholder_issues': [],
    'poor_quality': []
}

for key in en.keys():
    if key not in ar:
        continue

    en_val = en[key]
    ar_val = ar[key]

    # Skip if not string
    if not isinstance(en_val, str) or not isinstance(ar_val, str):
        continue

    # Check if Arabic translation is just the English text (untranslated)
    if en_val == ar_val and len(en_val) > 3:
        issues['untranslated'].append(key)

    # Check for machine translation markers like parentheses around brand names
    if '(' in ar_val and ')' in ar_val and '(' not in en_val:
        issues['machine_translation_markers'].append(key)

    # Check for HTML tag consistency
    en_tags = re.findall(r'<[^>]+>', en_val)
    ar_tags = re.findall(r'<[^>]+>', ar_val)
    if len(en_tags) != len(ar_tags):
        issues['html_broken'].append(key)

    # Check for placeholder consistency
    en_placeholders = re.findall(r'\{[^}]+\}|%[sd]|:[a-z_]+', en_val)
    ar_placeholders = re.findall(r'\{[^}]+\}|%[sd]|:[a-z_]+', ar_val)
    if len(en_placeholders) != len(ar_placeholders):
        issues['placeholder_issues'].append(key)

    # Check for poor quality indicators
    if '...' in ar_val and '...' not in en_val:
        issues['poor_quality'].append(key)

print('=== QUALITY ANALYSIS ===')
print(f'Untranslated (EN = AR): {len(issues["untranslated"])}')
print(f'Machine translation markers: {len(issues["machine_translation_markers"])}')
print(f'HTML tag inconsistency: {len(issues["html_broken"])}')
print(f'Placeholder inconsistency: {len(issues["placeholder_issues"])}')
print(f'Poor quality markers: {len(issues["poor_quality"])}')

# Show examples
print('\n=== UNTRANSLATED STRINGS ===')
for key in issues['untranslated'][:10]:
    print(f'"{key}": "{en[key]}"')

print('\n=== MACHINE TRANSLATION MARKERS (parentheses around brands) ===')
for key in issues['machine_translation_markers'][:15]:
    print(f'{key}:')
    print(f'  EN: {en[key]}')
    print(f'  AR: {ar[key]}')
    print()

print('\n=== PLACEHOLDER ISSUES ===')
for key in issues['placeholder_issues'][:10]:
    print(f'{key}:')
    print(f'  EN: {en[key]}')
    print(f'  AR: {ar[key]}')
    print()
