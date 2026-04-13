import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import languageData from '@/../../resources/lang/language.json';

// Import all translation files directly (local files, no HTTP requests)
import enTranslations from '@/../../resources/lang/en.json';
import arTranslations from '@/../../resources/lang/ar.json';
import esTranslations from '@/../../resources/lang/es.json';
import daTranslations from '@/../../resources/lang/da.json';
import deTranslations from '@/../../resources/lang/de.json';
import frTranslations from '@/../../resources/lang/fr.json';
import itTranslations from '@/../../resources/lang/it.json';
import jaTranslations from '@/../../resources/lang/ja.json';
import nlTranslations from '@/../../resources/lang/nl.json';
import plTranslations from '@/../../resources/lang/pl.json';
import ptTranslations from '@/../../resources/lang/pt.json';
import ptBRTranslations from '@/../../resources/lang/pt-BR.json';
import ruTranslations from '@/../../resources/lang/ru.json';
import trTranslations from '@/../../resources/lang/tr.json';
import zhTranslations from '@/../../resources/lang/zh.json';
import heTranslations from '@/../../resources/lang/he.json';
import faTranslations from '@/../../resources/lang/fa.json';
import etTranslations from '@/../../resources/lang/et.json';
import idTranslations from '@/../../resources/lang/id.json';
import roTranslations from '@/../../resources/lang/ro.json';
import thTranslations from '@/../../resources/lang/th.json';
import zhCNTranslations from '@/../../resources/lang/zh-CN.json';
import zhTWTranslations from '@/../../resources/lang/zh-TW.json';

// Make i18n instance available for direct imports
export { default as i18next } from 'i18next';

/**
 * i18next Local Translation Configuration
 * 
 * This configuration uses ONLY local JSON translation files.
 * All translations are loaded directly from resources/lang/{locale}.json files.
 * NO HTTP requests, NO Laravel backend dependency.
 * 
 * Translations are bundled with the frontend build.
 * All React components use useTranslation() and t() from react-i18next.
 */

// Prepare resources object with all translations
const resources = {
    en: { translation: enTranslations },
    ar: { translation: arTranslations },
    es: { translation: esTranslations },
    da: { translation: daTranslations },
    de: { translation: deTranslations },
    fr: { translation: frTranslations },
    it: { translation: itTranslations },
    ja: { translation: jaTranslations },
    nl: { translation: nlTranslations },
    pl: { translation: plTranslations },
    pt: { translation: ptTranslations },
    'pt-BR': { translation: ptBRTranslations },
    ru: { translation: ruTranslations },
    tr: { translation: trTranslations },
    zh: { translation: zhTranslations },
    he: { translation: heTranslations },
    fa: { translation: faTranslations },
    et: { translation: etTranslations },
    id: { translation: idTranslations },
    ro: { translation: roTranslations },
    th: { translation: thTranslations },
    'zh-CN': { translation: zhCNTranslations },
    'zh-TW': { translation: zhTWTranslations },
};

// Initialize i18n
i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'ar',
        lng: 'ar', // Arabic is the default language
        debug: typeof process !== 'undefined' && process.env?.NODE_ENV === 'development',

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
        nsSeparator: ':',
        
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
    
    const storedLang = localStorage.getItem('i18nextLng');
    
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
    
    // Set the language (translations are already loaded from local files)
    i18n.changeLanguage(targetLang);
    
    // Update direction immediately based on initial language
    updateDirection(targetLang);
}

// Listen for language changes
i18n.on('languageChanged', (lng) => {
    updateDirection(lng);
    // Translations are already loaded from local files, no need to reload
});

// Export the initialized instance
export default i18n;

// Make sure the i18n instance is available for direct imports
window.i18next = i18n;