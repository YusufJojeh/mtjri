import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:8000';
/** Static asset — avoids waiting on heavy Inertia `/` boot during webServer readiness. */
const webServerReadyURL = process.env.PLAYWRIGHT_WEBSERVER_READY_URL ?? `${baseURL}/robots.txt`;

const authArg = process.env.PLAYWRIGHT_STORAGE_STATE;
const authResolved = authArg && fs.existsSync(path.resolve(authArg)) ? path.resolve(authArg) : null;

const projects = [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } } },
    { name: 'chromium-mobile', use: { ...devices['iPhone 13'] } },
    { name: 'chromium-tablet', use: { ...devices['iPad Pro'] } },
];

if (authResolved) {
    projects.push({
        name: 'chromium-authenticated',
        use: {
            ...devices['Desktop Chrome'],
            viewport: { width: 1280, height: 720 },
            storageState: authResolved,
        },
    });
}

export default defineConfig({
    testDir: 'e2e/visual',
    /** Inertia + first-hit Laravel routes often exceed 30s under parallel load. */
    timeout: 120_000,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 2 : undefined,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'off',
    },
    expect: {
        toHaveScreenshot: {
            animations: 'disabled',
            maxDiffPixels: 200,
            threshold: 0.2,
        },
    },
    webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
        ? undefined
        : {
              command: 'php artisan serve --host=127.0.0.1 --port=8000',
              url: webServerReadyURL,
              reuseExistingServer: !process.env.CI,
              /* First boot + cold routes can exceed 120s on Windows / large apps */
              timeout: 300_000,
              stdout: 'pipe',
              stderr: 'pipe',
          },
    projects,
});
