# How Translations Work on Landing Page (http://localhost/)

## Overview
The landing page uses **i18next** with **react-i18next** to handle all translations. All translation files are loaded **locally** (no HTTP requests) from `resources/lang/*.json` files.

---

## 🔄 Complete Translation Flow

### 1. **Initialization (Page Load)**

```
┌─────────────────────────────────────────────────────────┐
│  resources/js/app.tsx                                   │
│  import './i18n';  ← Loads i18n configuration         │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  resources/js/i18n.js                                   │
│                                                          │
│  1. Import all 22 language JSON files:                  │
│     - en.json, ar.json, es.json, fr.json, etc.         │
│                                                          │
│  2. Create resources object:                            │
│     resources = {                                        │
│       en: { translation: enTranslations },              │
│       ar: { translation: arTranslations },             │
│       es: { translation: esTranslations },              │
│       ... (all 22 languages)                           │
│     }                                                    │
│                                                          │
│  3. Initialize i18next:                                │
│     i18n.init({                                          │
│       fallbackLng: 'ar',  ← Default: Arabic             │
│       resources: resources,  ← All translations loaded  │
│       supportedLngs: ['en', 'ar', 'es', ...]           │
│     })                                                   │
│                                                          │
│  4. Determine initial language:                          │
│     Priority:                                            │
│     1. localStorage.getItem('i18nextLng')              │
│     2. Server locale (from Inertia props)               │
│     3. Default: 'ar' (Arabic)                           │
│                                                          │
│  5. Set language:                                        │
│     i18n.changeLanguage(targetLang)                    │
└─────────────────────────────────────────────────────────┘
```

### 2. **Component Usage**

```
┌─────────────────────────────────────────────────────────┐
│  Landing Page Component                                 │
│  resources/js/pages/landing-page/index.tsx              │
│                                                          │
│  const { i18n } = useTranslation();                     │
│  const currentLang = i18n.language;  ← 'ar', 'en', etc │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  Child Components (HeroSection, FeaturesSection, etc.) │
│                                                          │
│  const { t } = useTranslation();                        │
│                                                          │
│  // Use t() function to get translations:              │
│  <h1>{t('landing.hero.title')}</h1>                     │
│                                                          │
│  // i18next automatically:                             │
│  1. Looks up key in current language                    │
│  2. Falls back to Arabic if key missing                 │
│  3. Returns translated string                          │
└─────────────────────────────────────────────────────────┘
```

### 3. **Language Switching**

```
┌─────────────────────────────────────────────────────────┐
│  User clicks language in dropdown                       │
│  (LanguageSwitcher component)                           │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  onClick handler:                                        │
│                                                          │
│  1. localStorage.setItem('i18nextLng', 'fr')          │
│     ← Save to localStorage immediately                  │
│                                                          │
│  2. await i18n.changeLanguage('fr')                     │
│     ← Change i18next language                           │
│     ← Triggers 'languageChanged' event                  │
│     ← All components using useTranslation() re-render   │
│                                                          │
│  3. router.post('/user/language', { language: 'fr' })   │
│     ← Save to backend (database/cookie)                  │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  Components Re-render with New Language                 │
│                                                          │
│  - HeroSection: t('landing.hero.title')                │
│    → Returns French translation                         │
│                                                          │
│  - FeaturesSection: t('landing.features.title')        │
│    → Returns French translation                         │
│                                                          │
│  - All components update instantly                      │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
resources/
├── js/
│   ├── i18n.js                    ← Main i18next configuration
│   ├── app.tsx                    ← Imports i18n.js
│   ├── components/
│   │   └── language-switcher.tsx ← Language dropdown component
│   └── pages/
│       └── landing-page/
│           ├── index.tsx         ← Main landing page
│           └── components/
│               ├── HeroSection.tsx
│               ├── FeaturesSection.tsx
│               ├── WhyChooseUs.tsx
│               └── ... (all use useTranslation())
│
└── lang/
    ├── language.json              ← List of all 22 languages
    ├── en.json                    ← English translations
    ├── ar.json                    ← Arabic translations
    ├── fr.json                    ← French translations
    ├── es.json                    ← Spanish translations
    └── ... (22 total language files)
```

---

## 🔑 Key Concepts

### 1. **Translation Keys**
Translation keys are nested paths like:
- `landing.hero.title` → "Launch Your Online Store in Minutes"
- `landing.features.analytics.title` → "Analytics & Insights"
- `landing.whyChooseUs.badge` → "Why Choose Us"

### 2. **useTranslation() Hook**
```typescript
const { t, i18n } = useTranslation();

// t() - Translation function
t('landing.hero.title')  // Returns translated string

// i18n - i18next instance
i18n.language  // Current language: 'ar', 'en', 'fr', etc.
i18n.changeLanguage('fr')  // Change language
```

### 3. **Reactive Updates**
Components automatically re-render when language changes because:
- `useTranslation()` subscribes to language changes
- When `i18n.changeLanguage()` is called, it triggers re-renders
- All `t()` calls return new translated strings

### 4. **useMemo for Arrays**
For components that create arrays with translations:
```typescript
const features = React.useMemo(() => [
  { title: t('landing.features.analytics.title') },
  { title: t('landing.features.domains.title') }
], [t, i18n.language]);  // Re-create when language changes
```

---

## 🌍 Language Priority

1. **localStorage** (`i18nextLng`) - User's saved preference
2. **Server locale** (from Inertia props) - Backend preference
3. **Default** - Arabic (`ar`)

---

## 📝 Example: Hero Section Translation

```typescript
// HeroSection.tsx
import { useTranslation } from 'react-i18next';

export default function HeroSection() {
  const { t } = useTranslation();
  
  return (
    <>
      <h1>{t('landing.hero.title')}</h1>
      {/* 
        If language is 'en': "Launch Your Online Store in Minutes"
        If language is 'fr': "Lancez votre boutique en ligne en quelques minutes"
        If language is 'ar': "أطلق متجرك الإلكتروني في دقائق"
      */}
      
      <p>{t('landing.hero.subtitle')}</p>
      {/* Automatically translated based on current language */}
    </>
  );
}
```

---

## 🚀 How It Works Step-by-Step

1. **Page loads** → `app.tsx` imports `i18n.js`
2. **i18n.js initializes** → Loads all 22 language JSON files
3. **Language determined** → Checks localStorage → server → default
4. **Components render** → Use `useTranslation()` hook
5. **t() function called** → Looks up key in current language JSON
6. **Translation returned** → Component displays translated text
7. **User changes language** → `i18n.changeLanguage()` called
8. **Components re-render** → All `t()` calls return new translations
9. **Page updates** → Instant language switch, no page reload

---

## ✅ Benefits of This Approach

- ✅ **No HTTP requests** - All translations loaded locally
- ✅ **Instant switching** - No page reload needed
- ✅ **Automatic re-rendering** - Components update automatically
- ✅ **Fallback support** - Falls back to Arabic if translation missing
- ✅ **RTL support** - Automatically handles Arabic, Hebrew, Farsi
- ✅ **Persistent** - Language saved in localStorage

---

## 🔍 Debugging

To see current language in browser console:
```javascript
// In browser console:
window.i18next.language  // Current language code
localStorage.getItem('i18nextLng')  // Stored language preference
```

