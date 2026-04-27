import React from 'react';
import { Link } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useBrand } from '@/contexts/BrandContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { getMarketingLogoDisplayUrl, PUBLIC_BRAND_PRIMARY } from '@/lib/public-brand';

interface CustomPage {
    id: number;
    title: string;
    slug: string;
}

interface HeaderProps {
    brandColor?: string;
    settings: {
        company_name: string;
    };
    customPages?: CustomPage[];
    user?: any;
}

export default function Header({
    settings,
    customPages = [],
    brandColor = PUBLIC_BRAND_PRIMARY,
    user,
}: HeaderProps) {
    const { t } = useTranslation();
    const { logoLight, logoDark } = useBrand();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isScrolled, setIsScrolled] = React.useState(false);

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 12);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const home = route('home');
    const hash = (id: string) => `${home}#${id}`;
    const logoSrc = getMarketingLogoDisplayUrl(logoLight, logoDark, false);

    const customNavItems = customPages
        .filter((page) => !['about-us', 'contact-us', 'faq', 'privacy-policy', 'terms-of-service'].includes(page.slug))
        .slice(0, 2)
        .map((page) => ({
            label: page.title,
            href: route('custom-page.show', page.slug),
            externalToHome: false,
        }));

    const navItems = [
        { label: t('landing.cinematic.header.platform'), href: hash('platform'), externalToHome: true },
        { label: t('landing.cinematic.header.motion'), href: hash('motion-story'), externalToHome: true },
        { label: t('landing.cinematic.header.proof'), href: hash('proof'), externalToHome: true },
        { label: t('landing.cinematic.header.themes'), href: hash('themes'), externalToHome: true },
        { label: t('documentation.title'), href: route('documentation.index'), externalToHome: false },
        ...customNavItems,
        { label: t('landing.cinematic.header.contact'), href: route('contact'), externalToHome: false },
    ];

    const chromeClass = isScrolled
        ? 'border-slate-200/80 bg-white/92 shadow-[0_18px_60px_-28px_rgba(15,23,42,0.22)] backdrop-blur-xl'
        : 'border-transparent bg-white/72 backdrop-blur-lg';

    const primaryCtaLabel = t('landing.cinematic.header.primaryCta');
    const loginLabel = t('Login');

    const renderNavLink = (item: { label: string; href: string; externalToHome: boolean }, mobile = false) => {
        const className = mobile
            ? 'block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950'
            : 'text-sm font-medium text-slate-600 transition hover:text-slate-950';

        if (item.externalToHome) {
            return (
                <a key={item.label} href={item.href} className={className}>
                    {item.label}
                </a>
            );
        }

        return (
            <Link key={item.label} href={item.href} className={className}>
                {item.label}
            </Link>
        );
    };

    return (
        <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-5">
            <div
                className={`mx-auto flex max-w-7xl items-center justify-between rounded-2xl border px-4 py-3 transition duration-300 md:px-5 ${chromeClass}`}
            >
                <Link href={route('home')} className="flex min-w-0 items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)] focus-visible:ring-offset-2">
                    <div className="flex items-center rounded-[18px] border border-slate-200/80 bg-white px-3 py-2 shadow-sm">
                        <img
                            src={logoSrc}
                            alt={settings.company_name}
                            className="h-8 w-auto max-w-[112px] object-contain sm:h-9 sm:max-w-[132px]"
                        />
                    </div>
                    <div className="hidden min-w-0 lg:block">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                            {t('landing.cinematic.header.eyebrow')}
                        </p>
                        <p className="truncate text-sm font-semibold text-slate-900">
                            {t('landing.cinematic.header.subline')}
                        </p>
                    </div>
                </Link>

                <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
                    {navItems.map((item) => renderNavLink(item))}
                </nav>

                <div className="hidden items-center gap-3 lg:flex">
                    <LanguageSwitcher brandColor={brandColor} />
                    {user ? (
                        <Link
                            href={route('dashboard')}
                            className="landing-cta-depth inline-flex items-center justify-center rounded-xl border border-[var(--primary-color)] bg-[var(--primary-color)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_var(--primary-color)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)] focus-visible:ring-offset-2"
                        >
                            {t('Dashboard')}
                        </Link>
                    ) : (
                        <>
                            <Link
                                href={route('login')}
                                className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                            >
                                {loginLabel}
                            </Link>
                            <Link
                                href={route('register.stepper.index')}
                                className="landing-cta-depth inline-flex items-center justify-center rounded-xl border border-[var(--primary-color)] bg-[var(--primary-color)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_-24px_var(--primary-color)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)] focus-visible:ring-offset-2"
                            >
                                {primaryCtaLabel}
                            </Link>
                        </>
                    )}
                </div>

                <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-700 transition hover:bg-slate-50 lg:hidden"
                    onClick={() => setIsMenuOpen((open) => !open)}
                    aria-expanded={isMenuOpen}
                    aria-controls="landing-mobile-menu"
                    aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                >
                    {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            {isMenuOpen ? (
                <div
                    id="landing-mobile-menu"
                    className="mx-auto mt-3 max-w-7xl rounded-2xl border border-slate-200/80 bg-white/96 p-4 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.24)] backdrop-blur-xl lg:hidden"
                >
                    <div className="space-y-1">{navItems.map((item) => renderNavLink(item, true))}</div>
                    <div className="mt-4 border-t border-slate-200/80 pt-4">
                        <div className="mb-4">
                            <LanguageSwitcher brandColor={brandColor} />
                        </div>
                        <div className="grid gap-3">
                            {user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="landing-cta-depth inline-flex items-center justify-center rounded-xl border border-[var(--primary-color)] bg-[var(--primary-color)] px-5 py-3 text-sm font-semibold text-white"
                                >
                                    {t('Dashboard')}
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('register.stepper.index')}
                                        className="landing-cta-depth inline-flex items-center justify-center rounded-xl border border-[var(--primary-color)] bg-[var(--primary-color)] px-5 py-3 text-sm font-semibold text-white"
                                    >
                                        {primaryCtaLabel}
                                    </Link>
                                    <Link
                                        href={route('login')}
                                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-700"
                                    >
                                        {loginLabel}
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </header>
    );
}
