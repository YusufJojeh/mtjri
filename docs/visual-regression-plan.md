# Visual regression plan

## Tooling choice

- **Playwright** (`@playwright/test`) — fits the Laravel + Vite + Inertia stack; runs against a real `php artisan serve` instance; supports **screenshot assertions** with `expect(page).toHaveScreenshot()` and **`animations: 'disabled'`** to reduce flake from CSS/Framer motion.

## Layout

| Path | Purpose |
|------|---------|
| `playwright.config.ts` | Projects, webServer, snapshot paths, expect defaults |
| `e2e/visual/critical.spec.ts` | Public marketing + auth entry screenshots |
| `e2e/visual/authenticated.spec.ts` | Dashboard/products/profile/dialog when `PLAYWRIGHT_STORAGE_STATE` file exists |
| `e2e/README.md` | Commands and env vars |

## Covered routes (baseline)

| Route | Viewport(s) | Stability notes |
|-------|-------------|------------------|
| `/` (landing) | desktop 1280×720, mobile 390×844, tablet 834×1112 | Wait for `[data-landing-page]`; disable animations in snapshot |
| `/login` | desktop | `[data-testid="auth-shell"]` |
| `/register` | desktop | Full page |
| `/contact` | desktop | Public Inertia page |
| `/docs` | desktop | File-based docs |
| `/dashboard` | desktop | **Optional** — requires `PLAYWRIGHT_STORAGE_STATE` or run `auth.setup` |
| `/products` | desktop | **Optional** — same |
| `/products/{id}/edit` | desktop | **Optional** — set `PLAYWRIGHT_PRODUCT_ID` |
| `/settings` | desktop | **Optional** — auth |
| Dialog | — | **Optional** — open delete product dialog when auth + product exist |

## Viewport matrix

- **Desktop:** 1280 × 720 (primary baseline)
- **Mobile:** 390 × 844 (iPhone-class)
- **Tablet:** 834 × 1112 (iPad-class)

## Known unstable areas

- **Clock / dates** — avoid visible timestamps in cropped regions; full-page landing is mostly static.
- **i18n** — default language is `ar`; tests **force `locale=en`** via `?lng=en` on first navigation and `localStorage` seed in `beforeEach` where needed.
- **Landing disabled** — if `isLandingPageEnabled()` is false, `/` redirects to `/login`; document `LANDING_PAGE=true` in `.env` for local visual runs.
- **Auth tests** — superadmin vs company dashboards differ; optional snapshots should use a **fixed** test account.
- **Dynamic metrics** on dashboard — optional snapshots may differ; prefer **public** routes for CI baselines.

## How snapshots are stabilized

1. **`expect` config:** `toHaveScreenshot: { animations: 'disabled', maxDiffPixels: 150 }` (tune per project).
2. **Wait for selectors** before screenshot — `locator.waitFor({ state: 'visible' })`.
3. **Locale:** Playwright `storageState` or `addInitScript` to set `localStorage` i18next keys / query `lng=en`.
4. **No network idle dependency** on Inertia — use **domcontentloaded** + selector wait.
5. **Optional auth** — separate Playwright **project** `authenticated` that depends on `setup` and is skipped in CI without secrets.

## What remains uncovered

- Full **storefront** themes (`/store/{slug}`) — high variance, many themes.
- **POS**, **analytics**, **plan checkout** flows — need seeded data + gateways.
- **Email verification** gates — may block settings routes.
- **Per-theme** dashboard widgets — snapshot only default layout.

## Commands

```bash
# Install browsers (once)
npx playwright install chromium

# Run visual tests (update baselines after intentional UI change)
npx playwright test e2e/visual

# Update snapshots
npx playwright test e2e/visual --update-snapshots
```

## Environment variables (optional)

| Variable | Purpose |
|----------|---------|
| `PLAYWRIGHT_BASE_URL` | Default `http://127.0.0.1:8000` |
| `PLAYWRIGHT_STORAGE_STATE` | Path to saved auth state |
| `PLAYWRIGHT_PRODUCT_ID` | Product id for edit + dialog tests |
| `PLAYWRIGHT_E2E_EMAIL` / `PLAYWRIGHT_E2E_PASSWORD` | For `auth.setup.ts` |

---

*Baselines live under `e2e/visual/**/*.png` next to specs (Playwright default).*
