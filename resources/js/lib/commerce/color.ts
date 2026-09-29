/**
 * WCAG contrast helpers used to derive an accessible shade of the merchant's
 * brand colour. The raw brand colour stays available for decoration (charts,
 * dots); interactive surfaces with text use the accessible shade.
 */

type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB | null {
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || '').trim());
    if (!m) return null;
    const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function rgbToHex([r, g, b]: RGB): string {
    return '#' + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');
}

function channel(v: number) {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(rgb: RGB): number {
    return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}

export function contrastRatio(a: string, b: string): number {
    const ra = hexToRgb(a);
    const rb = hexToRgb(b);
    if (!ra || !rb) return 1;
    const [l1, l2] = [luminance(ra), luminance(rb)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
}

/**
 * Mix `color` towards black (darken) or white (lighten) in small steps until
 * `text` on it reaches `target` contrast. Returns the original colour if it
 * already passes, and the closest shade reached otherwise.
 */
export function accessibleShade(color: string, text: string, target = 4.5, direction: 'darken' | 'lighten' = 'darken'): string {
    const rgb = hexToRgb(color);
    if (!rgb) return color;
    if (contrastRatio(color, text) >= target) return rgbToHex(rgb);
    const toward = direction === 'darken' ? 0 : 255;
    for (let t = 0.04; t <= 1.0001; t += 0.04) {
        const mixed = rgb.map((c) => c + (toward - c) * t) as RGB;
        const hex = rgbToHex(mixed);
        if (contrastRatio(hex, text) >= target) return hex;
    }
    return rgbToHex(rgb.map(() => toward) as RGB);
}

export const LIGHT_ON_BRAND = '#ffffff';
export const DARK_ON_BRAND = '#0b0f14';

/** Accessible brand surface + its text colour for the current appearance. */
export function brandPalette(color: string, isDark: boolean): { surface: string; onSurface: string } {
    if (!isDark) return { surface: accessibleShade(color, LIGHT_ON_BRAND, 4.5, 'darken'), onSurface: LIGHT_ON_BRAND };
    return { surface: accessibleShade(color, DARK_ON_BRAND, 4.5, 'lighten'), onSurface: DARK_ON_BRAND };
}

/**
 * Brand colour safe for white text on it and for brand-coloured text on white
 * (AA 4.5:1). Used by pages that paint the brand colour inline.
 */
export function accessibleBrand(color: string | undefined | null, fallback = '#0B6B5A'): string {
    return accessibleShade(color || fallback, LIGHT_ON_BRAND, 4.5, 'darken');
}
