import { formatMoney, formatPercent, isRtlLanguage, percentChange, resolveLocale } from '../format';

describe('formatMoney', () => {
    it('uses the store currency, never a hardcoded symbol', () => {
        expect(formatMoney(1234.5, { code: 'USD' }, 'en')).toBe('$1,234.50');
        expect(formatMoney(1234.5, { code: 'SAR' }, 'en')).toMatch(/SAR|ر\.س|﷼/);
        expect(formatMoney(1234.5, { code: 'AED' }, 'en')).toMatch(/AED|د\.إ/);
    });

    it('formats Arabic with Latin digits', () => {
        const out = formatMoney(1234.5, { code: 'SAR' }, 'ar');
        expect(out).toMatch(/1,234\.50|1٬234٫50|1,234.50/);
        expect(out).not.toMatch(/[٠-٩]/);
    });

    it('drops minor units for large headline figures only when asked', () => {
        expect(formatMoney(75602.67, { code: 'USD' }, 'en', { whole: true })).toBe('$75,603');
        expect(formatMoney(999.5, { code: 'USD' }, 'en', { whole: true })).toBe('$999.50');
    });

    it('falls back to the configured symbol for unknown codes', () => {
        expect(formatMoney(10, { code: 'XXXX', symbol: 'ƒ', decimals: 2 }, 'en')).toBe('ƒ 10.00');
    });

    it('treats empty or invalid input as zero', () => {
        expect(formatMoney('', { code: 'USD' }, 'en')).toBe('$0.00');
        expect(formatMoney('abc', { code: 'USD' }, 'en')).toBe('$0.00');
    });
});

describe('percent helpers', () => {
    it('returns null when there is no baseline', () => {
        expect(percentChange(100, 0)).toBeNull();
        expect(percentChange(150, 100)).toBe(50);
    });
    it('signs changes when requested', () => {
        expect(formatPercent(12.34, 'en', { signed: true })).toBe('+12.3%');
    });
});

describe('locale', () => {
    it('detects RTL languages', () => {
        expect(isRtlLanguage('ar')).toBe(true);
        expect(isRtlLanguage('he')).toBe(true);
        expect(isRtlLanguage('en')).toBe(false);
        expect(resolveLocale('ar')).toBe('ar-u-nu-latn');
    });
});
