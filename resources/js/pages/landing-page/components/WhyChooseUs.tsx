import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BarChart3, FileText, Film, Package, ShieldCheck, Store, WalletCards } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

import { LANDING_VIEWPORT, landingContainer, landingFadeUp, landingRevealTransition } from '../lib/landing-motion';
import { sanitizeLandingHex } from '../lib/landing-brand';
import MarketingRemotionPlayer from './MarketingRemotionPlayer';

interface WhyChooseUsProps {
    brandColor?: string;
    settings: any;
}

export default function WhyChooseUs({ settings, brandColor = '#1E90FF' }: WhyChooseUsProps) {
    const { t } = useTranslation();
    const reduce = useReducedMotion() ?? false;

    const colors = settings?.config_sections?.colors || { primary: brandColor, secondary: '#1578D8', accent: '#FFC107' };
    const primaryColor = sanitizeLandingHex(colors.primary, brandColor);
    const accentColor = sanitizeLandingHex(colors.accent, '#FFC107');

    const pillars = [
        {
            icon: Store,
            title: t('landing.v2.proof.items.architecture.title', 'Multi-store architecture'),
            description: t(
                'landing.v2.proof.items.architecture.description',
                'The project is structured around company users, store records, themed storefront routes, staff access, and plan-aware feature gates.',
            ),
        },
        {
            icon: WalletCards,
            title: t('landing.v2.proof.items.commerce.title', 'Commerce operations, not just presentation'),
            description: t(
                'landing.v2.proof.items.commerce.description',
                'Products, carts, checkout, orders, customers, shipping, reviews, coupons, and payment controllers are part of the product surface.',
            ),
        },
        {
            icon: FileText,
            title: t('landing.v2.proof.items.growth.title', 'Growth tooling built into the stack'),
            description: t(
                'landing.v2.proof.items.growth.description',
                'Blog, custom pages, documentation, newsletter capture, referrals, express checkout, and SEO settings help stores keep operating after launch.',
            ),
        },
    ];

    const systemAreas = [
        { icon: Package, label: t('landing.v2.proof.areas.catalog', 'Catalog and inventory') },
        { icon: ShieldCheck, label: t('landing.v2.proof.areas.checkout', 'Checkout, taxes, shipping, and reviews') },
        { icon: BarChart3, label: t('landing.v2.proof.areas.analytics', 'Analytics, exports, POS, and QR store access') },
    ];

    return (
        <section id="product-proof" className="relative overflow-hidden py-20 sm:py-24 lg:py-28">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: `radial-gradient(circle at 16% 22%, ${primaryColor}12, transparent 28%), radial-gradient(circle at 86% 18%, ${accentColor}16, transparent 22%), linear-gradient(180deg, rgba(248,250,252,0.92), rgba(255,255,255,1))`,
                }}
                aria-hidden
            />
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
                    <div>
                        <motion.div
                            className="max-w-3xl"
                            initial="hidden"
                            whileInView="visible"
                            viewport={LANDING_VIEWPORT}
                            variants={landingContainer}
                            custom={reduce}
                        >
                            <motion.span
                                variants={landingFadeUp}
                                custom={reduce}
                                className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600"
                            >
                                {t('landing.v2.proof.badge', 'Operational fit')}
                            </motion.span>
                            <motion.h2
                                variants={landingFadeUp}
                                custom={reduce}
                                className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl lg:text-5xl"
                            >
                                {t('landing.v2.proof.title', 'Why this product can support a stronger landing page')}
                            </motion.h2>
                            <motion.p
                                variants={landingFadeUp}
                                custom={reduce}
                                className="mt-5 text-lg leading-relaxed text-slate-600"
                            >
                                {t(
                                    'landing.v2.proof.subtitle',
                                    'The codebase already supports real ecommerce operations. The redesign leans into that truth instead of padding the page with generic startup promises.',
                                )}
                            </motion.p>
                        </motion.div>

                        <div className="mt-12 grid gap-5 md:grid-cols-3">
                            {pillars.map((pillar, index) => {
                                const Icon = pillar.icon;

                                return (
                                    <motion.article
                                        key={pillar.title}
                                        initial={reduce ? false : { opacity: 0, y: 18 }}
                                        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                                        viewport={LANDING_VIEWPORT}
                                        transition={landingRevealTransition(reduce, index)}
                                        className="landing-card-depth rounded-[1.75rem] border border-slate-200/80 bg-white/92 p-6 shadow-sm"
                                    >
                                        <div
                                            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50"
                                            style={{ color: primaryColor }}
                                        >
                                            <Icon className="h-7 w-7" aria-hidden />
                                        </div>
                                        <h3 className="mt-6 text-xl font-semibold tracking-tight text-slate-950">
                                            {pillar.title}
                                        </h3>
                                        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                                            {pillar.description}
                                        </p>
                                    </motion.article>
                                );
                            })}
                        </div>

                        <motion.div
                            initial={reduce ? false : { opacity: 0, y: 18 }}
                            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                            viewport={LANDING_VIEWPORT}
                            transition={landingRevealTransition(reduce, 2)}
                            className="landing-card-depth mt-6 overflow-hidden rounded-[1.9rem] border border-slate-200/80 bg-slate-950 p-3 shadow-[0_30px_80px_-44px_rgba(15,23,42,0.6)]"
                        >
                            <div className="flex items-center justify-between rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-white">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
                                        {t('landing.v2.proof.motionLabel', 'Proof film')}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-white/86">
                                        {t('landing.v2.proof.motionTitle', 'Operational breadth is visible inside the live composition system')}
                                    </p>
                                </div>
                                <span
                                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                                    style={{ backgroundColor: `${accentColor}24`, color: accentColor }}
                                >
                                    <Film className="h-3.5 w-3.5" aria-hidden />
                                    Motion
                                </span>
                            </div>
                            <div className="mt-3 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black">
                                <div className="aspect-video w-full">
                                    <MarketingRemotionPlayer variant="landing" showControls={reduce} />
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <motion.aside
                        initial={reduce ? false : { opacity: 0, y: 18 }}
                        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                        viewport={LANDING_VIEWPORT}
                        transition={landingRevealTransition(reduce, 3)}
                        className="landing-card-depth sticky top-28 rounded-[1.9rem] border border-slate-200/80 bg-slate-950 p-7 text-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.7)]"
                    >
                        <span
                            className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                            style={{
                                backgroundColor: `${accentColor}22`,
                                color: accentColor,
                            }}
                        >
                            {t('landing.v2.proof.side.badge', 'What operators need')}
                        </span>
                        <h3 className="mt-5 text-2xl font-semibold tracking-tight text-white">
                            {t('landing.v2.proof.side.title', 'A single workspace should carry more than the storefront')}
                        </h3>
                        <p className="mt-4 text-sm leading-relaxed text-white/72 sm:text-base">
                            {t(
                                'landing.v2.proof.side.description',
                                'The strongest part of MTJRii is the breadth of its operating surface. The landing page now uses that breadth as proof instead of inventing fake authority signals.',
                            )}
                        </p>

                        <div className="mt-6 space-y-3">
                            {systemAreas.map((area) => {
                                const Icon = area.icon;
                                return (
                                    <div
                                        key={area.label}
                                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3"
                                    >
                                        <span
                                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]"
                                            style={{ color: primaryColor }}
                                        >
                                            <Icon className="h-5 w-5" aria-hidden />
                                        </span>
                                        <span className="text-sm font-medium text-white/86">{area.label}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <Link
                            href={route('documentation.index')}
                            className="landing-cta-depth mt-7 inline-flex w-full items-center justify-center rounded-2xl border border-[var(--primary-color)] bg-[var(--primary-color)] px-5 py-3.5 text-sm font-semibold text-white transition hover:brightness-110"
                        >
                            {t('landing.v2.proof.side.cta', 'Review platform documentation')}
                        </Link>
                    </motion.aside>
                </div>
            </div>
        </section>
    );
}
