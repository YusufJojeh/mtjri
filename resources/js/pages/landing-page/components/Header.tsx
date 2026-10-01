import React, { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBrand } from '@/contexts/BrandContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { PUBLIC_BRAND_PRIMARY, getMarketingLogoDisplayUrl } from '@/lib/public-brand';

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

interface NavItem {
  key: string;
  name: string;
  href: string;
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/**
 * Custom CMS pages that duplicate a built-in public page (or live in the footer)
 * are left out of the header so nothing appears twice.
 */
const EXCLUDED_CUSTOM_SLUGS = [
  'terms',
  'privacy',
  'terms-of-service',
  'privacy-policy',
  'about',
  'about-us',
  'contact',
  'contact-us',
  'faq',
  'features',
  'pricing',
  'templates',
];

function pathOf(href: string): string {
  try {
    return new URL(href, window.location.origin).pathname.replace(/\/+$/, '') || '/';
  } catch {
    return href;
  }
}

export default function Header({ settings, customPages = [], brandColor = PUBLIC_BRAND_PRIMARY, user }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const { logoLight, logoDark } = useBrand();
  const { t } = useTranslation();
  const reduce = useReducedMotion() ?? false;
  const { url } = usePage();

  const primaryColor = settings?.config_sections?.colors?.primary || brandColor;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close the mobile menu with Escape.
  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMenuOpen]);

  const getMenuTitle = (slug: string, fallbackTitle: string): string => {
    const translationKey = `landing.header.menu.${slug}`;
    const translated = t(translationKey);
    return translated && translated !== translationKey ? translated : fallbackTitle;
  };

  const navItems: NavItem[] = [
    { key: 'features', name: t('public.nav.features'), href: route('features') },
    { key: 'templates', name: t('public.nav.templates'), href: route('templates') },
    { key: 'pricing', name: t('public.nav.pricing'), href: route('pricing') },
    { key: 'about', name: t('public.nav.about'), href: route('about') },
    { key: 'docs', name: t('documentation.title', 'Documentation'), href: route('documentation.index') },
    { key: 'contact', name: t('public.nav.contact'), href: route('contact') },
    ...customPages
      .filter((page) => !EXCLUDED_CUSTOM_SLUGS.includes(page.slug))
      .map((page) => ({
        key: `page-${page.slug}`,
        name: getMenuTitle(page.slug, page.title),
        href: route('custom-page.show', page.slug),
      })),
  ];

  const currentPath = pathOf(url);
  const isActive = (item: NavItem) => {
    const itemPath = pathOf(item.href);
    return itemPath !== '/' && (currentPath === itemPath || currentPath.startsWith(`${itemPath}/`));
  };
  const activeKey = navItems.find(isActive)?.key ?? null;
  // The pill follows the pointer and rests on the current page.
  const pillKey = hovered ?? activeKey;

  const headerClasses = isScrolled || isMenuOpen
    ? 'bg-white/85 shadow-lg shadow-slate-900/5 backdrop-blur-xl border-b border-slate-200/80'
    : 'bg-white/70 backdrop-blur-md border-b border-transparent';

  const ctaClass =
    'public-press public-btn-primary inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white outline-none transition-[background-color,box-shadow,transform] duration-200 focus-visible:ring-2 focus-visible:ring-offset-2';

  return (
    <header
      data-testid='landing-header'
      className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,box-shadow,border-color] duration-300 motion-reduce:transition-none ${headerClasses}`}
      style={{ '--primary-color': primaryColor, ['--tw-ring-color' as string]: primaryColor } as React.CSSProperties}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16 gap-4'>
          <div className='flex-shrink-0'>
            <Link href={route('home')} className='public-press flex items-center rounded-md outline-none focus-visible:ring-2'>
              <img
                // Header chrome is always light, so always use the dark-artwork logo.
                src={getMarketingLogoDisplayUrl(logoLight, logoDark, false)}
                alt={settings.company_name}
                className='h-8 w-auto max-w-[100px] object-scale-down sm:max-w-[130px] xl:max-w-[180px]'
              />
            </Link>
          </div>

          <nav
            className='hidden lg:flex items-center gap-0.5'
            aria-label={t('public.nav.label', 'Main navigation')}
            onMouseLeave={() => setHovered(null)}
          >
            {navItems.map((item) => {
              const active = item.key === activeKey;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  onMouseEnter={() => setHovered(item.key)}
                  onFocus={() => setHovered(item.key)}
                  onBlur={() => setHovered(null)}
                  className={`relative rounded-full px-3 py-2 text-sm font-medium outline-none transition-colors duration-150 focus-visible:ring-2 xl:px-3.5 ${
                    active ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {pillKey === item.key && (
                    <motion.span
                      layoutId='header-nav-pill'
                      className='absolute inset-0 rounded-full bg-slate-900/[0.06]'
                      transition={reduce ? { duration: 0 } : { type: 'spring', bounce: 0.12, duration: 0.36 }}
                      aria-hidden
                    />
                  )}
                  <span className='relative'>{item.name}</span>
                  {active && (
                    <span
                      className='absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full'
                      style={{ backgroundColor: primaryColor }}
                      aria-hidden
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className='hidden lg:flex items-center gap-3'>
            <LanguageSwitcher brandColor={primaryColor} />
            {user ? (
              <Link href={route('dashboard')} className={ctaClass}>
                {t('Dashboard')}
              </Link>
            ) : (
              <>
                <Link
                  href={route('login')}
                  className='public-press rounded-lg px-3 py-2 text-sm font-medium text-slate-600 outline-none transition-colors duration-150 hover:text-slate-900 focus-visible:ring-2'
                >
                  {t('Login')}
                </Link>
                <Link href={route('register')} className={ctaClass}>
                  {t('Get Started')}
                </Link>
              </>
            )}
          </div>

          <div className='lg:hidden'>
            <button
              type='button'
              onClick={() => setIsMenuOpen((open) => !open)}
              className='public-press relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 outline-none transition-colors hover:bg-slate-100 focus-visible:ring-2'
              aria-label={isMenuOpen ? t('public.nav.close', 'Close navigation menu') : t('public.nav.open', 'Open navigation menu')}
              aria-expanded={isMenuOpen}
              aria-controls='mobile-menu'
            >
              <AnimatePresence initial={false} mode='popLayout'>
                <motion.span
                  key={isMenuOpen ? 'close' : 'open'}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, rotate: isMenuOpen ? -45 : 45, filter: 'blur(2px)' }}
                  animate={{ opacity: 1, scale: 1, rotate: 0, filter: 'blur(0px)' }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, filter: 'blur(2px)' }}
                  transition={{ duration: 0.18, ease: EASE_OUT }}
                  className='flex'
                >
                  {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isMenuOpen && (
          <motion.div
            key='mobile-menu'
            id='mobile-menu'
            className='lg:hidden overflow-hidden border-t border-slate-200/90 bg-white/95 backdrop-blur-md'
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0.12 : 0.28, ease: EASE_OUT }}
          >
            <motion.div
              className='max-h-[calc(100dvh-4rem)] overflow-y-auto px-4 py-5'
              initial='hidden'
              animate='visible'
              variants={{ visible: { transition: { staggerChildren: reduce ? 0 : 0.03, delayChildren: reduce ? 0 : 0.04 } } }}
            >
              <ul className='space-y-1'>
                {navItems.map((item) => {
                  const active = item.key === activeKey;
                  return (
                    <motion.li
                      key={item.key}
                      variants={{
                        hidden: reduce ? { opacity: 0 } : { opacity: 0, y: -6 },
                        visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE_OUT } },
                      }}
                    >
                      <Link
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        onClick={() => setIsMenuOpen(false)}
                        className={`public-press flex items-center justify-between rounded-xl px-3 py-3 text-base font-medium outline-none transition-colors focus-visible:ring-2 ${
                          active ? 'bg-slate-900/[0.05] text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        {item.name}
                        {active && <span className='h-1.5 w-1.5 rounded-full' style={{ backgroundColor: primaryColor }} aria-hidden />}
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
              <motion.div
                className='mt-4 space-y-3 border-t border-slate-200 pt-4'
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { duration: 0.22, ease: EASE_OUT } },
                }}
              >
                <div className='pb-1'>
                  <LanguageSwitcher brandColor={primaryColor} />
                </div>
                {user ? (
                  <Link href={route('dashboard')} className={`${ctaClass} w-full`}>
                    {t('Dashboard')}
                  </Link>
                ) : (
                  <div className='grid grid-cols-2 gap-3'>
                    <Link
                      href={route('login')}
                      className='public-press inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 outline-none focus-visible:ring-2'
                    >
                      {t('Login')}
                    </Link>
                    <Link href={route('register')} className={ctaClass}>
                      {t('Get Started')}
                    </Link>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
