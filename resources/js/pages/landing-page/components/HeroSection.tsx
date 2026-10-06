import React from 'react';
import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import {
    ArrowRight,
    ChartNoAxesCombined,
    CreditCard,
    Film,
    Globe,
    LayoutGrid,
    ShieldCheck,
    Store,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useBrand } from '@/contexts/BrandContext';
import { getMarketingLogoDisplayUrl, PUBLIC_BRAND_ACCENT, PUBLIC_BRAND_PRIMARY, PUBLIC_BRAND_SECONDARY } from '@/lib/public-brand';

import { landingFadeUp, landingHeroContainer, landingTransition } from '../lib/landing-motion';
import { sanitizeLandingHex } from '../lib/landing-brand';
import MarketingRemotionPlayer from './MarketingRemotionPlayer';

interface HeroSectionProps {
    brandColor?: string;
    settings: any;
}

const heroFacts = [
    {
        value: '10',
        label: 'landing.v2.hero.facts.themes.label',
        defaultLabel: 'ready-made storefront themes',
        icon: LayoutGrid,
    },
    {
        value: '30+',
        label: 'landing.v2.hero.facts.payments.label',
        defaultLabel: 'payment gateway flows in the product',
        icon: CreditCard,
    },
    {
        value: '1',
        label: 'landing.v2.hero.facts.workspace.label',
        defaultLabel: 'workspace for stores, orders, content, and analytics',
        icon: ChartNoAxesCombined,
    },
];

const proofItems = [
    {
        icon: Store,
        label: 'landing.v2.hero.proof.multiStore',
        defaultLabel: 'Company accounts, staff, and multiple storefronts from one workspace',
    },
    {
        icon: Globe,
        label: 'landing.v2.hero.proof.domains',
        defaultLabel: 'Custom domains, subdomains, and multilingual public pages',
    },
    {
        icon: ShieldCheck,
        label: 'landing.v2.hero.proof.checkout',
        defaultLabel: 'Checkout, shipping, taxes, reviews, and growth tooling already wired in',
    },
];

