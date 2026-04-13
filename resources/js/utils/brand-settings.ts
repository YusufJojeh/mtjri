import { type Appearance, type ThemeColor } from '@/hooks/use-appearance';
import { type LayoutPosition } from '@/contexts/LayoutContext';
import { isAbsoluteHttpUrl, normalizeMarketingAssetUrl } from '@/lib/public-brand';

// Define the brand settings interface
export interface BrandSettings {
  logoDark: string;
  logoLight: string;
  favicon: string;
  titleText: string;
  footerText: string;
  themeColor: ThemeColor;
  customColor: string;
  sidebarVariant: string;
  sidebarStyle: string;
  layoutDirection: LayoutPosition;
  themeMode: Appearance;
}

// Default brand settings
export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  logoDark: '/images/logos/logo-dark.png',
  logoLight: '/images/logos/logo-light.png',
  favicon: '/images/logos/favicon.ico',
  titleText: 'StoreGo',
  footerText: '© 2025 StoreGo SaaS. Powered by WorkDo.',
  themeColor: 'green',
  customColor: '#10b981',
  sidebarVariant: 'inset',
  sidebarStyle: 'plain',
  layoutDirection: 'left',
  themeMode: 'light',
};

// Get brand settings from props or localStorage as fallback
export const getBrandSettings = (userSettings?: Record<string, string>): BrandSettings => {
  // If we have settings from the backend, use those
  if (userSettings) {
    const baseRaw =
      (typeof window !== 'undefined' && (window.appSettings?.baseUrl || window.location?.origin)) || '';
    const base = String(baseRaw).replace(/\/$/, '');

    const getFullUrl = (path: string, defaultPath: string) => {
      const trimmed = normalizeMarketingAssetUrl((path ?? '').trim());
      if (!trimmed) {
        const def = defaultPath.startsWith('/') ? defaultPath : `/${defaultPath}`;
        return normalizeMarketingAssetUrl(base ? `${base}${def}` : def);
      }
      if (isAbsoluteHttpUrl(trimmed)) {
        return trimmed;
      }
      const rel = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
      return normalizeMarketingAssetUrl(base ? `${base}${rel}` : rel);
    };

    return {
      logoDark: getFullUrl(userSettings.logoDark, DEFAULT_BRAND_SETTINGS.logoDark),
      logoLight: getFullUrl(userSettings.logoLight, DEFAULT_BRAND_SETTINGS.logoLight),
      favicon: getFullUrl(userSettings.favicon, DEFAULT_BRAND_SETTINGS.favicon),
      titleText: userSettings.titleText || DEFAULT_BRAND_SETTINGS.titleText,
      footerText: userSettings.footerText || DEFAULT_BRAND_SETTINGS.footerText,
      themeColor: (userSettings.themeColor as ThemeColor) || DEFAULT_BRAND_SETTINGS.themeColor,
      customColor: userSettings.customColor || DEFAULT_BRAND_SETTINGS.customColor,
      sidebarVariant: userSettings.sidebarVariant || DEFAULT_BRAND_SETTINGS.sidebarVariant,
      sidebarStyle: userSettings.sidebarStyle || DEFAULT_BRAND_SETTINGS.sidebarStyle,
      layoutDirection: (userSettings.layoutDirection as LayoutPosition) || DEFAULT_BRAND_SETTINGS.layoutDirection,
      themeMode: (userSettings.themeMode as Appearance) || DEFAULT_BRAND_SETTINGS.themeMode,
    };
  }

  // Fallback to localStorage if no backend settings
  if (typeof localStorage === 'undefined') {
    return DEFAULT_BRAND_SETTINGS;
  }

  try {
    const savedSettings = localStorage.getItem('brandSettings');
    return savedSettings ? JSON.parse(savedSettings) : DEFAULT_BRAND_SETTINGS;
  } catch (error) {
    return DEFAULT_BRAND_SETTINGS;
  }
};

