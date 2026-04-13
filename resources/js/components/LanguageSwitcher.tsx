import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import languageData from '@/../../resources/lang/language.json';

interface LanguageSwitcherProps {
  brandColor?: string;
}

export default function LanguageSwitcher({ brandColor = '#3b82f6' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  // Map language.json format to component format
  const languages = languageData.map(lang => ({
    code: lang.code,
    name: lang.name,
    nativeName: lang.name
  }));

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = async (langCode: string) => {
    setIsOpen(false);
    
    // Save to localStorage FIRST to ensure it persists
    localStorage.setItem('i18nextLng', langCode);
    
    // Change language (translations are already loaded from local files)
    await i18n.changeLanguage(langCode);
    
    // Update document direction
    const rtlLanguages = ['ar', 'fa', 'he', 'ur'];
    const isRTL = rtlLanguages.includes(langCode);
    const direction = isRTL ? 'rtl' : 'ltr';
    
    if (typeof document !== 'undefined') {
      document.documentElement.dir = direction;
      document.documentElement.setAttribute('dir', direction);
      document.documentElement.setAttribute('lang', langCode);
      if (document.body) {
        document.body.dir = direction;
      }
    }
  };

  return (
    <div className='relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100'
        style={{ color: brandColor }}
        aria-label='Change language'
        aria-expanded={isOpen}
      >
        <Globe className='w-4 h-4' />
        <span className='hidden sm:inline'>{currentLanguage.nativeName}</span>
        <span className='sm:hidden'>{currentLanguage.code.toUpperCase()}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className='fixed inset-0 z-10'
            onClick={() => setIsOpen(false)}
          />
          <div className='absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20'>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  i18n.language === lang.code
                    ? 'bg-gray-100 font-semibold'
                    : 'hover:bg-gray-50'
                }`}
                style={{
                  color: i18n.language === lang.code ? brandColor : '#374151'
                }}
              >
                <div className='flex items-center'>
                  <span>{lang.nativeName}</span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

