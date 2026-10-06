import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import languageData from '@/../../resources/lang/language.json';

// English (source language) and Arabic (default UI language) ship in the main
// bundle. Every other locale is code-split and fetched on first use, which
// keeps ~3 MB of JSON out of the initial download.
import enTranslations from '@/../../resources/lang/en.json';
import arTranslations from '@/../../resources/lang/ar.json';

// Make i18n instance available for direct imports
export { default as i18next } from 'i18next';

const lazyLocales = typeof import.meta !== 'undefined' && import.meta.glob
    ? import.meta.glob(['../lang/*.json', '!../lang/en.json', '!../lang/ar.json', '!../lang/language.json'])
    : {};

const resources = {
    en: { translation: enTranslations },
    ar: { translation: arTranslations },
};

/** Load a locale bundle on demand (no-op for bundled or unknown locales). */
export async function ensureLocale(code) {
    if (!code || i18n.hasResourceBundle(code, 'translation')) return;
    const loader = lazyLocales[`../lang/${code}.json`];
    if (!loader) return;
    try {
        const mod = await loader();
        i18n.addResourceBundle(code, 'translation', mod.default ?? mod, true, true);
    } catch {
        // Fall back to English strings silently; UI stays usable.
    }
}

// Capture the merchant's saved choice before init: the detector caches
// whatever it resolves, which would otherwise mask "nothing saved yet".
const initialStoredLang = (() => {
    try {
        return typeof window !== 'undefined' ? window.localStorage.getItem('i18nextLng') : null;
    } catch {
        return null;
    }
})();

// Initialize i18n
i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        // Keys are English source strings, so English is the correct fallback.
        // (The default *UI* language is still Arabic – see initial language
        // resolution below.) Do not pass `lng` here: with the localStorage
        // detector that would overwrite the merchant's saved choice.
        fallbackLng: 'en',
        partialBundledLanguages: true,
        debug: typeof import.meta !== 'undefined' && import.meta.env?.DEV === true,

        // All supported languages (derived from resources/lang/language.json)
        supportedLngs: languageData.map(lang => lang.code),
        
        // Provide all translations as resources (loaded from local files)
        resources: resources,
        
        // Ensure language codes are normalized (handle 'de-DE' -> 'de')
        cleanCode: true,
        
        detection: {
            // ONLY use localStorage, NO cookies, NO browser detection
            order: ['localStorage'],
            caches: ['localStorage'],
            lookupLocalStorage: 'i18nextLng',
            // Default to Arabic if no language detected
            defaultLanguage: 'ar',
            // Don't detect from navigator to ensure Arabic is default
            checkWhitelist: true
        },
        
        interpolation: {
            escapeValue: false,
        },

        ns: ['translation'],
        defaultNS: 'translation',
        
        // Ensure nested keys work correctly
        keySeparator: '.',
        // Single namespace; keys are natural-language strings such as
        // "Status:" or "Average order value: {{amount}}", so ':' must not be
        // treated as a namespace separator.
        nsSeparator: false,
        
        // React configuration
        react: {
            useSuspense: false
        }
    });

// Function to update document direction based on language
// RTL languages: Arabic, Persian/Farsi, Hebrew, Urdu, and other RTL languages
const updateDirection = (language) => {
    // RTL languages supported in the application
    const rtlLanguages = ['ar', 'fa', 'he', 'ur', 'yi', 'ji', 'iw']; // Arabic, Farsi, Hebrew, Urdu, Yiddish
    const langCode = language ? language.split('-')[0] : 'ar';
    const isRTL = rtlLanguages.includes(langCode);
    const direction = isRTL ? 'rtl' : 'ltr';
    
    // Update HTML element direction
    if (typeof document !== 'undefined') {
        document.documentElement.dir = direction;
        document.documentElement.setAttribute('dir', direction);
        document.documentElement.setAttribute('lang', language || 'ar');
        
        // Also update body if available
        if (document.body) {
            document.body.dir = direction;
        }
    }
};

// Get valid language codes from languageData (single source of truth)
const validLanguages = languageData.map(lang => lang.code);

// Initialize language on first load
// Priority: localStorage > server locale (from Inertia) > default (ar)
// User"'s'" explicit choice (localStorage) takes priority over server locale
// Only run initialization once to prevent overriding language changes
if (typeof window !== 'undefined' && !window.i18nInitialized) {
    window.i18nInitialized = true; // Mark as initialized to prevent re-running
    
    const storedLang = initialStoredLang;
    
    // Try to get locale from server (Inertia page props) as fallback
    let serverLocale = null;
    if (window.Inertia && window.Inertia.page && window.Inertia.page.props) {
        serverLocale = window.Inertia.page.props.locale || window.Inertia.page.props.auth?.lang;
    }
    
    // Determine which language to use
    let targetLang = 'ar'; // Default fallback to Arabic
    
    // Priority 1: User"'s'" stored preference (localStorage)
    if (storedLang && validLanguages.includes(storedLang)) {
        targetLang = storedLang;
    } 
    // Priority 2: Server-provided locale (if no localStorage preference)
    else if (serverLocale && validLanguages.includes(serverLocale)) {
        targetLang = serverLocale;
        // Save server locale to localStorage for future visits
        localStorage.setItem('i18nextLng', serverLocale);
    }
    
    // Load the bundle if it is code-split, then switch.
    ensureLocale(targetLang).finally(() => i18n.changeLanguage(targetLang));
    
    // Update direction immediately based on initial language
    updateDirection(targetLang);
}

// Listen for language changes
i18n.on('languageChanged', (lng) => {
    updateDirection(lng);
    // Switchers call changeLanguage() directly; fetch a code-split bundle
    // if needed and re-emit so components re-render with real strings.
    if (!i18n.hasResourceBundle(lng, 'translation')) {
        ensureLocale(lng).then(() => {
            if (i18n.hasResourceBundle(lng, 'translation') && i18n.language === lng) i18n.changeLanguage(lng);
        });
    }
});

// Export the initialized instance
export default i18n;

// Make sure the i18n instance is available for direct imports
window.i18next = i18n;