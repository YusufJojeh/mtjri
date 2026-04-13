import React from 'react';
import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    LogIn,
    Sparkles,
    Store,
    ShoppingCart,
    Palette,
    Smartphone,
    CreditCard,
    LayoutGrid,
    BarChart3,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { landingHeroContainer, landingFadeUp, landingTransition } from '../lib/landing-motion';
import { sanitizeLandingHex } from '../lib/landing-brand';
import { useBrand } from '@/contexts/BrandContext';
import {
    PUBLIC_BRAND_ACCENT,
    PUBLIC_BRAND_PRIMARY,
    PUBLIC_BRAND_SECONDARY,
    getMarketingLogoDisplayUrl,
} from '@/lib/public-brand';

interface HeroSectionProps {
    brandColor?: string;
    settings: any;
}

export default function HeroSection({ settings, brandColor = PUBLIC_BRAND_PRIMARY }: HeroSectionProps) {
    const { t } = useTranslation();
    const { logoLight, logoDark } = useBrand();
    const reduce = useReducedMotion() ?? false;

    // Hero / mockup sit on light mesh backgrounds; same as header — avoid `html.dark` or logo vanishes.
    const heroLogoSrc = getMarketingLogoDisplayUrl(logoLight, logoDark, false);

    const colors = settings?.config_sections?.colors || {
        primary: brandColor,
        secondary: PUBLIC_BRAND_SECONDARY,
        accent: PUBLIC_BRAND_ACCENT,
    };
    const primaryColor = sanitizeLandingHex(colors.primary, brandColor);
    const secondaryColor = sanitizeLandingHex(colors.secondary, PUBLIC_BRAND_SECONDARY);
    const accentColor = sanitizeLandingHex(colors.accent, PUBLIC_BRAND_ACCENT);

    const stats = [
        { value: t('landing.hero.stats.users.value'), label: t('landing.hero.stats.users.label'), color: primaryColor },
        { value: t('landing.hero.stats.countries.value'), label: t('landing.hero.stats.countries.label'), color: secondaryColor },
        { value: t('landing.hero.stats.satisfaction.value'), label: t('landing.hero.stats.satisfaction.label'), color: accentColor },
    ];

    const rail = [
        { label: t('landing.hero.rail.payments'), Icon: CreditCard },
        { label: t('landing.hero.rail.storefronts'), Icon: LayoutGrid },
        { label: t('landing.hero.rail.analytics'), Icon: BarChart3 },
    ];

    const primaryShadow = `0 12px 40px -12px color-mix(in srgb, ${primaryColor} 55%, transparent)`;
    const mockShadow = `0 40px 100px -32px color-mix(in srgb, ${primaryColor} 28%, transparent)`;

    return (
        <section
            id='hero'
            className='relative isolate overflow-hidden pt-28 pb-16 md:pb-24 lg:pt-32 lg:pb-28'
            aria-labelledby='hero-heading'
        >
            <div className='landing-hero-mesh absolute inset-0 -z-20' />
            <div className='landing-hero-brand-glow' aria-hidden />
            <div className='landing-noise pointer-events-none absolute inset-0 -z-10' aria-hidden />

            <div className='container relative mx-auto px-4'>
                <div className='grid items-center gap-14 lg:grid-cols-2 lg:gap-12'>
                    <motion.div
                        initial='hidden'
                        animate='visible'
                        variants={landingHeroContainer}
                        custom={reduce}
                        className='max-w-xl lg:max-w-none'
                    >
                        <motion.div variants={landingFadeUp} custom={reduce}>
                            <span className='inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-medium text-slate-800 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-white'>
                                <Sparkles className='h-4 w-4 shrink-0' style={{ color: primaryColor }} aria-hidden />
                                <span
                                    className='landing-live-dot relative inline-flex h-2 w-2 shrink-0 rounded-full'
                                    style={{ backgroundColor: accentColor }}
                                    aria-hidden
                                />
                                <span>{t('landing.hero.announcement')}</span>
                            </span>
                        </motion.div>

                        <motion.p
                            variants={landingFadeUp}
                            custom={reduce}
                            className='mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-zinc-400'
                        >
                            {t('landing.hero.kicker')}
                        </motion.p>

                        <motion.h1
                            id='hero-heading'
                            variants={landingFadeUp}
                            custom={reduce}
                            className='mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl lg:leading-[1.05] dark:text-white'
                        >
                            {t('landing.hero.title')}
                        </motion.h1>

                        <motion.p
                            variants={landingFadeUp}
                            custom={reduce}
                            className='mt-6 text-lg leading-relaxed text-slate-600 md:text-xl dark:text-zinc-300'
                        >
                            {t('landing.hero.subtitle')}
                        </motion.p>

                        <motion.div
                            variants={landingFadeUp}
                            custom={reduce}
                            className='mt-10 flex flex-col gap-4 sm:flex-row sm:items-center'
                        >
                            <Link
                                href={route('register')}
                                className='landing-cta-primary landing-cta-depth inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white shadow-lg focus:outline-none'
                                style={{
                                    backgroundColor: primaryColor,
                                    boxShadow: primaryShadow,
                                }}
                                aria-label={t('landing.hero.primaryButton')}
                            >
                                {t('landing.hero.primaryButton')}
                                <ArrowRight className='h-5 w-5' aria-hidden />
                            </Link>
                            <Link
                                href={route('login')}
                                className='landing-cta-secondary landing-cta-depth landing-cta-depth-outline inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white/90 px-8 py-4 text-base font-semibold backdrop-blur-sm hover:bg-white dark:border-white/20 dark:bg-white/5 dark:hover:bg-white/10'
                                style={{ color: primaryColor, borderColor: `${primaryColor}40` }}
                                aria-label={t('landing.hero.secondaryButton')}
                            >
                                <LogIn className='h-5 w-5' aria-hidden />
                                {t('landing.hero.secondaryButton')}
                            </Link>
                        </motion.div>

                        <motion.dl
                            variants={landingFadeUp}
                            custom={reduce}
                            className='mt-14 grid grid-cols-1 gap-6 border-t border-slate-200/80 pt-10 sm:grid-cols-3 dark:border-white/10'
                        >
                            {stats.map((s) => (
                                <div key={s.label} className='text-center sm:text-left'>
                                    <dt className='text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400'>
                                        {s.label}
                                    </dt>
                                    <dd className='mt-1 text-3xl font-bold tabular-nums tracking-tight' style={{ color: s.color }}>
                                        {s.value}
                                    </dd>
                                </div>
                            ))}
                        </motion.dl>
                    </motion.div>

                    <motion.div
                        className='relative mx-auto w-full max-w-lg lg:max-w-none lg:justify-self-end'
                        initial={reduce ? false : { opacity: 0, x: 16 }}
                        animate={reduce ? undefined : { opacity: 1, x: 0 }}
                        transition={landingTransition(reduce, 0.2)}
                    >
                        <div
                            className='pointer-events-none absolute -inset-8 -z-10 rounded-[2rem] opacity-90 blur-3xl'
                            style={{
                                background: `radial-gradient(ellipse at 50% 40%, color-mix(in srgb, ${primaryColor} 35%, transparent), transparent 65%)`,
                            }}
                            aria-hidden
                        />

                        <div className='landing-mockup-frame relative'>
                            {!reduce && (
                                <motion.div
                                    className='pointer-events-none absolute -right-4 -top-10 z-10 w-28 drop-shadow-xl sm:w-32 md:-right-2 md:-top-14 md:w-36'
                                    aria-hidden
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={landingTransition(reduce, 0.32)}
                                >
                                    <img
                                        src={heroLogoSrc}
                                        alt=''
                                        className='h-auto w-full select-none opacity-[0.97]'
                                    />
                                </motion.div>
                            )}
                            {reduce && (
                                <div
                                    className='pointer-events-none absolute -right-2 -top-8 z-10 w-24 opacity-95 sm:w-28'
                                    aria-hidden
                                >
                                    <img src={heroLogoSrc} alt='' className='h-auto w-full select-none' />
                                </div>
                            )}
                            <div className='relative space-y-4'>
                                {/* Back stack card — depth without emoji */}
                                <div
                                    className='landing-mock-stack-back ml-4 mr-2 rounded-xl border border-slate-200/70 bg-slate-50/90 p-4 shadow-sm dark:border-white/10 dark:bg-zinc-800/80'
                                    style={{ boxShadow: `0 20px 50px -28px color-mix(in srgb, ${primaryColor} 20%, transparent)` }}
                                >
                                    <div className='flex items-center justify-between gap-2'>
                                        <p className='text-xs font-semibold text-slate-700 dark:text-zinc-200'>
                                            {t('landing.hero.mockStack.backTitle')}
                                        </p>
                                        <span className='text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-500'>
                                            {t('landing.hero.mockStack.backMeta')}
                                        </span>
                                    </div>
                                    <div className='mt-3 flex gap-2'>
                                        {[0.85, 0.55, 0.7].map((w, i) => (
                                            <div
                                                key={i}
                                                className='h-2 rounded-full bg-slate-200/90 dark:bg-white/10'
                                                style={{ width: `${w * 100}%`, maxWidth: '45%' }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div
                                    className='landing-mock-stack-front rounded-2xl border border-slate-200/90 bg-white shadow-[0_32px_120px_-40px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-zinc-900'
                                    style={{ boxShadow: mockShadow }}
                                >
                                    <div className='flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-white/10'>
                                        <div className='flex gap-1.5'>
                                            <span
                                                className='h-3 w-3 rounded-full'
                                                style={{ backgroundColor: `${primaryColor}cc` }}
                                            />
                                            <span
                                                className='h-3 w-3 rounded-full'
                                                style={{ backgroundColor: `${accentColor}cc` }}
                                            />
                                            <span
                                                className='h-3 w-3 rounded-full opacity-90'
                                                style={{ backgroundColor: `${secondaryColor}cc` }}
                                            />
                                        </div>
                                        <div className='mx-3 h-7 flex-1 rounded-lg bg-slate-50 ring-1 ring-slate-100 dark:bg-white/5 dark:ring-white/10' />
                                    </div>

                                    <div className='flex flex-col gap-8 p-6 md:flex-row md:items-stretch md:gap-6 md:p-8 lg:p-10'>
                                        <nav
                                            className='flex flex-row gap-2 md:w-36 md:flex-col md:gap-3'
                                            aria-label={t('landing.hero.kicker')}
                                        >
                                            {rail.map(({ label, Icon }) => (
                                                <div
                                                    key={label}
                                                    className='flex min-h-[2.75rem] flex-1 items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 md:flex-none'
                                                >
                                                    <Icon className='h-4 w-4 shrink-0' style={{ color: primaryColor }} aria-hidden />
                                                    <span className='truncate'>{label}</span>
                                                </div>
                                            ))}
                                        </nav>

                                        <div className='min-w-0 flex-1 space-y-6'>
                                            <div className='flex justify-center md:justify-start'>
                                                <div
                                                    className='relative flex h-24 w-24 items-center justify-center rounded-2xl shadow-inner ring-1 ring-white/30 dark:ring-white/10'
                                                    style={{
                                                        background: `linear-gradient(145deg, ${primaryColor}, ${accentColor})`,
                                                    }}
                                                    aria-hidden
                                                >
                                                    <Store className='h-11 w-11 text-white' strokeWidth={1.75} />
                                                </div>
                                            </div>

                                            <div className='text-center md:text-left'>
                                                <div className='flex flex-wrap items-center justify-center gap-2 md:justify-start'>
                                                    <p className='text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500'>
                                                        {t('landing.hero.mockStack.frontMeta')}
                                                    </p>
                                                </div>
                                                <h3 className='mt-2 text-xl font-bold text-slate-900 dark:text-white md:text-2xl'>
                                                    {t('landing.hero.mockStack.frontTitle')}
                                                </h3>
                                                <p className='mt-1 text-sm text-slate-600 dark:text-zinc-400'>{t('landing.hero.sampleStore')}</p>
                                                <p className='mt-0.5 text-xs text-slate-500 dark:text-zinc-500'>{t('landing.hero.premiumTheme')}</p>
                                            </div>

                                            <div className='flex justify-center gap-3 md:justify-start'>
                                                {[
                                                    { Icon: ShoppingCart, label: 'checkout' },
                                                    { Icon: Palette, label: 'theme' },
                                                    { Icon: Smartphone, label: 'mobile' },
                                                ].map(({ Icon, label }) => (
                                                    <div
                                                        key={label}
                                                        className='flex h-11 w-11 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300'
                                                        aria-hidden
                                                    >
                                                        <Icon className='h-5 w-5' style={{ color: primaryColor }} />
                                                    </div>
                                                ))}
                                            </div>

                                            <div className='rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-5 dark:border-white/10 dark:from-white/5 dark:to-transparent'>
                                                <div className='mx-auto flex h-24 w-full max-w-[11rem] items-center justify-center rounded-xl border border-slate-100 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950 md:mx-0'>
                                                    <div
                                                        className='flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-lg text-xs font-bold text-white'
                                                        style={{ backgroundColor: primaryColor }}
                                                    >
                                                        {t('landing.hero.store')}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
