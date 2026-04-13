import { formatCurrency } from './currency-formatter';

/**
 * Format currency for company/system settings preview
 * This function formats currency based on page props structure
 */
export function formatCompanyCurrency(
  amount: number | string,
  pageProps?: {
    settings?: {
      decimalFormat?: string;
      decimalSeparator?: string;
      thousandsSeparator?: string;
      currencySymbolSpace?: boolean;
      currencySymbolPosition?: string;
    };
    storeCurrency?: {
      symbol?: string;
    };
    currencies?: Array<{ code: string; symbol: string }>;
    defaultCurrency?: string;
  }
): string {
  // Extract settings from pageProps or use defaults
  const settings = pageProps?.settings || {};
  const storeCurrency = pageProps?.storeCurrency;
  const currencies = pageProps?.currencies || [];
  const defaultCurrency = pageProps?.defaultCurrency || 'USD';

  // Build storeSettings object for formatCurrency
  const storeSettings = {
    defaultCurrency: defaultCurrency,
    decimalFormat: settings.decimalFormat || '2',
    decimalSeparator: settings.decimalSeparator || '.',
    thousandsSeparator: settings.thousandsSeparator || ',',
    currencySymbolPosition: settings.currencySymbolPosition || 'before',
    currencySymbolSpace: settings.currencySymbolSpace || false,
    floatNumber: true
  };

  // Build currencies array with the symbol from storeCurrency if available
  let formattedCurrencies = currencies;
  if (storeCurrency?.symbol && currencies.length > 0) {
    // Update the currency symbol for the default currency
    formattedCurrencies = currencies.map(c => {
      if (c.code === defaultCurrency) {
        return { ...c, symbol: storeCurrency.symbol || c.symbol };
      }
      return c;
    });
  } else if (storeCurrency?.symbol && currencies.length === 0) {
    // If no currencies array but we have a symbol, create one
    formattedCurrencies = [{ code: defaultCurrency, symbol: storeCurrency.symbol }];
  }

  // Use the existing formatCurrency function
  return formatCurrency(amount, storeSettings, formattedCurrencies);
}

