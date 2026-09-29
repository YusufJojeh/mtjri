import { sanitizeLandingHex } from '@/pages/landing-page/lib/landing-brand';

/**
 * Tijraa palette (`public/images/logos/tijraa-mark.svg`):
 * deep commerce emerald + a restrained trade gold accent.
 */
export const PUBLIC_BRAND_PRIMARY = '#0B6B5A';

/** Deeper emerald for hover / secondary emphasis */
export const PUBLIC_BRAND_SECONDARY = '#09594B';

/** Trade gold — badges and sparing highlights only */
export const PUBLIC_BRAND_ACCENT = '#D9AE4E';

/** Ambient glows (same family as primary, softer) */
export const PUBLIC_BRAND_AMBIENT = '#5EB8A5';

/** Full logo for light backgrounds (dark-colored artwork) */
export const PUBLIC_BRAND_LOGO_LIGHT_BG = '/images/logos/logo-dark.png';

/** Full logo for dark backgrounds (light-colored artwork) */
export const PUBLIC_BRAND_LOGO_DARK_BG = '/images/logos/logo-light.png';

/** True if the string is already an absolute http(s) URL (case-insensitive). */
export function isAbsoluteHttpUrl(s: string): boolean {
    return /^https?:\/\//i.test((s ?? '').trim());
}

/**
 * Fixes `http://hosthttp://host/path` when storage/API already returned a full URL
 * but another layer prepended `APP_URL` again.
 */
export function normalizeMarketingAssetUrl(url: string): string {
    let u = (url ?? '').trim().replace(/^\uFEFF/, '');
    // Strip repeated origin+scheme (no slash between first origin and second scheme)
    for (let i = 0; i < 4; i++) {
        const m = u.match(/^(https?:\/\/[^/?#]+)(https?:\/\/)/i);
        if (!m) break;
        u = u.slice(m[1].length);
    }
    return u;
}

function marketingBaseUrl(): string {
    if (typeof window === 'undefined') return '';
    const b =
        (window as { appSettings?: { baseUrl?: string } }).appSettings?.baseUrl || window.location.origin || '';
    return String(b).replace(/\/$/, '');
}

/**
 * Resolved img src for marketing header/hero/auth.
 * Light document → dark mark; dark document → light mark. Falls back to packaged PNGs.
 */
export function getMarketingLogoDisplayUrl(
    logoLightFromBrand: string | undefined | null,
    logoDarkFromBrand: string | undefined | null,
    isDarkDocument: boolean,
): string {
    const fallback = isDarkDocument ? PUBLIC_BRAND_LOGO_DARK_BG : PUBLIC_BRAND_LOGO_LIGHT_BG;
    const raw = normalizeMarketingAssetUrl(
        ((isDarkDocument ? logoLightFromBrand : logoDarkFromBrand) ?? '').trim(),
    );
    if (!raw) {
        if (typeof window === 'undefined') return fallback;
        const base = marketingBaseUrl();
        return normalizeMarketingAssetUrl(`${base}${fallback.startsWith('/') ? fallback : `/${fallback}`}`);
    }
    if (isAbsoluteHttpUrl(raw)) {
        return raw;
    }
    if (typeof window === 'undefined') {
        return raw.startsWith('/') ? raw : fallback;
    }
    const base = marketingBaseUrl();
    if (raw.startsWith('/')) {
        return normalizeMarketingAssetUrl(`${base}${raw}`);
    }
    return normalizeMarketingAssetUrl(`${base}/${raw}`);
}

export type PublicBrandColors = {
    primary: string;
    secondary: string;
    accent: string;
};

export function resolvePublicBrandColors(
    settings?: {
        config_sections?: {
            colors?: { primary?: string; secondary?: string; accent?: string };
        };
    },
    overrides?: Partial<PublicBrandColors>,
): PublicBrandColors {
    const c = settings?.config_sections?.colors;
    return {
        primary: sanitizeLandingHex(overrides?.primary ?? c?.primary, PUBLIC_BRAND_PRIMARY),
        secondary: sanitizeLandingHex(overrides?.secondary ?? c?.secondary, PUBLIC_BRAND_SECONDARY),
        accent: sanitizeLandingHex(overrides?.accent ?? c?.accent, PUBLIC_BRAND_ACCENT),
    };
}
