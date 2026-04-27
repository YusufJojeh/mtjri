import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        try {
            localStorage.setItem('i18nextLng', 'en');
        } catch {
            /* ignore */
        }
    });
});

test.describe('AI assistant functional checks', () => {
    test('opens modal and shows provider/agentic controls', async ({ page }) => {
        await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
        const trigger = page.locator('[data-testid="floating-chatgpt-trigger"]');
        if ((await trigger.count()) === 0) {
            test.skip(true, 'Assistant trigger not available for this test session');
        }
        await trigger.waitFor({ state: 'visible', timeout: 30_000 });
        await trigger.click();

        await page.locator('[data-testid="chatgpt-modal-root"]').waitFor({ state: 'visible', timeout: 10_000 });
        await expect(page.locator('[data-testid="chatgpt-provider-trigger"]')).toBeVisible();
        await expect(page.locator('[data-testid="chatgpt-agentic-toggle"]')).toBeVisible();
    });

    test('shows backend error for unreachable ollama request', async ({ page }) => {
        await page.route('**/api/chatgpt/generate', async (route) => {
            await route.fulfill({
                status: 422,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: false,
                    error_code: 'provider_unavailable',
                    message: 'Ollama is unreachable',
                }),
            });
        });

        await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
        const trigger = page.locator('[data-testid="floating-chatgpt-trigger"]');
        if ((await trigger.count()) === 0) {
            test.skip(true, 'Assistant trigger not available for this test session');
        }
        await trigger.click();
        await page.locator('[data-testid="chatgpt-modal-root"]').waitFor({ state: 'visible', timeout: 10_000 });
        await page.locator('[data-testid="chatgpt-prompt-input"]').fill('test prompt');
        await page.locator('[data-testid="chatgpt-generate-button"]').click();

        await expect(page.getByText(/Ollama is unreachable/i)).toBeVisible({ timeout: 10_000 });
    });
});
