import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { prepare } from './helpers';

/**
 * Automated WCAG 2.1 A/AA checks on flagship merchant screens (EN and AR).
 * Serious/critical violations fail the test; the report lists everything.
 */
const PAGES = ['/dashboard', '/orders', '/products', '/inventory', '/customers', '/coupon-system', '/analytics'];

for (const lang of ['en', 'ar'] as const) {
    for (const path of PAGES) {
        test(`a11y ${lang} ${path}`, async ({ page }) => {
            await prepare(page, lang);
            await page.goto(path);
            await page.waitForLoadState('networkidle');
            const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
            const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
            const summary = blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.length}× e.g. ${v.nodes[0]?.target.join(' ')}`);
            expect(summary, summary.join('\n')).toEqual([]);
        });
    }
}
