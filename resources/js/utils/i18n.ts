// utils/i18n.ts
import i18next from 'i18next';

// Export the direct translation function
export const t = (key: string, options?: any): string => {
  // If i18next is not initialized yet, return the key as fallback
  if (!i18next.isInitialized) {
    return typeof key === 'string' ? key : String(key);
  }
  const result = i18next.t(key, options);
  return typeof result === 'string' ? result : String(result);
};
