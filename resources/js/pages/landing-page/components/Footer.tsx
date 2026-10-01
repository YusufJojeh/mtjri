import React from 'react';
import { Link } from '@inertiajs/react';
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PUBLIC_BRAND_PRIMARY, PUBLIC_BRAND_SECONDARY, PUBLIC_BRAND_ACCENT } from '@/lib/public-brand';

interface FooterProps {
  brandColor?: string;
  settings: {
    company_name: string;
    contact_email: string;
    contact_phone: string;
    contact_address: string;
    config_sections?: {
      colors?: {
        primary?: string;
        secondary?: string;
        accent?: string;
      };
    };
  };
  /** Skip the CTA strip when the page already ends with its own call to action. */
  hideCta?: boolean;
}

export default function Footer({ settings, brandColor = PUBLIC_BRAND_PRIMARY, hideCta = false }: FooterProps) {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  
  // Get colors from settings
  const colors = settings?.config_sections?.colors || {
    primary: brandColor,
    secondary: PUBLIC_BRAND_SECONDARY,
    accent: PUBLIC_BRAND_ACCENT,
  };
  const primaryColor = colors.primary || brandColor;
  const accentColor = colors.accent || PUBLIC_BRAND_ACCENT;

  const footerNav = {
    product: [
      { name: t('public.nav.features'), href: route('features') },
      { name: t('public.nav.templates'), href: route('templates') },
      { name: t('public.nav.pricing'), href: route('pricing') },
    ],
    company: [
      { name: t('public.nav.about'), href: route('about') },
      { name: t('public.nav.contact'), href: route('contact') },
    ],
    support: [
      { name: t('documentation.title', 'Documentation'), href: route('documentation.index') },
      { name: t('public.nav.faq'), href: route('faq') },
    ],
  };

  const iconMap: Record<string, any> = {
    Facebook,
    Twitter,
    Linkedin,
    Instagram
  };
  
  // Static social links - no dynamic data
  const socialLinks = [
    { name: 'Facebook', icon: 'Facebook', href: '#' },
    { name: 'Twitter', icon: 'Twitter', href: '#' },
    { name: 'LinkedIn', icon: 'Linkedin', href: '#' },
    { name: 'Instagram', icon: 'Instagram', href: '#' }
  ];

  return (
    <footer data-testid='landing-footer' className='bg-gray-900 text-white'>
{!hideCta && (
      <div className='border-b border-white/10 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950'>
        <div className='container mx-auto flex flex-col items-center gap-6 px-4 py-14 text-center md:flex-row md:justify-between md:text-start'>
          <div className='max-w-xl'>
            <h2 className='text-2xl font-bold tracking-tight md:text-3xl'>{t('landing.footer.ctaTitle')}</h2>
            <p className='mt-2 text-zinc-400'>{t('landing.footer.ctaSubtitle')}</p>
          </div>
          <div className='flex shrink-0 flex-col gap-3 sm:flex-row'>
            <Link
              href={route('register')}
              className='landing-cta-primary landing-cta-depth inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-sm font-semibold text-white focus:outline-none'
              style={{ backgroundColor: primaryColor }}
            >
              {t('landing.hero.primaryButton')}
            </Link>
            <Link
              href={route('login')}
              className='landing-cta-secondary landing-cta-depth inline-flex items-center justify-center rounded-xl border-2 border-white/25 bg-transparent px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/10 focus:outline-none'
              style={{ borderColor: `${primaryColor}66` }}
            >
              {t('landing.hero.secondaryButton')}
            </Link>
          </div>
        </div>
      </div>
      )}

      <div className='border-b border-white/10'>
        <div className='container mx-auto grid gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4'>
          <div>
            <h3 className='text-xs font-semibold uppercase tracking-wider text-zinc-500'>
              {t('public.footer.product')}
            </h3>
            <ul className='mt-4 space-y-2 text-sm'>
              {footerNav.product.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className='text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-sm'
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className='text-xs font-semibold uppercase tracking-wider text-zinc-500'>
              {t('public.footer.company')}
            </h3>
            <ul className='mt-4 space-y-2 text-sm'>
              {footerNav.company.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className='text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-sm'
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className='text-xs font-semibold uppercase tracking-wider text-zinc-500'>
              {t('public.footer.support')}
            </h3>
            <ul className='mt-4 space-y-2 text-sm'>
              {footerNav.support.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className='text-zinc-400 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-sm'
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className='space-y-3 text-sm text-zinc-400'>
            <h3 className='text-xs font-semibold uppercase tracking-wider text-zinc-500'>
              {t('public.footer.contact')}
            </h3>
            {settings.contact_email ? (
              <a
                href={`mailto:${settings.contact_email}`}
                className='flex items-center gap-2 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-sm'
              >
                <Mail className='h-4 w-4 shrink-0 text-zinc-500' aria-hidden />
                {settings.contact_email}
              </a>
            ) : null}
            {settings.contact_phone ? (
              <p className='flex items-center gap-2'>
                <Phone className='h-4 w-4 shrink-0 text-zinc-500' aria-hidden />
                {settings.contact_phone}
              </p>
            ) : null}
            {settings.contact_address ? (
              <p className='flex items-start gap-2'>
                <MapPin className='mt-0.5 h-4 w-4 shrink-0 text-zinc-500' aria-hidden />
                <span>{settings.contact_address}</span>
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className='container mx-auto px-4'>
        {/* Bottom Footer */}
        <div className='py-8 md:py-10'>
          <div className='flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6'>
            {/* Copyright and Legal Links */}
            <div className='flex flex-col md:flex-row items-center gap-3 md:gap-6'>
              <div className='text-gray-400 text-sm text-center md:text-start'>
                © {currentYear} {settings.company_name}. {t('public.footer.rights')}
              </div>
              <div className='flex items-center gap-4 text-sm'>
                <Link 
                  href={route('privacy')}
                  className='text-gray-400 hover:text-white transition-colors'
                >
                  {t('public.legal.privacy.title')}
                </Link>
                <span className='text-gray-600'>•</span>
                <Link 
                  href={route('terms')}
                  className='text-gray-400 hover:text-white transition-colors'
                >
                  {t('public.legal.terms.title')}
                </Link>
              </div>
            </div>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className='flex items-center gap-3 md:gap-4'>
                <span className='text-gray-400 text-sm hidden sm:inline'>{t('public.footer.followUs')}</span>
                <div className='flex gap-2 md:gap-3'>
                  {socialLinks.map((social) => {
                    const IconComponent = iconMap[social.icon] || Facebook;
                    return (
                      <a
                        key={social.name}
                        href={social.href}
                        className='flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800 transition-colors duration-200 motion-safe:transition-transform motion-safe:hover:-translate-y-px'
                        style={{
                          '--hover-bg': accentColor
                        } as React.CSSProperties}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = accentColor;
                          const icon = e.currentTarget.querySelector('svg');
                          if (icon) {
                            icon.classList.add('text-white');
                            icon.classList.remove('text-gray-400');
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#1f2937';
                          const icon = e.currentTarget.querySelector('svg');
                          if (icon) {
                            icon.classList.remove('text-white');
                            icon.classList.add('text-gray-400');
                          }
                        }}
                        aria-label={social.name}
                      >
                        <IconComponent className='w-4 h-4 text-gray-400 transition-colors' />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}