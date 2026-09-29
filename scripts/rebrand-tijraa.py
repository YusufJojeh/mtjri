#!/usr/bin/env python3
"""
One-off rebrand of user-facing text to "Tijraa".
Technical identifiers (DB names, XOR link key, package names, migration
file names) are intentionally untouched; see docs/rebrand-tijraa.md.
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INCLUDE_DIRS = ['resources/lang', 'resources/docs', 'resources/js', 'resources/views', 'resources/css',
                'app', 'config', 'database/seeders', 'routes', 'public/sw.js', 'sw.js', 'README.md']
SKIP_PARTS = ['/node_modules/', '/vendor/', '/public/build/']
EXTS = ('.json', '.md', '.ts', '.tsx', '.js', '.php', '.css', '.html', '.txt')

ORDERED = [
    (r'https?://mtjrii\.com/storage/placeholder/', '/storage/placeholder/'),
    (r'(your|my)store\.matjrii\.com', r'\1store.tijraa.com'),
    (r'\.matjri\.com', '.tijraa.com'),
    (r'mtjrii\.com', 'tijraa.com'),
    (r'storego\.com', 'tijraa.com'),
    (r'©\s*20\d\d\s*StoreGo SaaS\. Powered by WorkDo\.', '© 2026 Tijraa. All rights reserved.'),
    (r'StoreGo SaaS', 'Tijraa'),
    (r'storego-pwa-v1', 'tijraa-pwa-v1'),
    (r'MTJRii|MATJRII|Mtjrii|mtjrii|Matjrii|MATJRI|Matjri\b', 'Tijraa'),
    (r"'matjri'", "'Tijraa'"),
    (r'\bmatjri\b(?!0)', 'Tijraa'),
    (r'\bStoreGo\b|\bStorego\b', 'Tijraa'),
]
# Keep technical/opaque identifiers.
PROTECT = ['StoreGo2024', 'storego-saas-react', '/product/storego/']

def process(path):
    src = open(path, encoding='utf-8').read()
    out = src
    tokens = {}
    for i, p in enumerate(PROTECT):
        tok = f'\x00P{i}\x00'
        tokens[tok] = p
        out = out.replace(p, tok)
    for pat, rep in ORDERED:
        out = re.sub(pat, rep, out)
    for tok, p in tokens.items():
        out = out.replace(tok, p)
    if out != src:
        open(path, 'w', encoding='utf-8').write(out)
        return True
    return False

changed = []
for inc in INCLUDE_DIRS:
    full = os.path.join(ROOT, inc)
    if os.path.isfile(full):
        if process(full): changed.append(inc)
        continue
    for d, _, files in os.walk(full):
        if any(s in d + '/' for s in SKIP_PARTS): continue
        for f in files:
            if f.endswith(EXTS):
                p = os.path.join(d, f)
                if process(p): changed.append(os.path.relpath(p, ROOT))
print(f'{len(changed)} files updated')
for c in changed: print(' ', c)
