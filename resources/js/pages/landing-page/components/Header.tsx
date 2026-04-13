import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBrand } from '@/contexts/BrandContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { PUBLIC_BRAND_PRIMARY, PUBLIC_BRAND_SECONDARY, getMarketingLogoDisplayUrl } from '@/lib/public-brand';

interface CustomPage {
  id: number;
  title: string;
  slug: string;
}

interface HeaderProps {
  brandColor?: string;
  settings: {
    company_name: string;
    config_sections?: {
      colors?: {
        primary?: string;
        secondary?: string;
        accent?: string;
      };
    };
    [key: string]: any;
  };
  customPages?: CustomPage[];
  user?: any;
}

export default function Header({ settings, customPages = [], brandColor = PUBLIC_BRAND_PRIMARY, user }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { logoLight, logoDark } = useBrand();
  
  // Get colors from settings
  const colors = settings?.config_sections?.colors || {
    primary: brandColor,
    secondary: PUBLIC_BRAND_SECONDARY,
    accent: brandColor,
  };
  const primaryColor = colors.primary || brandColor;
  const secondaryColor = colors.secondary || PUBLIC_BRAND_SECONDARY;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { t } = useTranslation();
  
  // Filter out Terms and Privacy from header navbar (they stay in footer)
  const excludedFromHeader = ['terms', 'privacy', 'terms-of-service', 'privacy-policy'];
  
  // Helper function to get translated menu title from slug
  const getMenuTitle = (slug: string, fallbackTitle: string): string => {
    // Map common page slugs to translation keys
    const translationKey = `landing.header.menu.${slug}`;
    const translated = t(translationKey);
    
    // If translation exists and is different from the key, use it
    // Otherwise, use the fallback title (but this shouldn't happen if translations are set)
    if (translated && translated !== translationKey) {
      return translated;
    }
    
    // Fallback: return the fallback title (from backend) if translation not found
    // This handles dynamic pages that might not have translations
    return fallbackTitle;
  };
  
  const menuItems = customPages
    .filter(page => !excludedFromHeader.includes(page.slug))
    .map(page => ({
      name: getMenuTitle(page.slug, page.title),
      href: route('custom-page.show', page.slug)
    }));
  // Static styling - no dynamic data
  const getHeaderClasses = () =>
    isScrolled
      ? 'bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur-xl border-b border-slate-200/80'
      : 'bg-white/70 backdrop-blur-md border-b border-transparent';

  const getHeaderStyle = () => ({});

  return (
    <header 
      data-testid='landing-header'
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 motion-reduce:transition-none ${getHeaderClasses()}`}
      style={getHeaderStyle()}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo */}
          <div className='flex-shrink-0'>
            <Link 
              href={route('home')} 
              className='flex items-center transition-colors'
            >
              {(() => {
                // Header chrome is always light (white/blur). Do not tie to `html.dark` or the light
                // mark is used and disappears on the bar.
                const displayUrl = getMarketingLogoDisplayUrl(logoLight, logoDark, false);
                return (
                  <img
                    src={displayUrl}
                    alt={settings.company_name}
                    className='h-8 w-auto max-w-[100px] object-scale-down transition-all duration-200 sm:max-w-[130px] xl:max-w-[180px]'
                  />
                );
              })()} 
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className='hidden lg:flex items-center xl:space-x-8 space-x-4' role='navigation' aria-label='Main navigation'>
            {/* Documentation Link */}
            <Link
              href={route('documentation.index')}
              className='text-slate-600 text-sm font-medium transition-colors relative group'
              style={{ '--hover-color': primaryColor } as React.CSSProperties}
              onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
              onMouseLeave={(e) => e.currentTarget.style.color = ''}
            >
              {t('documentation.title', 'Documentation')}
              <span
                className='absolute -bottom-1 left-0 h-0.5 w-0 motion-safe:transition-all motion-safe:duration-300 group-hover:w-full'
                style={{ backgroundColor: primaryColor }}
                aria-hidden='true'
              />
            </Link>

            <Link
              href={route('contact')}
              className='text-slate-600 text-sm font-medium transition-colors relative group'
              onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
              onMouseLeave={(e) => e.currentTarget.style.color = ''}
            >
              {t('landing.header.contact', 'Contact')}
              <span
                className='absolute -bottom-1 left-0 h-0.5 w-0 motion-safe:transition-all motion-safe:duration-300 group-hover:w-full'
                style={{ backgroundColor: primaryColor }}
                aria-hidden
              />
            </Link>

            {menuItems.map((item: any) => (
              <Link
                key={item.name}
                href={item.href}
                className='text-slate-600 text-sm font-medium transition-colors relative group'
                style={{ '--hover-color': primaryColor } as React.CSSProperties}
                onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
                onMouseLeave={(e) => e.currentTarget.style.color = ''}
              >
                {item.name}
                <span
                  className='absolute -bottom-1 left-0 h-0.5 w-0 motion-safe:transition-all motion-safe:duration-300 group-hover:w-full'
                  style={{ backgroundColor: primaryColor }}
                  aria-hidden='true'
                />
              </Link>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className='hidden lg:flex items-center gap-4'>
            <LanguageSwitcher brandColor={primaryColor} />
            {user ? (
              <Link
                href={route('dashboard')}
                className='landing-cta-depth landing-cta-primary rounded-lg border px-6 py-2.5 text-sm font-semibold text-white transition-colors'
                style={{
                  backgroundColor: primaryColor,
                  borderColor: primaryColor,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = secondaryColor;
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = primaryColor;
                  e.currentTarget.style.color = 'white';
                }}
              >
                {t('Dashboard')}
              </Link>
            ) : (
              <>
                <Link
                  href={route('login')}
                  className='text-slate-600 text-sm font-medium transition-colors'
                  onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
                  onMouseLeave={(e) => e.currentTarget.style.color = ''}
                >
                  {t('Login')}
                </Link>
                <Link
                  href={route('register')}
                  className='landing-cta-depth landing-cta-primary rounded-lg border px-6 py-2.5 text-sm font-semibold text-white transition-colors'
                  style={{
                    backgroundColor: primaryColor,
                    borderColor: primaryColor,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = secondaryColor;
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = primaryColor;
                    e.currentTarget.style.color = 'white';
                  }}
                >
                  {t('Get Started')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className='lg:hidden'>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className='p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
              style={{ ['--tw-ring-color' as string]: primaryColor }}
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMenuOpen}
              aria-controls='mobile-menu'
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className='lg:hidden border-t border-slate-200/90 bg-white/95 backdrop-blur-md' id='mobile-menu'>
            <div className='px-4 py-6 space-y-4'>
              {/* Documentation Link (Mobile) */}
              <Link
                href={route('documentation.index')}
                className='block text-slate-600 hover:text-slate-900 text-base font-medium transition-colors'
                onClick={() => setIsMenuOpen(false)}
              >
                {t('documentation.title', 'Documentation')}
              </Link>

              <Link
                href={route('contact')}
                className='block text-slate-600 hover:text-slate-900 text-base font-medium transition-colors'
                onClick={() => setIsMenuOpen(false)}
              >
                {t('landing.header.contact', 'Contact')}
              </Link>

              {menuItems.map((item: any) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className='block text-slate-600 hover:text-slate-900 text-base font-medium transition-colors'
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className='pt-4 space-y-3 border-t border-slate-200'>
                <div className='pb-3'>
                  <LanguageSwitcher brandColor={primaryColor} />
                </div>
                {user ? (
                  <Link
                    href={route('dashboard')}
                    className='landing-cta-depth landing-cta-primary block w-full rounded-lg border py-2.5 text-center text-sm font-semibold text-white transition-colors'
                    style={{
                      backgroundColor: primaryColor,
                      borderColor: primaryColor,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = secondaryColor;
                      e.currentTarget.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = primaryColor;
                      e.currentTarget.style.color = 'white';
                    }}
                  >
                    {t('Dashboard')}
                  </Link>
                ) : (
                  <>
                    <Link
                      href={route('login')}
                      className='block w-full text-center text-slate-600 py-2.5 text-sm font-medium transition-colors'
                      onMouseEnter={(e) => e.currentTarget.style.color = primaryColor}
                      onMouseLeave={(e) => e.currentTarget.style.color = ''}
                    >
                      {t('Login')}
                    </Link>
                    <Link
                      href={route('register')}
                      className='landing-cta-depth landing-cta-primary block w-full rounded-lg border py-2.5 text-center text-sm font-semibold text-white transition-colors'
                      style={{
                        backgroundColor: primaryColor,
                        borderColor: primaryColor,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = secondaryColor;
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = primaryColor;
                        e.currentTarget.style.color = 'white';
                      }}
                    >
                      {t('Get Started')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}