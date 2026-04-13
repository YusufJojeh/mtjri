# End-to-end & visual tests

## Visual regression (Playwright)

1. Install dependencies: `npm install`
2. Install browser: `npx playwright install chromium`
3. Ensure the app is reachable at `http://127.0.0.1:8000` (or set `PLAYWRIGHT_BASE_URL`).
4. For `/` landing screenshots, the marketing site must be enabled (not redirecting to login).
5. Run: `npm run test:visual`
6. After intentional UI changes: `npm run test:visual:update`

### Optional authenticated snapshots

1. Log in manually once and export storage:

```bash
npx playwright codegen http://127.0.0.1:8000 --save-storage=e2e/storage/auth.json
```

2. Run with:

```bash
set PLAYWRIGHT_STORAGE_STATE=e2e/storage/auth.json
npm run test:visual
```

(On Unix: `export PLAYWRIGHT_STORAGE_STATE=e2e/storage/auth.json`)

The `chromium-authenticated` project is registered only when that file exists.

### Skip auto-starting PHP server

If you already run `php artisan serve`:

```bash
set PLAYWRIGHT_SKIP_WEBSERVER=1
npm run test:visual
```
