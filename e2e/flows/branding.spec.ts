import { expect, test } from '@playwright/test';

/** No merchant-facing surface may show a legacy product name. */
const LEGACY = /mtjr|matjr|storego|workdo/i;
const AUTHED = ['/dashboard', '/orders', '/products', '/inventory', '/customers', '/coupon-system', '/analytics', '/settings'];

for (const lang of ['en', 'ar'] as const) {
    test(`no legacy branding on merchant routes (${lang})`, async ({ page }) => {
        await page.addInitScript((l) => localStorage.setItem('i18nextLng', l), lang);
        for (const path of AUTHED) {
            await page.goto(path);
            await page.waitForLoadState('networkidle');
            const text = await page.evaluate(() => document.body.innerText + ' ' + document.title + ' ' + Array.from(document.images).map((i) => i.alt).join(' '));
            expect(text, `${path} shows a legacy product name`).not.toMatch(LEGACY);
        }
        await expect(page).toHaveTitle(/Tijraa/);
    });
}

test.describe('public surfaces', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    for (const path of ['/login', '/register', '/']) {
        test(`no legacy branding on ${path}`, async ({ page }) => {
            await page.goto(path);
            await page.waitForLoadState('networkidle');
            const text = await page.evaluate(() => document.body.innerText + ' ' + document.title);
            expect(text).not.toMatch(LEGACY);
            const manifest = await page.locator('link[rel=manifest]').getAttribute('href');
            expect(manifest).toBe('/manifest.webmanifest');
        });
    }
});
