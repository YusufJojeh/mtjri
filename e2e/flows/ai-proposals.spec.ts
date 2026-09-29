import { expect, test } from '@playwright/test';
import { mockAi, prepare } from './helpers';

const PROPOSAL = 'A sturdy, easy-to-clean dispenser that keeps soap within reach.\n\nFits any bathroom counter.';

async function openFirstProductEditor(page: import('@playwright/test').Page) {
    await page.goto('/products');
    const href = await page.locator('table tbody tr').first().getByRole('link').first().getAttribute('href');
    const id = href!.match(/products\/(\d+)/)![1];
    await page.goto(`/products/${id}/edit`);
    return id;
}

test.describe('AI proposals never overwrite merchant content', () => {
    test('description proposal: review diff, accept fills form, nothing saved until Save', async ({ page }) => {
        const { assertNoErrors } = await prepare(page);
        const calls = await mockAi(page, { success: true, content: PROPOSAL });
        await openFirstProductEditor(page);
        const editor = page.locator('.ProseMirror').first();
        const before = (await editor.innerText()).trim();

        await page.getByRole('button', { name: /(Improve|Write) with AI/ }).first().click();
        const region = page.getByRole('region', { name: /AI proposal for/ }).first();
        await expect(region).toBeVisible();
        await expect(region.getByText('AI proposal')).toBeVisible();
        // Current content untouched while the proposal is pending review.
        expect((await editor.innerText()).trim()).toBe(before);
        expect(calls[0].prompt).toBeTruthy();

        await region.getByRole('button', { name: 'Side by side' }).click().catch(() => {});
        await region.getByRole('button', { name: 'Accept' }).click();
        await expect(editor).toContainText('sturdy, easy-to-clean dispenser');

        // Leaving without saving must not persist the AI text.
        page.once('dialog', (d) => d.accept());
        await page.reload();
        await expect(page.locator('.ProseMirror').first()).not.toContainText('sturdy, easy-to-clean dispenser');
        assertNoErrors();
    });

    test('edit then use: merchant edits the proposal before it is applied', async ({ page }) => {
        const { assertNoErrors } = await prepare(page);
        await mockAi(page, { success: true, content: PROPOSAL });
        await openFirstProductEditor(page);
        await page.getByRole('button', { name: /(Improve|Write) with AI/ }).first().click();
        const region = page.getByRole('region', { name: /AI proposal for/ }).first();
        await region.getByRole('button', { name: 'Edit' }).click();
        await region.getByRole('textbox', { name: 'Edit proposal' }).fill('Merchant-approved copy.');
        await region.getByRole('button', { name: 'Use edited version' }).click();
        await expect(page.locator('.ProseMirror').first()).toContainText('Merchant-approved copy.');
        assertNoErrors();
    });

    test('reject leaves content unchanged', async ({ page }) => {
        await prepare(page);
        await mockAi(page, { success: true, content: PROPOSAL });
        await openFirstProductEditor(page);
        const editor = page.locator('.ProseMirror').first();
        const before = (await editor.innerText()).trim();
        await page.getByRole('button', { name: /(Improve|Write) with AI/ }).first().click();
        await page.getByRole('region', { name: /AI proposal for/ }).first().getByRole('button', { name: 'Reject' }).click();
        expect((await editor.innerText()).trim()).toBe(before);
    });

    test('provider not configured shows merchant-language guidance, no raw errors', async ({ page }) => {
        await prepare(page);
        await mockAi(page, { success: false, code: 'not_configured', message: 'Please set proper configuration for Api Key' });
        await openFirstProductEditor(page);
        await page.getByRole('button', { name: /(Improve|Write) with AI/ }).first().click();
        await expect(page.getByText('AI writing is not set up yet')).toBeVisible();
        await expect(page.getByText(/Api Key|Exception|Error:/)).toHaveCount(0);
    });

    test('rate limit is explained and retry is offered', async ({ page }) => {
        await prepare(page);
        await mockAi(page, { success: false, code: 'rate_limited' });
        await openFirstProductEditor(page);
        await page.getByRole('button', { name: /(Improve|Write) with AI/ }).first().click();
        await expect(page.getByText('Too many requests')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
    });

    test('blog SEO: proposals per field, accepting fills only that field', async ({ page }) => {
        const { assertNoErrors } = await prepare(page);
        await mockAi(page, { success: true, content: 'Title: Spring Home Refresh Guide\nDescription: Simple ideas to refresh every room this spring.' });
        await page.goto('/blog');
        const id = await page.evaluate(() => {
            const blogs = (window as unknown as { page: { props: { blogs: { data?: Array<{ id: number }> } | Array<{ id: number }> } } }).page.props.blogs;
            return (Array.isArray(blogs) ? blogs : blogs.data ?? [])[0]?.id;
        });
        test.skip(!id, 'No blog posts in this store');
        await page.goto(`/blog/${id}/edit`);
        await page.getByRole('tab', { name: 'SEO' }).click();
        const metaTitle = page.locator('#meta_title');
        const metaDesc = page.locator('#meta_description');
        const descBefore = await metaDesc.inputValue();
        await page.getByRole('button', { name: 'Suggest SEO with AI' }).click();
        await page.getByRole('region', { name: 'AI proposal for Meta Title' }).getByRole('button', { name: 'Accept' }).click();
        await expect(metaTitle).toHaveValue('Spring Home Refresh Guide');
        await expect(metaDesc).toHaveValue(descBefore);
        assertNoErrors();
    });
});
