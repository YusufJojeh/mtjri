/**
 * CMS / theme colors must be valid hex before use in color-mix() or inline shadows.
 */
export function sanitizeLandingHex(color: string | undefined, fallback: string): string {
    if (!color || typeof color !== 'string') return fallback;
    const c = color.trim();
    if (/^#[0-9A-Fa-f]{3}$/.test(c) || /^#[0-9A-Fa-f]{6}$/.test(c)) return c;
    return fallback;
}
