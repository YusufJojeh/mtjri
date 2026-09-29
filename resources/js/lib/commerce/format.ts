/**
 * Locale- and currency-aware formatting for merchant surfaces.
 *
 * Currency always comes from the store (never hardcoded). Arabic uses
 * Latin digits (`-u-nu-latn`), which is the convention in Gulf commerce
 * tooling and keeps order numbers / SKUs / prices visually consistent.
 */

export interface CurrencyConfig {
    code: string;
    symbol?: string;
    decimals?: number;
}

const RTL_LANGS = ['ar', 'fa', 'he', 'ur'];

export function isRtlLanguage(lang: string | undefined | null): boolean {
    if (!lang) return false;
    return RTL_LANGS.includes(lang.split('-')[0]);
}

export function resolveLocale(lang: string | undefined | null): string {
    const base = (lang || 'en').split('-')[0];
    if (base === 'ar') return 'ar-u-nu-latn';
    if (base === 'fa') return 'fa-u-nu-latn';
    return lang || 'en';
}

function toNumber(value: number | string | null | undefined): number {
    if (value === null || value === undefined || value === '') return 0;
    const n = typeof value === 'number' ? value : parseFloat(value);
    return Number.isFinite(n) ? n : 0;
}

export function formatMoney(
    value: number | string | null | undefined,
    currency: CurrencyConfig,
    lang?: string,
    opts: { compact?: boolean } = {},
): string {
    const amount = toNumber(value);
    const locale = resolveLocale(lang);
    const digits = currency.decimals ?? 2;
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency.code || 'USD',
            currencyDisplay: 'narrowSymbol',
            notation: opts.compact ? 'compact' : 'standard',
            minimumFractionDigits: opts.compact ? 0 : digits,
            maximumFractionDigits: opts.compact ? 1 : digits,
        }).format(amount);
    } catch {
        // Unknown ISO code (custom currency) – fall back to the configured symbol.
        const num = new Intl.NumberFormat(locale, {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
        }).format(amount);
        return currency.symbol ? `${currency.symbol} ${num}` : num;
    }
}

export function formatNumber(value: number | string | null | undefined, lang?: string, opts: Intl.NumberFormatOptions = {}): string {
    return new Intl.NumberFormat(resolveLocale(lang), opts).format(toNumber(value));
}

export function formatPercent(value: number | null | undefined, lang?: string, opts: { signed?: boolean } = {}): string {
    const n = toNumber(value);
    return new Intl.NumberFormat(resolveLocale(lang), {
        style: 'percent',
        maximumFractionDigits: 1,
        signDisplay: opts.signed ? 'exceptZero' : 'auto',
    }).format(n / 100);
}

function toDate(value: string | number | Date | null | undefined): Date | null {
    if (value === null || value === undefined || value === '') return null;
    const d = value instanceof Date ? value : new Date(typeof value === 'string' && /^\d{4}-\d{2}-\d{2} /.test(value) ? value.replace(' ', 'T') : value);
    return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value: string | number | Date | null | undefined, lang?: string, opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }): string {
    const d = toDate(value);
    if (!d) return '—';
    return new Intl.DateTimeFormat(resolveLocale(lang), opts).format(d);
}

export function formatDateTime(value: string | number | Date | null | undefined, lang?: string): string {
    return formatDate(value, lang, { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatRelative(value: string | number | Date | null | undefined, lang?: string, now: Date = new Date()): string {
    const d = toDate(value);
    if (!d) return '—';
    const diffSec = Math.round((d.getTime() - now.getTime()) / 1000);
    const abs = Math.abs(diffSec);
    const rtf = new Intl.RelativeTimeFormat(resolveLocale(lang), { numeric: 'auto' });
    if (abs < 60) return rtf.format(diffSec, 'second');
    if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
    if (abs < 86400 * 30) return rtf.format(Math.round(diffSec / 86400), 'day');
    return formatDate(d, lang);
}

/** Percentage change between two periods; null when there is no baseline. */
export function percentChange(current: number, previous: number): number | null {
    if (!previous) return null;
    return ((current - previous) / previous) * 100;
}
