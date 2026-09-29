# Tijraa rebrand

User-facing product name is **Tijraa** everywhere. Legacy names (MTJRii, Matjrii,
matjri, StoreGo, "Powered by WorkDo") were removed from all merchant, public, auth,
email and documentation surfaces.

## What changed
- UI strings in all 23 locale files, in-app documentation (`resources/docs`),
  React pages/components, Blade views, seeders and platform defaults.
- Stored platform text (site title/footer, SEO keywords, landing page content,
  platform custom pages, email template text) via migration
  `2026_09_29_100000_rebrand_platform_content_to_tijraa`. Merchant-authored
  content (products, store pages, blog posts) is intentionally not rewritten.
- Platform theme moved from the legacy default green to the Tijraa preset via
  `2026_09_29_100100_set_platform_theme_to_tijraa` (merchant themes unchanged).
- Logo set regenerated from `public/images/logos/tijraa-mark.svg`
  (`logo-dark.png`, `logo-light.png`, icons, `favicon.ico`, `favicon.svg`) —
  same file paths, so existing brand settings pick them up.
- PWA manifest (`public/manifest.webmanifest`), theme-color and icon links;
  service-worker cache renamed `tijraa-pwa-v1`.
- Remote marketing screenshots (`https://mtjrii.com/storage/placeholder/...`)
  now load from the local `/storage/placeholder/...`.
- The previous owner's Google Tag Manager container was hard-coded on every
  page; it is now opt-in via `GTM_ID`.

## Technical identifiers intentionally kept
| Identifier | Where | Why kept |
|---|---|---|
| `StoreGo2024` | XOR key for encrypted plan links (`RegisteredUserController`, `RegistrationStepperController`) | Not visible; renaming breaks existing links |
| Repository/folder name `mtjri`, DB file path | infrastructure | Not user-facing |
| Historical migration filenames/defaults (e.g. `support@storego.com` column default in an old migration) | `database/migrations` | Migrations are history; data migration fixes stored rows |
| Legacy localStorage keys `idebar`, `idebarSettings` | shell settings | Read once for backwards compatibility |

Re-run `python3 scripts/rebrand-tijraa.py` if legacy strings are reintroduced;
`e2e/flows/branding.spec.ts` fails the build if any rendered page shows them.
