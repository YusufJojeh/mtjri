import { expect, test } from '@playwright/test';
import { prepare } from './helpers';

test.describe('Merchant core workflow', () => {
    test('home command center shows KPIs, needs-attention and deep links', async ({ page }) => {
        const { assertNoErrors } = await prepare(page);
        await page.goto('/dashboard');
        await expect(page.getByRole('heading', { level: 1 })).toContainText(/Good (morning|afternoon|evening)/);
        await expect(page.getByRole('region', { name: 'Key metrics' })).toBeVisible();
        await expect(page.getByText("Today's sales")).toBeVisible();
        const attention = page.locator('#attention');
        await expect(attention.getByText('Needs attention')).toBeVisible();
        // Every attention item is a link to the place where it can be resolved.
        for (const link of await attention.getByRole('link').all()) {
            await expect(link).toHaveAttribute('href', /\/(orders|inventory|coupon-system)/);
        }
        assertNoErrors();
    });

    test('orders: filter views, open an order, advance its status via the server', async ({ page }) => {
        const { assertNoErrors } = await prepare(page);
        await page.goto('/orders?view=open');
        await expect(page.getByRole('tab', { name: /Open/, selected: true })).toBeVisible();
        const firstRow = page.locator('table tbody tr').first();
        await expect(firstRow).toBeVisible();
        await firstRow.click();
        await expect(page).toHaveURL(/\/orders\/\d+$/);
        await expect(page.getByText('Timeline')).toBeVisible();

        const next = page.getByRole('button', { name: /^Mark as (processing|shipped|delivered)$/ }).first();
        if (await next.count()) {
            const label = (await next.textContent())!.trim();
            await next.click();
            // Shipping asks for an optional tracking number first.
            const confirm = page.getByRole('dialog').getByRole('button', { name: /Mark (as|order as) shipped|Confirm/ });
            if (await confirm.count()) await confirm.first().click();
            const expected = { 'Mark as processing': 'Processing', 'Mark as shipped': 'Shipped', 'Mark as delivered': 'Delivered' }[label]!;
            await expect(page.getByText(expected).first()).toBeVisible();
            // Server state, not optimistic UI: reload and check again.
            await page.reload();
            await expect(page.getByText(expected).first()).toBeVisible();
        }
        assertNoErrors();
    });

    test('products, inventory, customers and discounts load with real data', async ({ page }) => {
        const { assertNoErrors } = await prepare(page);
        await page.goto('/products');
        await expect(page.getByRole('heading', { name: 'Products', level: 1 })).toBeVisible();
        await page.locator('table tbody tr').first().click();
        await expect(page).toHaveURL(/\/products\/\d+$/);

        await page.goto('/inventory?view=low');
        await expect(page.getByRole('heading', { name: 'Inventory', level: 1 })).toBeVisible();
        await expect(page.getByRole('tab', { name: /Low stock/, selected: true })).toBeVisible();

        await page.goto('/customers');
        await page.locator('table tbody tr').first().click();
        await expect(page).toHaveURL(/\/customers\/\d+$/);
        await expect(page.getByText('Lifetime spend')).toBeVisible();

        await page.goto('/coupon-system');
        await page.locator('table tbody tr').first().click();
        await expect(page).toHaveURL(/\/coupon-system\/\d+$/);
        await expect(page.getByText('Usage & performance')).toBeVisible();
        assertNoErrors();
    });

    test('analytics renders and keeps the range in the URL', async ({ page }) => {
        const { assertNoErrors } = await prepare(page);
        await page.goto('/analytics');
        await page.getByRole('button', { name: '7 days' }).or(page.getByRole('tab', { name: '7 days' })).first().click();
        await expect(page).toHaveURL(/range=7d|days=7|range=7/);
        await expect(page.getByText('Sales over time')).toBeVisible();
        assertNoErrors();
    });

    test('command palette finds an order by number (Ctrl+K)', async ({ page }) => {
        const { assertNoErrors } = await prepare(page);
        await page.goto('/orders');
        const number = (await page.locator('table tbody tr').first().locator('td').first().locator('span').first().textContent())!.trim();
        await page.keyboard.press('Control+k');
        const input = page.getByPlaceholder(/Search orders, products, customers/);
        await input.fill(number.slice(0, 10));
        await expect(page.getByRole('option', { name: new RegExp(number) })).toBeVisible();
        await page.keyboard.press('Enter');
        await expect(page).toHaveURL(/\/orders\/\d+$/);
        assertNoErrors();
    });
});
