import React, { useEffect } from 'react';
import { usePage, Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import Header from './components/Header';
import Footer from './components/Footer';
import ContactSection from './components/ContactSection';
import FeaturesSection from './components/FeaturesSection';
import AboutUs from './components/AboutUs';
import FaqSection from './components/FaqSection';
import { useFavicon } from '@/hooks/use-favicon';
import { sanitizeHtml } from '@/utils/sanitize';
import { resolvePublicBrandColors } from '@/lib/public-brand';

interface CustomPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  is_active: boolean;
}

interface CustomPageData {
  id: number;
  title: string;
  slug: string;
}

interface PageProps {
  page: CustomPage;
  customPages: CustomPageData[];
  settings: {
    company_name: string;
    contact_email?: string;
    contact_phone?: string;
    contact_address?: string;
    config_sections?: {
      sections?: Array<{
        key: string;
        [key: string]: any;
      }>;
      colors?: {
        primary?: string;
        secondary?: string;
        accent?: string;
      };
      theme?: {
        primary_color?: string;
        secondary_color?: string;
        accent_color?: string;
      };
    };
    [key: string]: any;
  };
  [key: string]: any;
}

export default function CustomPage() {
  // Custom CSS to fix styling issues
  const customCSS = `
    /* Fix form inputs */
    .custom-page-content input:focus, 
    .custom-page-content textarea:focus {
      --tw-ring-color: var(--primary-color) !important;
      border-color: var(--primary-color) !important;
    }
    
    /* Fix color issues */
    .custom-page-content .bg-blue-50 { background-color: rgba(var(--primary-color-rgb), 0.1) !important; }
    .custom-page-content .bg-purple-50 { background-color: rgba(var(--secondary-color-rgb), 0.1) !important; }
    .custom-page-content .bg-green-50 { background-color: rgba(var(--accent-color-rgb), 0.1) !important; }
    .custom-page-content .bg-red-50 { background-color: rgba(var(--accent-color-rgb), 0.1) !important; }
    
    .custom-page-content .text-blue-600 { color: var(--primary-color) !important; }
    .custom-page-content .text-purple-600 { color: var(--secondary-color) !important; }
    .custom-page-content .text-green-600 { color: var(--accent-color) !important; }
    .custom-page-content .text-red-600 { color: var(--accent-color) !important; }
    
    .custom-page-content .border-blue-500 { border-color: var(--primary-color) !important; }
    .custom-page-content .border-purple-500 { border-color: var(--secondary-color) !important; }
    .custom-page-content .border-green-500 { border-color: var(--accent-color) !important; }
    .custom-page-content .border-red-500 { border-color: var(--accent-color) !important; }
    
    .custom-page-content .bg-blue-600 { background-color: var(--primary-color) !important; }
    .custom-page-content .bg-purple-600 { background-color: var(--secondary-color) !important; }
    .custom-page-content .bg-green-600 { background-color: var(--accent-color) !important; }
    .custom-page-content .bg-red-500 { background-color: var(--accent-color) !important; }
    
    /* Fix border colors */
    .custom-page-content .border-blue-200 { border-color: rgba(var(--primary-color-rgb), 0.2) !important; }
    .custom-page-content .border-green-200 { border-color: rgba(var(--accent-color-rgb), 0.2) !important; }
    
    /* Fix hover states */
    .custom-page-content .hover\\:bg-blue-700:hover { background-color: var(--primary-color) !important; opacity: 0.9; }
    
    /* Fix form button */
    .custom-page-content .bg-blue-600 { background-color: var(--primary-color) !important; }
  `;
  const { page, customPages = [], settings } = usePage<PageProps>().props;
  const themeColors = settings?.config_sections?.theme || {};
  const resolved = resolvePublicBrandColors(settings, {
    primary: settings?.config_sections?.colors?.primary || themeColors.primary_color,
    secondary: settings?.config_sections?.colors?.secondary || themeColors.secondary_color,
    accent: settings?.config_sections?.colors?.accent || themeColors.accent_color,
  });
  const primaryColor = resolved.primary;
  const secondaryColor = resolved.secondary;
  const accentColor = resolved.accent;
  useFavicon();
  
  // Get current language and set direction
  const { i18n } = useTranslation();
  
  // RTL languages
  const rtlLanguages = ['ar', 'fa', 'ur'];
  
  // Update document direction when language changes
  useEffect(() => {
    const currentLang = i18n.language || 'ar';
    const isRTL = rtlLanguages.includes(currentLang.split('-')[0]); // Handle lang codes like 'ar-SA'
    const direction = isRTL ? 'rtl' : 'ltr';
    
    // Update HTML element direction
    document.documentElement.dir = direction;
    document.documentElement.setAttribute('dir', direction);
    document.documentElement.setAttribute('lang', currentLang);
    
    // Also update body if needed
    if (document.body) {
      document.body.dir = direction;
    }
  }, [i18n.language]);
  
  // Get current direction based on language
  const currentLang = i18n.language || 'ar';
  const isRTL = rtlLanguages.includes(currentLang.split('-')[0]);
  const currentDirection = isRTL ? 'rtl' : 'ltr';

  // Check if this is the about-us page
  const isAboutUsPage = page.slug === 'about-us';
  // Check if this is the contact-us page
  const isContactUsPage = page.slug === 'contact-us';
  // Check if this is the features page
  const isFeaturesPage = page.slug === 'features';
  // Check if this is the FAQ page
  const isFaqPage = page.slug === 'faq';
  
  // All content is now static from i18next - no dynamic section data needed
  // Get FAQs array for FaqSection component (only from backend if available, otherwise empty)
  const getFaqs = (): Array<{ id: number; question: string; answer: string }> => {
    // Return empty array - FAQs should come from i18next translations
    return [];
  };

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string): string => {
    const result = hex.replace('#', '').match(/.{2}/g);
    if (!result) return '59, 130, 246';
    return result.map(x => parseInt(x, 16)).join(', ');
  };

  return (
    <>
      <Head>
        <title>{page.meta_title || page.title}</title>
        {page.meta_description && (
          <meta name='description' content={page.meta_description} />
        )}
        <style>{customCSS}</style>
      </Head>
      
      <div 
        data-public-shell
        className='relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900' 
        dir={currentDirection}
        style={{ 
          '--primary-color': primaryColor,
          '--secondary-color': secondaryColor,
          '--accent-color': accentColor,
          '--primary-color-rgb': hexToRgb(primaryColor),
          '--secondary-color-rgb': hexToRgb(secondaryColor),
          '--accent-color-rgb': hexToRgb(accentColor)
        } as React.CSSProperties}
      >
        <div className='public-ambient-mesh pointer-events-none fixed inset-0 -z-10' aria-hidden />
        <div className='public-noise pointer-events-none fixed inset-0 -z-10' aria-hidden />
        <Header 
          settings={settings} 
          customPages={customPages}
          brandColor={primaryColor}
        />
        
        <main className='pt-16'>
          {isContactUsPage ? (
            // Contact Us Page Design
            <div className='pt-0 '>
              <ContactSection 
                flash={{}}
                settings={settings}
                brandColor={primaryColor}
              />
            </div>
          ) : isFaqPage ? (
            // FAQ Page Design
            <div className='pt-0'>
              <FaqSection 
                faqs={getFaqs()}
                settings={settings}
                brandColor={primaryColor}
              />
            </div>
          ) : isFeaturesPage ? (
            // Features Page Design
            <div className='pt-0'>
              <FeaturesSection 
                settings={settings}
                brandColor={primaryColor}
              />
            </div>
          ) : isAboutUsPage ? (
            // About Us Page Design
            <div className='pt-0 container mx-auto max-w-7xl'>
              <AboutUs 
                settings={settings}
                brandColor={primaryColor}
              />
            </div>
          ) : (
            // Regular Page Content
            <div className='relative isolate'>
              <div className='landing-page-ambient-top' aria-hidden />
              <div className='container mx-auto px-4 py-16 md:py-24'>
              <div className='mx-auto max-w-4xl'>
                <div className='mb-8'>
                  <h1 className='text-4xl md:text-5xl font-bold mb-4 text-gray-900'>{page.title}</h1>
                  {page.meta_description && (
                    <p className='text-lg text-gray-600 mt-4'>{page.meta_description}</p>
                  )}
                </div>
                <div
                  className='custom-page-content landing-card-depth prose prose-lg max-w-none rounded-2xl border border-slate-200/90 bg-white/90 p-8 shadow-sm prose-headings:font-bold prose-headings:text-gray-900 prose-p:leading-relaxed prose-p:text-gray-700 prose-a:text-blue-600 prose-a:no-underline prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:text-gray-700 hover:prose-a:underline md:p-12'
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content || '') }}
                />
              </div>
              </div>
            </div>
          )}
        </main>
        
        <Footer 
          settings={{
            company_name: settings?.company_name || 'MTJRii',
            contact_email: settings?.contact_email || '',
            contact_phone: settings?.contact_phone || '',
            contact_address: settings?.contact_address || '',
            config_sections: settings?.config_sections
          }}
          brandColor={primaryColor}
        />
      </div>
    </>
  );
}