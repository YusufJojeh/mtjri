# Validation & hardening — final verdict

Run environment: Windows, repo `matjri02`, date 2026-04-12. Commands executed from the project root unless noted.

---

## Passed commands

| Command | Exit code | Evidence |
|--------|-----------|----------|
| `npm install dompurify` | **0** | Resolves Vite build failure (`sanitize.ts` imports `dompurify`; dependency was missing from `package.json`). |
| `npm run build` | **0** | Vite production build completed after `dompurify` install (~47s log, no Rollup resolve errors). |

---

## Failed commands

| Command | Exit code | Root cause (verified) |
|--------|-----------|------------------------|
| `npm run types` (`tsc --noEmit`) | **2** | **875** `error TS*` lines in one run (log `agent-tools/b1ed3698-ced7-453b-b351-789f1b250f14.txt`). Failures span the whole frontend (e.g. `app-header.tsx`, `CrudFormModal.tsx`, payment forms, store hero sections, landing admin CRUD pages). **Not limited to the redesigned landing components.** |
| `npm run test:visual:update` (full project matrix) | **1** | Initially: `webServer` waited on `http://127.0.0.1:8000/` and timed out (slow Inertia `/`). After switching ready URL to `/robots.txt`, server boot succeeded. Then **42** failures: **missing Playwright browser binary** `chromium_headless_shell-1217` until install completed. |
| `npx playwright test e2e/visual/critical.spec.ts --project=chromium-desktop --update-snapshots` | **1** | **8 failed**, **2 skipped**. Failure is **not** flaky selectors: Playwright captured **Laravel 500** — `Illuminate\Database\QueryException`: **`SQLSTATE[HY000] [1049] Unknown database 'admin'`** on `GET /` (see `test-results/critical-Public-marketing-auth-landing-home-chromium-desktop/error-context.md`). No `[data-landing-page]` because the app never rendered Inertia. |

---

## Files changed (this hardening pass)

| File | Purpose |
|------|---------|
| `resources/js/pages/landing-page/lib/landing-brand.ts` | **New** — shared `sanitizeLandingHex()` (dedupe). |
| `resources/js/pages/landing-page/components/HeroSection.tsx` | Import `sanitizeLandingHex` from lib. |
| `resources/js/pages/landing-page/components/FeaturesSection.tsx` | Same. |
| `resources/js/pages/landing-page/components/WorkflowSection.tsx` | Same. |
| `resources/js/pages/landing-page/components/FeaturedStoresSection.tsx` | Same. |
| `e2e/visual/critical.spec.ts` | Stable waits (`#hero-heading`, `#contact`, `networkidle` catch), RTL/LTR + reduced-motion assertions. |
| `playwright.config.ts` | `webServer.url` → `${baseURL}/robots.txt` (fast readiness); `webServer.timeout` 300s; global test `timeout` 120s. |
| `package.json` / `package-lock.json` | Added `dompurify` dependency. |
| `docs/validation-final-verdict.md` | This report. |

---

## Blockers (exact)

1. **TypeScript:** `tsc --noEmit` fails project-wide (~875 errors). Landing-only files are not the driver; the pipeline is red until the broader TS debt is addressed or scope is narrowed (e.g. separate `tsconfig` for CI gates).
2. **E2E / visual:** App **requires a working MySQL (or configured) database**. Current `.env` points at DB `admin`, which does not exist on this machine → **500 on all routes** that hit middleware querying `stores` by host.
3. **Playwright installs:** Full matrix needs **`npx playwright install`** (Chromium **headless shell** path required). Partial `playwright install chromium` left other projects failing until binaries exist.

---

## LTR / RTL / reduced-motion (code vs runtime)

| Requirement | Code status | Runtime proof this run |
|-------------|-------------|-------------------------|
| LTR/RTL | `index.tsx` sets `dir` on `[data-landing-page]` from `i18next` language; CSS mirrors mockup for `[dir='rtl']`. | **Not exercised successfully** — pages returned 500 before Inertia. |
| Reduced motion | CSS disables `.landing-announcement-ping` under `prefers-reduced-motion`; Framer `useReducedMotion` used in sections. | **Playwright assertion not reached** — same 500. |

---

## Exact next actions

1. **Database:** Create DB `admin` (or fix `DB_DATABASE` in `.env`), run `php artisan migrate` (and any seeders your routes expect), confirm `http://127.0.0.1:8000/` returns 200 without QueryException.
2. **Playwright:** Run `npx playwright install` once on each CI/agent image; verify `%LOCALAPPDATA%\ms-playwright\chromium_headless_shell-*\chrome-headless-shell-win64\chrome-headless-shell.exe` exists.
3. **Baselines:** With DB + browsers OK: `npm run test:visual:update`, commit generated snapshots under `e2e/visual/**/__snapshots__` (or Playwright default paths), then `npm run test:visual` must pass in CI.
4. **Typecheck (if “green types” is a gate):** Either fix errors incrementally starting with highest-traffic files, or introduce a **scoped** `tsc -p` for paths you own; the current repo-wide `npm run types` **does not pass**.

---

## Verdict

- **Build:** **PASS** (after adding `dompurify`).
- **Typecheck:** **FAIL** (~875 errors, pre-existing breadth).
- **Visual tests:** **FAIL** here due to **missing database** and earlier **incomplete browser install**; spec and server readiness changes are in place but **cannot pass until env is valid**.

No claim is made that production is “fine” without executing the next actions above.
