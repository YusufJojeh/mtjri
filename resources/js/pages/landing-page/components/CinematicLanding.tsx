import React from 'react';
import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import {
    ArrowRight,
    Film,
    Globe2,
    Layers3,
    PlayCircle,
    Sparkles,
    Store,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
    LANDING_VIEWPORT,
    landingContainer,
    landingFadeUp,
    landingRevealTransition,
} from '../lib/landing-motion';
import { sanitizeLandingHex } from '../lib/landing-brand';
import MarketingRemotionPlayer from './MarketingRemotionPlayer';

interface CinematicLandingProps {
    settings: any;
    brandColor: string;
}

export default function CinematicLanding({ settings, brandColor }: CinematicLandingProps) {
    const { t } = useTranslation();
    const reduce = useReducedMotion() ?? false;

    const colors = settings?.config_sections?.colors || {
        primary: brandColor,
        secondary: '#1578D8',
        accent: '#FFC107',
    };

    const primaryColor = sanitizeLandingHex(colors.primary, brandColor);
    const secondaryColor = sanitizeLandingHex(colors.secondary, '#1578D8');
    const accentColor = sanitizeLandingHex(colors.accent, '#FFC107');

    const storyCards = [
        {
            icon: Store,
            title: t('landing.cinematic.story.items.workspace.title'),
            body: t('landing.cinematic.story.items.workspace.body'),
        },
        {
            icon: Layers3,
            title: t('landing.cinematic.story.items.motion.title'),
            body: t('landing.cinematic.story.items.motion.body'),
        },
        {
            icon: Globe2,
            title: t('landing.cinematic.story.items.localization.title'),
            body: t('landing.cinematic.story.items.localization.body'),
        },
    ];

    const mediaCards = [
        {
            key: 'dashboard',
            image: '/remotion/assets/landing-page/multi-store-dashboard.png',
            label: t('landing.cinematic.media.cards.dashboard.label'),
            title: t('landing.cinematic.media.cards.dashboard.title'),
            span: 'lg:col-span-7',
        },
        {
            key: 'themes',
            image: '/remotion/assets/landing-page/theme-selection.png',
            label: t('landing.cinematic.media.cards.themes.label'),
            title: t('landing.cinematic.media.cards.themes.title'),
            span: 'lg:col-span-5',
        },
        {
            key: 'orders',
            image: '/remotion/assets/landing-page/order-management.png',
            label: t('landing.cinematic.media.cards.orders.label'),
            title: t('landing.cinematic.media.cards.orders.title'),
            span: 'lg:col-span-4',
        },
        {
            key: 'payments',
            image: '/remotion/assets/landing-page/payment-integration.png',
            label: t('landing.cinematic.media.cards.payments.label'),
            title: t('landing.cinematic.media.cards.payments.title'),
            span: 'lg:col-span-4',
        },
        {
            key: 'products',
            image: '/remotion/assets/landing-page/product-management.png',
            label: t('landing.cinematic.media.cards.products.label'),
            title: t('landing.cinematic.media.cards.products.title'),
            span: 'lg:col-span-4',
        },
    ];

    const themes = [
        {
            key: 'one',
            image: '/remotion/assets/themes/home-accessories.png',
            title: t('landing.cinematic.templates.items.one'),
        },
        {
            key: 'two',
            image: '/remotion/assets/themes/fashion.png',
            title: t('landing.cinematic.templates.items.two'),
        },
        {
            key: 'three',
            image: '/remotion/assets/themes/electronics.png',
            title: t('landing.cinematic.templates.items.three'),
        },
        {
            key: 'four',
            image: '/remotion/assets/themes/beauty-cosmetics.png',
            title: t('landing.cinematic.templates.items.four'),
        },
        {
            key: 'five',
            image: '/remotion/assets/themes/jewelry.png',
            title: t('landing.cinematic.templates.items.five'),
        },
        {
            key: 'six',
            image: '/remotion/assets/themes/watches.png',
            title: t('landing.cinematic.templates.items.six'),
        },
    ];

    const proofItems = [
        t('landing.cinematic.proof.items.one'),
        t('landing.cinematic.proof.items.two'),
        t('landing.cinematic.proof.items.three'),
    ];

    return (
        <>
            <section
                id="hero"
                className="relative isolate overflow-hidden px-4 pt-28 pb-18 sm:px-6 lg:px-8 lg:pt-[8.75rem] lg:pb-24"
            >
                <div
                    className="pointer-events-none absolute inset-0 -z-20"
                    style={{
                        background: `radial-gradient(circle at 16% 12%, ${primaryColor}30, transparent 30%), radial-gradient(circle at 82% 14%, ${accentColor}18, transparent 24%), linear-gradient(180deg, #081223 0%, #0b1630 38%, #0c1931 100%)`,
                    }}
                    aria-hidden
                />
                <div
                    className="pointer-events-none absolute inset-0 -z-10 opacity-70"
                    style={{
                        background:
                            'linear-gradient(180deg, rgba(7,17,31,0.14) 0%, rgba(7,17,31,0.68) 46%, rgba(7,17,31,0.96) 100%)',
                    }}
                    aria-hidden
                />

                <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={landingContainer}
                        custom={reduce}
                        className="relative z-10 max-w-2xl"
                    >
                        <motion.span
                            variants={landingFadeUp}
                            custom={reduce}
                            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/76 backdrop-blur-md"
                        >
                            <span
                                className="inline-flex h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: accentColor }}
                                aria-hidden
                            />
                            {t('landing.cinematic.hero.eyebrow')}
                        </motion.span>

                        <motion.h1
                            variants={landingFadeUp}
                            custom={reduce}
                            className="mt-7 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl lg:text-[4.5rem] lg:leading-[0.94]"
                        >
                            {t('landing.cinematic.hero.title')}
                        </motion.h1>

                        <motion.p
                            variants={landingFadeUp}
                            custom={reduce}
                            className="mt-6 max-w-xl text-lg leading-relaxed text-white/72 sm:text-xl"
                        >
                            {t('landing.cinematic.hero.subtitle')}
                        </motion.p>

                        <motion.div
                            variants={landingFadeUp}
                            custom={reduce}
                            className="mt-9 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center"
                        >
                            <Link
                                href={route('register.stepper.index')}
                                className="landing-cta-depth inline-flex items-center justify-center gap-2 rounded-2xl border px-7 py-4 text-base font-semibold text-white shadow-[0_24px_54px_-28px_var(--primary-color)] transition hover:brightness-110"
                                style={{
                                    backgroundColor: primaryColor,
                                    borderColor: primaryColor,
                                }}
                            >
                                {t('landing.cinematic.hero.primaryCta')}
                                <ArrowRight className="h-5 w-5" aria-hidden />
                            </Link>
                            <a
                                href="#motion-story"
                                className="landing-cta-depth inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-7 py-4 text-base font-semibold text-white transition hover:bg-white/[0.1]"
                            >
                                <PlayCircle className="h-5 w-5" aria-hidden />
                                {t('landing.cinematic.hero.secondaryCta')}
                            </a>
                        </motion.div>

                        <motion.div
                            variants={landingFadeUp}
                            custom={reduce}
                            className="mt-10 grid gap-3 sm:grid-cols-3"
                        >
                            {proofItems.map((item) => (
                                <div
                                    key={item}
                                    className="landing-card-depth rounded-[1.4rem] border border-white/10 bg-white/[0.06] px-4 py-4 text-sm leading-relaxed text-white/76 backdrop-blur-md"
                                >
                                    {item}
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>

                    <motion.div
                        initial={reduce ? false : { opacity: 0, y: 18 }}
                        animate={reduce ? undefined : { opacity: 1, y: 0 }}
                        transition={landingRevealTransition(reduce, 1)}
                        className="relative"
                    >
                        <div
                            className="pointer-events-none absolute inset-x-[12%] top-6 -z-10 h-48 rounded-full blur-3xl"
                            style={{
                                background: `radial-gradient(circle, ${secondaryColor}44, transparent 72%)`,
                            }}
                            aria-hidden
                        />

                        <div className="landing-card-depth overflow-hidden rounded-[2.25rem] border border-white/12 bg-[#050b16] shadow-[0_46px_120px_-54px_rgba(0,0,0,0.82)]">
                            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-5 py-4">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/42">
                                        {t('landing.cinematic.hero.frameLabel')}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-white/88">
                                        {t('landing.cinematic.hero.frameTitle')}
                                    </p>
                                </div>
                                <span
                                    className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-950"
                                    style={{ backgroundColor: accentColor }}
                                >
                                    {t('landing.cinematic.hero.frameBadge')}
                                </span>
                            </div>

                            <div className="aspect-[16/10] w-full">
                                <MarketingRemotionPlayer variant="landing" />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            <section id="platform" className="relative overflow-hidden px-4 py-18 sm:px-6 lg:px-8 lg:py-24">
                <div className="mx-auto max-w-7xl">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={LANDING_VIEWPORT}
                        variants={landingContainer}
                        custom={reduce}
                        className="mx-auto max-w-3xl text-center"
                    >
                        <motion.span
                            variants={landingFadeUp}
                            custom={reduce}
                            className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70"
                        >
                            {t('landing.cinematic.story.badge')}
                        </motion.span>
                        <motion.h2
                            variants={landingFadeUp}
                            custom={reduce}
                            className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl"
                        >
                            {t('landing.cinematic.story.title')}
                        </motion.h2>
                        <motion.p
                            variants={landingFadeUp}
                            custom={reduce}
                            className="mt-5 text-lg leading-relaxed text-white/68"
                        >
                            {t('landing.cinematic.story.subtitle')}
                        </motion.p>
                    </motion.div>

                    <div className="mt-12 grid gap-5 lg:grid-cols-3">
                        {storyCards.map((card, index) => {
                            const Icon = card.icon;

                            return (
                                <motion.article
                                    key={card.title}
                                    initial={reduce ? false : { opacity: 0, y: 18 }}
                                    whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                                    viewport={LANDING_VIEWPORT}
                                    transition={landingRevealTransition(reduce, index)}
                                    className="landing-card-depth rounded-[1.9rem] border border-white/10 bg-white/[0.05] p-6 shadow-[0_28px_80px_-38px_rgba(0,0,0,0.65)] backdrop-blur-sm"
                                >
                                    <div
                                        className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]"
                                        style={{ color: primaryColor }}
                                    >
                                        <Icon className="h-7 w-7" aria-hidden />
                                    </div>
                                    <h3 className="mt-6 text-2xl font-semibold tracking-tight text-white">
                                        {card.title}
                                    </h3>
                                    <p className="mt-4 text-sm leading-relaxed text-white/68 sm:text-base">
                                        {card.body}
                                    </p>
                                </motion.article>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section id="motion-story" className="relative overflow-hidden px-4 py-18 sm:px-6 lg:px-8 lg:py-24">
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background: `linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.02) 18%, rgba(255,255,255,0) 100%), radial-gradient(circle at 82% 16%, ${accentColor}12, transparent 24%)`,
                    }}
                    aria-hidden
                />

                <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:items-start">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={LANDING_VIEWPORT}
                        variants={landingContainer}
                        custom={reduce}
                        className="lg:sticky lg:top-28"
                    >
                        <motion.span
                            variants={landingFadeUp}
                            custom={reduce}
                            className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70"
                        >
                            {t('landing.cinematic.motion.badge')}
                        </motion.span>
                        <motion.h2
                            variants={landingFadeUp}
                            custom={reduce}
                            className="mt-5 max-w-xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl"
                        >
                            {t('landing.cinematic.motion.title')}
                        </motion.h2>
                        <motion.p
                            variants={landingFadeUp}
                            custom={reduce}
                            className="mt-5 max-w-xl text-lg leading-relaxed text-white/68"
                        >
                            {t('landing.cinematic.motion.subtitle')}
                        </motion.p>
                    </motion.div>

                    <motion.div
                        initial={reduce ? false : { opacity: 0, y: 18 }}
                        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                        viewport={LANDING_VIEWPORT}
                        transition={landingRevealTransition(reduce, 1)}
                        className="landing-card-depth overflow-hidden rounded-[2rem] border border-white/10 bg-[#050b16] p-3 shadow-[0_34px_96px_-44px_rgba(0,0,0,0.74)]"
                    >
                        <div className="flex items-center justify-between rounded-[1.3rem] border border-white/10 bg-white/[0.04] px-4 py-3">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/42">
                                    {t('landing.cinematic.motion.playerLabel')}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-white/88">
                                    {t('landing.cinematic.motion.playerTitle')}
                                </p>
                            </div>
                            <span
                                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-950"
                                style={{ backgroundColor: accentColor }}
                            >
                                <Film className="h-3.5 w-3.5" aria-hidden />
                                {t('landing.cinematic.motion.playerBadge')}
                            </span>
                        </div>

                        <div className="mt-3 aspect-video overflow-hidden rounded-[1.45rem] border border-white/10 bg-black">
                            <MarketingRemotionPlayer variant="hero" />
                        </div>
                    </motion.div>
                </div>
            </section>

            <section id="proof" className="relative overflow-hidden px-4 py-18 sm:px-6 lg:px-8 lg:py-24">
                <div className="mx-auto max-w-7xl">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={LANDING_VIEWPORT}
                        variants={landingContainer}
                        custom={reduce}
                        className="mx-auto max-w-3xl text-center"
                    >
                        <motion.span
                            variants={landingFadeUp}
                            custom={reduce}
                            className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70"
                        >
                            {t('landing.cinematic.media.badge')}
                        </motion.span>
                        <motion.h2
                            variants={landingFadeUp}
                            custom={reduce}
                            className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl"
                        >
                            {t('landing.cinematic.media.title')}
                        </motion.h2>
                        <motion.p
                            variants={landingFadeUp}
                            custom={reduce}
                            className="mt-5 text-lg leading-relaxed text-white/68"
                        >
                            {t('landing.cinematic.media.subtitle')}
                        </motion.p>
                    </motion.div>

                    <div className="mt-12 grid gap-5 lg:grid-cols-12">
                        {mediaCards.map((card, index) => (
                            <motion.article
                                key={card.key}
                                initial={reduce ? false : { opacity: 0, y: 18 }}
                                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                                viewport={LANDING_VIEWPORT}
                                transition={landingRevealTransition(reduce, index)}
                                className={`landing-card-depth overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.05] shadow-[0_28px_80px_-38px_rgba(0,0,0,0.6)] backdrop-blur-sm ${card.span}`}
                            >
                                <div className="aspect-[16/10] overflow-hidden border-b border-white/10 bg-slate-950">
                                    <img
                                        src={card.image}
                                        alt={card.title}
                                        className="h-full w-full object-cover object-top"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </div>
                                <div className="p-5">
                                    <span
                                        className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-950"
                                        style={{ backgroundColor: accentColor }}
                                    >
                                        {card.label}
                                    </span>
                                    <p className="mt-4 text-lg font-semibold leading-relaxed text-white">
                                        {card.title}
                                    </p>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </section>

            <section id="themes" className="relative overflow-hidden px-4 py-18 sm:px-6 lg:px-8 lg:py-24">
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background: `radial-gradient(circle at 18% 14%, ${primaryColor}14, transparent 28%), linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.03) 26%, rgba(255,255,255,0) 100%)`,
                    }}
                    aria-hidden
                />

                <div className="mx-auto max-w-7xl">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={LANDING_VIEWPORT}
                        variants={landingContainer}
                        custom={reduce}
                        className="mx-auto max-w-3xl text-center"
                    >
                        <motion.span
                            variants={landingFadeUp}
                            custom={reduce}
                            className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70"
                        >
                            {t('landing.cinematic.templates.badge')}
                        </motion.span>
                        <motion.h2
                            variants={landingFadeUp}
                            custom={reduce}
                            className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl"
                        >
                            {t('landing.cinematic.templates.title')}
                        </motion.h2>
                        <motion.p
                            variants={landingFadeUp}
                            custom={reduce}
                            className="mt-5 text-lg leading-relaxed text-white/68"
                        >
                            {t('landing.cinematic.templates.subtitle')}
                        </motion.p>
                    </motion.div>

                    <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {themes.map((theme, index) => (
                            <motion.article
                                key={theme.key}
                                initial={reduce ? false : { opacity: 0, y: 18 }}
                                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                                viewport={LANDING_VIEWPORT}
                                transition={landingRevealTransition(reduce, index)}
                                className="landing-card-depth overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.05] shadow-[0_28px_80px_-38px_rgba(0,0,0,0.6)] backdrop-blur-sm"
                            >
                                <div className="theme-preview-container aspect-[16/11] overflow-hidden border-b border-white/10 bg-slate-950">
                                    <img
                                        src={theme.image}
                                        alt={theme.title}
                                        className="theme-preview-image h-full w-full object-cover object-top"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </div>
                                <div className="p-5">
                                    <span
                                        className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70"
                                    >
                                        {t('landing.cinematic.templates.cardBadge')}
                                    </span>
                                    <p className="mt-4 text-lg font-semibold text-white">{theme.title}</p>
                                </div>
                            </motion.article>
                        ))}
                    </div>

                    <div className="mt-10 text-center">
                        <Link
                            href={route('register.stepper.index')}
                            className="landing-cta-depth inline-flex items-center justify-center gap-2 rounded-2xl border px-7 py-4 text-base font-semibold text-white transition hover:brightness-110"
                            style={{
                                backgroundColor: primaryColor,
                                borderColor: primaryColor,
                            }}
                        >
                            {t('landing.cinematic.templates.cta')}
                            <ArrowRight className="h-5 w-5" aria-hidden />
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
