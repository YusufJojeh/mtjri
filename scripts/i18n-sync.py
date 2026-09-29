#!/usr/bin/env python3
"""
Sync UI strings used by the merchant frontend into resources/lang/{en,ar}.json.

Keys are English source strings (react-i18next `t('...')`). For every key
found in the scanned files:
  * en.json gets the identity mapping if missing;
  * ar.json gets the translation from scripts/i18n/ar*.json if missing.
Prints keys that still lack an Arabic translation. Existing entries are
never overwritten.

Usage: python3 scripts/i18n-sync.py [--check] <files or dirs...>
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LANG = os.path.join(ROOT, 'resources', 'lang')
AR_DIR = os.path.join(ROOT, 'scripts', 'i18n')
PATTERN = re.compile(r"""\bt\(\s*(['"])((?:\\.|(?!\1).)+)\1""")
# Source-string tables consumed via t(meta.label) etc. (lib/commerce only).
TABLE_PATTERN = re.compile(r"""\b(?:label|title|body)\s*:\s*(['"])((?:\\.|(?!\1).)+)\1""")

def collect(paths):
    keys = set()
    for p in paths:
        files = []
        if os.path.isdir(p):
            for d, _, fs in os.walk(p):
                files += [os.path.join(d, f) for f in fs if f.endswith(('.ts', '.tsx')) and '__tests__' not in d]
        else:
            files.append(p)
        for f in files:
            src = open(f, encoding='utf-8').read()
            pats = [PATTERN] + ([TABLE_PATTERN] if os.sep + 'lib' + os.sep + 'commerce' + os.sep in os.path.abspath(f) else [])
            for pat in pats:
                for m in pat.finditer(src):
                    keys.add(m.group(2).replace("\\'", "'").replace('\\"', '"'))
    return keys

def main():
    args = sys.argv[1:]
    check = '--check' in args
    paths = [a for a in args if a != '--check']
    keys = collect(paths)
    # Arabic source translations: every scripts/i18n/ar*.json file (one per workstream).
    ar_src = {}
    for name in sorted(os.listdir(AR_DIR)) if os.path.isdir(AR_DIR) else []:
        if name.startswith('ar') and name.endswith('.json'):
            ar_src.update(json.load(open(os.path.join(AR_DIR, name), encoding='utf-8')))
    changed = {}
    missing_ar = []
    for code in ('en', 'ar'):
        path = os.path.join(LANG, f'{code}.json')
        data = json.load(open(path, encoding='utf-8'))
        added = 0
        for k in sorted(keys):
            if k in data:
                continue
            if code == 'en':
                data[k] = k; added += 1
            elif k in ar_src:
                data[k] = ar_src[k]; added += 1
            else:
                missing_ar.append(k)
        if added and not check:
            with open(path, 'w', encoding='utf-8') as fh:
                json.dump(data, fh, ensure_ascii=False, indent=4)
                fh.write('\n')
        changed[code] = added
    if missing_ar:
        print('MISSING ARABIC (%d):' % len(missing_ar))
        for k in missing_ar: print('  ' + json.dumps(k, ensure_ascii=False))
    sys.exit(1 if (check and (missing_ar or changed['en'] or changed['ar'])) else 0)

main()
