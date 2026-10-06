import { defineConfig, devices } from '@playwright/test';

/**
 * Merchant workflow E2E (functional, not pixel snapshots).
 * Requires a seeded app (demo seed) reachable at PLAYWRIGHT_BASE_URL.
 * Logs in once as the demo company user and reuses the session.
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:8000';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;

export default defineConfig({
    testDir: 'e2e/flows',
    timeout: 90_000,
    // The local dev server (php artisan serve) serves code-split JS chunks and
    // uncached images one at a time; an Inertia visit that triggers a fresh
    // dynamic import can take longer than Playwright's 5s assertion default.
    expect: { timeout: 15_000 },
    fullyParallel: false,
    workers: 1,
    retries: process.env.CI ? 1 : 0,
    reporter: [['list']],
    use: { baseURL, trace: 'retain-on-failure', launchOptions: { executablePath } },
    projects: [
        { name: 'setup', testMatch: /auth\.setup\.ts/ },
        {
            name: 'desktop',
            dependencies: ['setup'],
            testIgnore: /auth\.setup\.ts|mobile\.spec\.ts/,
            use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, storageState: 'e2e/.auth/company.json' },
        },
        {
            name: 'mobile',
            dependencies: ['setup'],
            testMatch: /mobile\.spec\.ts/,
            use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 }, storageState: 'e2e/.auth/company.json' },
        },
    ],
    webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
        ? undefined
        : { command: 'php artisan serve --host=127.0.0.1 --port=8000', url: `${baseURL}/robots.txt`, reuseExistingServer: true, timeout: 300_000 },
});
