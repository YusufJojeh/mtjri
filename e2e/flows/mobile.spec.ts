import { expect, test } from '@playwright/test';
import { expectNoHorizontalOverflow, prepare } from './helpers';

for (const lang of ['en', 'ar'] as const) {
    test.describe(`390px merchant flow (${lang})`, () => {
        test('dashboard → orders → order → product → inventory without overflow', async ({ page }) => {
            const { assertNoErrors } = await prepare(page, lang);
            await page.goto('/dashboard');
            await expect(page.locator('html')).toHaveAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
            const tabBar = page.getByRole('navigation', { name: lang === 'en' ? 'Primary' : /./ }).last();
            await expect(tabBar).toBeVisible();
            await expectNoHorizontalOverflow(page);

            await page.goto('/orders');
            await expectNoHorizontalOverflow(page);
            await page.locator('ul[role=list] li a[href*="/orders/"]').first().click();
            await expect(page).toHaveURL(/\/orders\/\d+$/);
            await expectNoHorizontalOverflow(page);

            for (const path of ['/products', '/inventory', '/customers', '/coupon-system', '/analytics']) {
                await page.goto(path);
                await expectNoHorizontalOverflow(page);
            }
            assertNoErrors();
        });
    });
}
