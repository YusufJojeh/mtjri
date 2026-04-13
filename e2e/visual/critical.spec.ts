import { test, expect } from '@playwright/test';

async function forceEnglish(page: import('@playwright/test').Page) {
    await page.addInitScript(() => {
        try {
            localStorage.setItem('i18nextLng', 'en');
        } catch {
            /* ignore */
        }
    });
}

test.beforeEach(async ({ page }) => {
    await forceEnglish(page);
});

test.describe('Public marketing & auth', () => {
    test('landing home', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'chromium-desktop', 'Desktop baseline only');
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        const root = page.locator('[data-landing-page]');
        await root.waitFor({ state: 'visible', timeout: 30_000 });
        await page.locator('#hero-heading').waitFor({ state: 'visible', timeout: 15_000 });
        await expect(root).toHaveScreenshot('landing-home.png');
    });

    test('login', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'chromium-desktop', 'Desktop baseline only');
        await page.goto('/login', { waitUntil: 'domcontentloaded' });
        await page.locator('[data-testid="auth-shell"]').waitFor({ state: 'visible', timeout: 30_000 });
        await expect(page.locator('[data-testid="auth-shell"]')).toHaveScreenshot('login.png');
    });

    test('register', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'chromium-desktop', 'Desktop baseline only');
        await page.goto('/register', { waitUntil: 'domcontentloaded' });
        await page.locator('[data-testid="auth-shell"]').waitFor({ state: 'visible', timeout: 30_000 });
        await expect(page.locator('[data-testid="auth-shell"]')).toHaveScreenshot('register.png');
    });

    test('contact page', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'chromium-desktop', 'Desktop baseline only');
        await page.goto('/contact', { waitUntil: 'domcontentloaded' });
        await page.locator('#contact').waitFor({ state: 'visible', timeout: 30_000 });
        await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {
            /* non-fatal: some stacks keep long-polling */
        });
        await expect(page).toHaveScreenshot('contact-full.png', { fullPage: true });
    });

    test('documentation index', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'chromium-desktop', 'Desktop baseline only');
        await page.goto('/docs', { waitUntil: 'domcontentloaded' });
        await page.locator('[data-testid="documentation-layout"]').waitFor({ state: 'visible', timeout: 30_000 });
        await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
        await expect(page).toHaveScreenshot('docs-index.png', { fullPage: true });
    });
});

test.describe('Responsive landing', () => {
    test('landing mobile', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'chromium-mobile', 'Mobile project only');
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        const root = page.locator('[data-landing-page]');
        await root.waitFor({ state: 'visible', timeout: 30_000 });
        await page.locator('#hero-heading').waitFor({ state: 'visible', timeout: 15_000 });
        await expect(root).toHaveScreenshot('landing-mobile.png');
    });

    test('landing tablet', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'chromium-tablet', 'Tablet project only');
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        const root = page.locator('[data-landing-page]');
        await root.waitFor({ state: 'visible', timeout: 30_000 });
        await page.locator('#hero-heading').waitFor({ state: 'visible', timeout: 15_000 });
        await expect(root).toHaveScreenshot('landing-tablet.png');
    });
});

test.describe('Landing i18n & motion', () => {
    test('landing uses dir=rtl when i18nextLng=ar', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'chromium-desktop', 'Desktop only');
        await page.addInitScript(() => {
            try {
                localStorage.setItem('i18nextLng', 'ar');
            } catch {
                /* ignore */
            }
        });
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await page.locator('[data-landing-page]').waitFor({ state: 'visible', timeout: 30_000 });
        await expect(page.locator('[data-landing-page]')).toHaveAttribute('dir', 'rtl', { timeout: 20_000 });
    });

    test('landing uses dir=ltr when i18nextLng=en', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'chromium-desktop', 'Desktop only');
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await page.locator('[data-landing-page]').waitFor({ state: 'visible', timeout: 30_000 });
        await expect(page.locator('[data-landing-page]')).toHaveAttribute('dir', 'ltr', { timeout: 20_000 });
    });

    test('hero announcement ping has no animation under reduced motion', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'chromium-desktop', 'Desktop only');
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await page.locator('[data-landing-page]').waitFor({ state: 'visible', timeout: 30_000 });
        const ping = page.locator('.landing-announcement-ping').first();
        await ping.waitFor({ state: 'attached', timeout: 10_000 });
        const duration = await ping.evaluate((el) => getComputedStyle(el).animationDuration);
        const name = await ping.evaluate((el) => getComputedStyle(el).animationName);
        const disabled = duration === '0s' || name === 'none' || name === '';
        expect(disabled).toBe(true);
    });
});
