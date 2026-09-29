import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStoreCurrency } from '@/hooks/use-store-currency';
import {
    formatDate,
    formatDateTime,
    formatMoney,
    formatNumber,
    formatPercent,
    formatRelative,
    isRtlLanguage,
} from '@/lib/commerce/format';

/** Formatters bound to the active UI language and the current store's currency. */
export function useCommerceFormat() {
    const { i18n } = useTranslation();
    const currency = useStoreCurrency();
    const lang = i18n.language;

    return useMemo(
        () => ({
            lang,
            isRtl: isRtlLanguage(lang),
            currencyCode: currency.code,
            money: (v: number | string | null | undefined, opts?: { compact?: boolean; whole?: boolean }) =>
                formatMoney(v, { code: currency.code, symbol: currency.symbol, decimals: currency.decimals }, lang, opts),
            number: (v: number | string | null | undefined, opts?: Intl.NumberFormatOptions) => formatNumber(v, lang, opts),
            percent: (v: number | null | undefined, opts?: { signed?: boolean }) => formatPercent(v, lang, opts),
            date: (v: string | number | Date | null | undefined, opts?: Intl.DateTimeFormatOptions) => formatDate(v, lang, opts),
            dateTime: (v: string | number | Date | null | undefined) => formatDateTime(v, lang),
            relative: (v: string | number | Date | null | undefined) => formatRelative(v, lang),
        }),
        [lang, currency.code, currency.symbol, currency.decimals],
    );
}