export default function HeroSection({ settings, brandColor = PUBLIC_BRAND_PRIMARY }: HeroSectionProps) {
    const { t } = useTranslation();
    const reduce = useReducedMotion() ?? false;
    const { logoLight, logoDark } = useBrand();

    const colors = settings?.config_sections?.colors || {
        primary: brandColor,
        secondary: PUBLIC_BRAND_SECONDARY,
        accent: PUBLIC_BRAND_ACCENT,
    };

    const primaryColor = sanitizeLandingHex(colors.primary, brandColor);
    const secondaryColor = sanitizeLandingHex(colors.secondary, PUBLIC_BRAND_SECONDARY);
    const accentColor = sanitizeLandingHex(colors.accent, PUBLIC_BRAND_ACCENT);

    const heroLogoSrc = getMarketingLogoDisplayUrl(logoLight, logoDark, false);
    const marqueeThemes = [
        t('landing.v2.hero.media.storeSurface.one', 'Catalog and inventory'),
        t('landing.v2.hero.media.storeSurface.two', 'Orders and customers'),
        t('landing.v2.hero.media.storeSurface.three', 'Blog, coupons, referrals, and themes'),
        t('landing.v2.hero.media.badge', 'Launch-ready'),
        t('landing.v2.hero.media.label', 'Commerce workspace'),
    ];

    return (
        <section id="hero" className="relative isolate overflow-hidden px-4 pt-32 pb-20 sm:px-6 lg:px-8 lg:pt-[9.75rem] lg:pb-28">
            <div className="landing-hero-mesh absolute inset-0 -z-20" />
            <div className="landing-hero-brand-glow" aria-hidden />
            <div className="landing-noise pointer-events-none absolute inset-0 -z-10" aria-hidden />
            <motion.div
                aria-hidden
                className="pointer-events-none absolute -top-16 left-[6%] h-56 w-56 rounded-full blur-3xl"
                style={{ backgroundColor: `${primaryColor}22` }}
                animate={reduce ? undefined : { x: [0, 24, 0], y: [0, 20, 0], scale: [1, 1.08, 1] }}
                transition={reduce ? undefined : { duration: 16, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                aria-hidden
                className="pointer-events-none absolute top-20 right-[8%] h-64 w-64 rounded-full blur-3xl"
                style={{ backgroundColor: `${accentColor}18` }}
                animate={reduce ? undefined : { x: [0, -28, 0], y: [0, 18, 0], scale: [1, 1.04, 1] }}
                transition={reduce ? undefined : { duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
            />

            <div className="mx-auto max-w-7xl">
                <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-12">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={landingHeroContainer}
                        custom={reduce}
                        className="max-w-2xl"
                    >
                        <motion.div variants={landingFadeUp} custom={reduce}>
                            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/86 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 shadow-sm backdrop-blur-md">
                                <span
                                    className="landing-live-dot inline-flex h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: accentColor }}
                                    aria-hidden
                                />
                                {t(
                                    'landing.v2.hero.eyebrow',
                                    'Built for founders, operators, and agencies running more than one storefront',
                                )}
                            </span>
                        </motion.div>

                        <motion.h1
                            variants={landingFadeUp}
                            custom={reduce}
                            className="mt-7 text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-[4.35rem] lg:leading-[0.98]"
                        >
                            {t(
                                'landing.v2.hero.title',
                                'Run multiple storefronts from one commerce control center',
                            )}
                        </motion.h1>

                        <motion.p
                            variants={landingFadeUp}
                            custom={reduce}
                            className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 sm:text-xl"
                        >
                            {t(
                                'landing.v2.hero.subtitle',
                                'MTJRii combines multi-store management, theme selection, product operations, payments, content surfaces, and reporting so teams can launch and scale without stitching tools together.',
                            )}
                        </motion.p>

                        <motion.div
                            variants={landingFadeUp}
                            custom={reduce}
                            className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center"
                        >
                            <Link
                                href={route('register.stepper.index')}
                                className="landing-cta-depth inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--primary-color)] bg-[var(--primary-color)] px-7 py-4 text-base font-semibold text-white shadow-[0_24px_48px_-26px_var(--primary-color)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)] focus-visible:ring-offset-2"
                            >
                                {t('landing.v2.hero.primaryCta', 'Start setup')}
                                <ArrowRight className="h-5 w-5" aria-hidden />
                            </Link>
                            <a
                                href="#pricing"
                                className="landing-cta-depth landing-cta-depth-outline inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/90 px-7 py-4 text-base font-semibold text-slate-900 shadow-sm backdrop-blur-sm transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)] focus-visible:ring-offset-2"
                            >
                                {t('landing.v2.hero.secondaryCta', 'See plans')}
                            </a>
                            <a
                                href="#remotion-showcase"
                                className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
                            >
                                <Film className="h-4 w-4" aria-hidden />
                                {t('landing.v2.hero.motionCta', 'Watch the product story')}
                            </a>
                            <Link
                                href={route('documentation.index')}
                                className="inline-flex items-center justify-center text-sm font-semibold text-slate-600 transition hover:text-slate-950"
                            >
                                {t('landing.v2.hero.tertiaryCta', 'Read the documentation')}
                            </Link>
                        </motion.div>

                        <motion.div
                            variants={landingFadeUp}
                            custom={reduce}
                            className="mt-10 grid gap-3 sm:grid-cols-3"
                        >
                            {heroFacts.map((fact, index) => {
                                const Icon = fact.icon;
                                return (
                                    <motion.div
                                        key={fact.label}
                                        className="landing-card-depth rounded-2xl border border-slate-200/80 bg-white/88 p-4 shadow-sm backdrop-blur-sm"
                                        initial={reduce ? false : { opacity: 0, y: 18 }}
                                        animate={
                                            reduce
                                                ? undefined
                                                : {
                                                      opacity: 1,
                                                      y: [0, index % 2 === 0 ? -6 : 6, 0],
                                                  }
                                        }
                                        transition={
                                            reduce
                                                ? undefined
                                                : {
                                                      opacity: { duration: 0.5, delay: 0.32 + index * 0.08 },
                                                      y: {
                                                          duration: 5 + index,
                                                          repeat: Infinity,
                                                          ease: 'easeInOut',
                                                          delay: index * 0.2,
                                                      },
                                                  }
                                        }
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-3xl font-semibold tracking-tight text-slate-950">{fact.value}</p>
                                                <p className="mt-1 text-sm leading-snug text-slate-600">
                                                    {t(fact.label, fact.defaultLabel)}
                                                </p>
                                            </div>
                                            <div
                                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50"
                                                style={{ color: primaryColor }}
                                            >
                                                <Icon className="h-5 w-5" aria-hidden />
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>

                        <motion.ul
                            variants={landingFadeUp}
                            custom={reduce}
                            className="mt-8 space-y-3"
                        >
                            {proofItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <li key={item.label} className="flex items-start gap-3 text-sm leading-relaxed text-slate-600">
                                        <span
                                            className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm"
                                            style={{ color: primaryColor }}
                                        >
                                            <Icon className="h-4 w-4" aria-hidden />
                                        </span>
                                        <span>{t(item.label, item.defaultLabel)}</span>
                                    </li>
                                );
                            })}
                        </motion.ul>
                    </motion.div>

                    <motion.div
                        className="relative mx-auto w-full max-w-2xl lg:max-w-none"
                        initial={reduce ? false : { opacity: 0, x: 18 }}
                        animate={reduce ? undefined : { opacity: 1, x: 0 }}
                        transition={landingTransition(reduce, 0.18)}
                    >
                        <div
                            className="pointer-events-none absolute inset-x-[12%] top-6 -z-10 h-40 rounded-full blur-3xl"
                            style={{
                                background: `radial-gradient(circle, color-mix(in srgb, ${primaryColor} 26%, transparent), transparent 72%)`,
                            }}
                            aria-hidden
                        />

                        <div className="landing-mockup-frame relative">
                            <div className="landing-mock-stack-back absolute inset-x-5 top-10 hidden rounded-[2rem] border border-white/35 bg-white/45 shadow-xl lg:block" />
                            <motion.div
                                aria-hidden
                                className="absolute -top-6 right-6 z-20 hidden rounded-2xl border border-white/60 bg-white/92 px-4 py-3 shadow-[0_20px_55px_-30px_rgba(15,23,42,0.38)] backdrop-blur-xl md:flex md:items-center md:gap-3"
                                initial={reduce ? false : { opacity: 0, y: 20, rotate: -4 }}
                                animate={
                                    reduce
                                        ? undefined
                                        : {
                                              opacity: 1,
                                              y: [0, -10, 0],
                                              rotate: [-4, -2, -4],
                                          }
                                }
                                transition={
                                    reduce
                                        ? undefined
                                        : {
                                              opacity: { duration: 0.5, delay: 0.55 },
                                              y: { duration: 5.5, repeat: Infinity, ease: 'easeInOut' },
                                              rotate: { duration: 5.5, repeat: Infinity, ease: 'easeInOut' },
                                          }
                                }
                            >
                                <div
                                    className="flex h-10 w-10 items-center justify-center rounded-2xl"
                                    style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
                                >
                                    <Film className="h-5 w-5" aria-hidden />
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                        {t('landing.v2.hero.motionBadge', 'Full-motion hero')}
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {t('landing.v2.hero.motionBadgeBody', 'Remotion now leads the first impression')}
                                    </p>
                                </div>
                            </motion.div>

                            <div className="landing-mock-stack-front relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/86 p-4 shadow-[0_36px_90px_-44px_rgba(15,23,42,0.42)] backdrop-blur-xl sm:p-5">
                                <div className="flex items-center justify-between rounded-[1.4rem] border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                                            <img src={heroLogoSrc} alt="" className="h-6 w-auto max-w-[88px] object-contain" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                                {t('landing.v2.hero.media.label', 'Commerce workspace')}
                                            </p>
                                            <p className="text-sm font-semibold text-slate-900">
                                                {t('landing.v2.hero.media.title', 'Stores, themes, payments, and analytics in one place')}
                                            </p>
                                        </div>
                                    </div>
                                    <div
                                        className="hidden rounded-full px-3 py-1 text-xs font-semibold sm:block"
                                        style={{
                                            backgroundColor: `${accentColor}1f`,
                                            color: secondaryColor,
                                        }}
                                    >
                                        {t('landing.v2.hero.media.badge', 'Launch-ready')}
                                    </div>
                                </div>

                                <div className="relative mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem]">
                                    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-950 shadow-sm">
                                        <MarketingRemotionPlayer variant="hero" showControls={reduce} />
                                    </div>

                                    <div className="grid gap-4">
                                        <motion.div
                                            className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm"
                                            animate={reduce ? undefined : { y: [0, -8, 0] }}
                                            transition={reduce ? undefined : { duration: 6.2, repeat: Infinity, ease: 'easeInOut' }}
                                        >
                                            <div className="flex h-full min-h-28 items-end bg-[linear-gradient(160deg,#0f172a_0%,#1578D8_45%,#1E90FF_100%)] p-4 text-white">
                                                <div>
                                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">
                                                        {t('landing.v2.hero.media.themesAlt', 'Theme selection preview')}
                                                    </p>
                                                    <p className="mt-2 text-base font-semibold">
                                                        {t('landing.v2.hero.motionCard.title', 'Remotion composition is driving the hero system')}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                        <motion.div
                                            className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-4 text-white shadow-sm"
                                            animate={reduce ? undefined : { y: [0, 8, 0] }}
                                            transition={reduce ? undefined : { duration: 5.6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                                        >
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
                                                {t('landing.v2.hero.media.stackLabel', 'Motion proof')}
                                            </p>
                                            <p className="mt-2 text-lg font-semibold">
                                                {t('landing.v2.hero.media.stackTitle', 'The hero now runs the real MTJRii Remotion composition')}
                                            </p>
                                            <p className="mt-2 text-sm leading-relaxed text-white/72">
                                                {t(
                                                    'landing.v2.hero.media.stackBody',
                                                    'The theme library, product surface, checkout flows, and store analytics all live inside the same product architecture and now appear in motion on the landing page.',
                                                )}
                                            </p>
                                        </motion.div>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_15rem]">
                                    <motion.div
                                        className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-sm"
                                        animate={reduce ? undefined : { y: [0, -6, 0] }}
                                        transition={reduce ? undefined : { duration: 6.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                                    {t('landing.v2.hero.media.paymentsLabel', 'Checkout coverage')}
                                                </p>
                                                <p className="mt-2 text-base font-semibold text-slate-950">
                                                    {t('landing.v2.hero.media.paymentsTitle', 'Payment setup is part of the product, not an afterthought')}
                                                </p>
                                            </div>
                                            <span
                                                className="rounded-full px-3 py-1 text-xs font-semibold"
                                                style={{
                                                    backgroundColor: `${primaryColor}12`,
                                                    color: primaryColor,
                                                }}
                                            >
                                                30+
                                            </span>
                                        </div>
                                        <div className="mt-4 grid h-32 grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                                            {['Checkout', 'Gateways', 'Orders'].map((item, index) => (
                                                <div
                                                    key={item}
                                                    className="rounded-lg border border-slate-200 bg-white"
                                                    style={{
                                                        transform: reduce ? undefined : `translateY(${index % 2 === 0 ? '-2px' : '3px'})`,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-sm"
                                        animate={reduce ? undefined : { y: [0, 7, 0] }}
                                        transition={reduce ? undefined : { duration: 5.9, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                                    >
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                            {t('landing.v2.hero.media.liveLabel', 'Store surfaces')}
                                        </p>
                                        <div className="mt-3 space-y-2">
                                            {[
                                                t('landing.v2.hero.media.storeSurface.one', 'Catalog and inventory'),
                                                t('landing.v2.hero.media.storeSurface.two', 'Orders and customers'),
                                                t('landing.v2.hero.media.storeSurface.three', 'Blog, coupons, referrals, and themes'),
                                            ].map((label) => (
                                                <div
                                                    key={label}
                                                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                                                >
                                                    <span
                                                        className="h-2.5 w-2.5 rounded-full"
                                                        style={{ backgroundColor: primaryColor }}
                                                        aria-hidden
                                                    />
                                                    {label}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                </div>

                                <div className="mt-4 overflow-hidden rounded-[1.3rem] border border-slate-200/80 bg-white/90 px-3 py-3">
                                    <motion.div
                                        className="flex w-max gap-3"
                                        animate={reduce ? undefined : { x: ['0%', '-50%'] }}
                                        transition={reduce ? undefined : { duration: 18, repeat: Infinity, ease: 'linear' }}
                                    >
                                        {[...marqueeThemes, ...marqueeThemes].map((item, index) => (
                                            <span
                                                key={`${item}-${index}`}
                                                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700"
                                            >
                                                {item}
                                            </span>
                                        ))}
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
