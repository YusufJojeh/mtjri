import { accessibleShade, brandPalette, contrastRatio } from '../color';

describe('brand colour contrast', () => {
    it('measures WCAG contrast', () => {
        expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
        expect(contrastRatio('#10b981', '#ffffff')).toBeLessThan(4.5);
    });

    it.each(['#10b981', '#3b82f6', '#f97316', '#8b5cf6', '#ef4444', '#facc15', '#ffffff'])('derives an AA shade for %s in both modes', (brand) => {
        const light = brandPalette(brand, false);
        const dark = brandPalette(brand, true);
        expect(contrastRatio(light.surface, light.onSurface)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(dark.surface, dark.onSurface)).toBeGreaterThanOrEqual(4.5);
    });

    it('keeps colours that already pass untouched', () => {
        expect(accessibleShade('#1e3a8a', '#ffffff')).toBe('#1e3a8a');
    });

    it('ignores invalid input', () => {
        expect(accessibleShade('not-a-colour', '#ffffff')).toBe('not-a-colour');
    });
});
