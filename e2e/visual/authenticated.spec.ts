import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        try {
            localStorage.setItem('i18nextLng', 'en');
        } catch {
            /* ignore */
        }
    });
});

test.describe('Authenticated shells (storageState)', () => {
    test('dashboard', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'chromium-authenticated', 'Requires PLAYWRIGHT_STORAGE_STATE file');
        await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
        await page.locator('[data-testid="app-shell"]').waitFor({ state: 'visible', timeout: 45_000 });
        await expect(page.locator('[data-testid="app-shell"]')).toHaveScreenshot('dashboard-shell.png');
    });

    test('products index', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'chromium-authenticated', 'Requires PLAYWRIGHT_STORAGE_STATE file');
        await page.goto('/products', { waitUntil: 'domcontentloaded' });
        await page.locator('[data-testid="app-shell"]').waitFor({ state: 'visible', timeout: 45_000 });
        await expect(page.locator('[data-testid="app-shell"]')).toHaveScreenshot('products-index.png');
    });

    test('settings profile', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'chromium-authenticated', 'Requires PLAYWRIGHT_STORAGE_STATE file');
        await page.goto('/profile', { waitUntil: 'domcontentloaded' });
        await page.locator('[data-testid="app-shell"]').waitFor({ state: 'visible', timeout: 45_000 });
        await expect(page.locator('[data-testid="app-shell"]')).toHaveScreenshot('settings-profile.png');
    });

    test('delete product dialog', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'chromium-authenticated', 'Requires PLAYWRIGHT_STORAGE_STATE file');
        await page.goto('/products', { waitUntil: 'domcontentloaded' });
        await page.locator('[data-testid="app-shell"]').waitFor({ state: 'visible', timeout: 45_000 });
        const open = page.getByRole('button', { name: /delete/i }).first();
        if ((await open.count()) === 0) {
            test.skip(true, 'No delete button — empty catalog or different permissions');
        }
        await open.click();
        await page.locator('[data-testid="delete-product-dialog"]').waitFor({ state: 'visible', timeout: 10_000 });
        await expect(page.locator('[data-testid="delete-product-dialog"]')).toHaveScreenshot('delete-product-dialog.png');
        await page.keyboard.press('Escape');
    });
});
