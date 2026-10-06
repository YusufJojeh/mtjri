import { expect, type Page } from '@playwright/test';

/** Pin UI language and fail the test on any uncaught page error. */
export async function prepare(page: Page, lang: 'en' | 'ar' = 'en') {
    await page.addInitScript((l) => localStorage.setItem('i18nextLng', l), lang);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    return {
        errors,
        assertNoErrors: () => expect(errors, `page errors: ${errors.join(' | ')}`).toEqual([]),
    };
}

export async function expectNoHorizontalOverflow(page: Page) {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(1);
}

/** Simulate the AI provider (no real key in test environments). Matches the real /ai/content/compose contract. */
export async function mockAi(
    page: Page,
    reply: { success: true; fields: { text?: string; title?: string; description?: string; keywords?: string } } | { success: false; code: string; message?: string },
) {
    const calls: Array<Record<string, unknown>> = [];
    await page.route('**/ai/content/compose', async (route) => {
        calls.push(JSON.parse(route.request().postData() || '{}'));
        if (reply.success) {
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ fields: reply.fields, knowledge_used: [] }) });
        } else {
            const status = reply.code === 'budget_exhausted' ? 402 : 503;
            await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ error: reply.code, message: reply.message ?? '' }) });
        }
    });
    return calls;
}
