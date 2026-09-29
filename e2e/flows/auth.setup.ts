import { expect, test as setup } from '@playwright/test';

setup('log in as demo merchant', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'en'));
    await page.goto('/login');
    await page.fill('input[type=email]', process.env.E2E_EMAIL ?? 'company@example.com');
    await page.fill('input[type=password]', process.env.E2E_PASSWORD ?? 'password');
    await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/login')), page.click('button[type=submit]')]);
    await expect(page.getByTestId('app-shell')).toBeVisible();
    await page.context().storageState({ path: 'e2e/.auth/company.json' });
});
