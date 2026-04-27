import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
    BarChart3,
    CreditCard,
    Film,
    FileText,
    LayoutTemplate,
    PackageSearch,
    Sparkles,
    Store,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { LANDING_VIEWPORT, landingContainer, landingFadeUp, landingRevealTransition } from '../lib/landing-motion';
import { sanitizeLandingHex } from '../lib/landing-brand';
import MarketingRemotionPlayer from './MarketingRemotionPlayer';

interface FeaturesSectionProps {
    brandColor?: string;
    settings: any;
}

export default function FeaturesSection({ settings, brandColor = '#1E90FF' }: FeaturesSectionProps) {
    const { t } = useTranslation();
    const reduce = useReducedMotion() ?? false;

    const colors = settings?.config_sections?.colors || { primary: brandColor, secondary: '#1578D8', accent: '#FFC107' };
    const primaryColor = sanitizeLandingHex(colors.primary, brandColor);

    const features = React.useMemo(
        () => [
            {
                icon: Store,
                title: t('landing.v2.features.items.multiStore.title', 'Multi-store control'),
                description: t(
                    'landing.v2.features.items.multiStore.description',
                    'Create stores, manage staff access, and keep each storefront separated without leaving the same workspace.',
                ),
                accent: t('landing.v2.features.items.multiStore.accent', 'Company accounts and store switching are already built in'),
                featured: true,
            },
            {
                icon: LayoutTemplate,
                title: t('landing.v2.features.items.themes.title', 'Theme library by vertical'),
                description: t(
                    'landing.v2.features.items.themes.description',
                    'Fashion, electronics, beauty, watches, furniture, home accessories, and more are packaged as real storefront directions.',
                ),
                accent: t('landing.v2.features.items.themes.accent', '10 starter storefront themes'),
            },
            {
                icon: PackageSearch,
                title: t('landing.v2.features.items.operations.title', 'Catalog, orders, and fulfillment'),
                description: t(
                    'landing.v2.features.items.operations.description',
                    'Products, inventory, customers, reviews, shipping, taxes, coupons, and order workflows are part of the core product.',
                ),
                accent: t('landing.v2.features.items.operations.accent', 'Built for daily ecommerce operations'),
            },
            {
                icon: CreditCard,
                title: t('landing.v2.features.items.payments.title', 'Payments that match your market'),
                description: t(
                    'landing.v2.features.items.payments.description',
                    'The codebase already ships a wide payment surface including global gateways, regional methods, COD, and WhatsApp-assisted checkout flows.',
                ),
                accent: t('landing.v2.features.items.payments.accent', '30+ payment gateway controllers'),
            },
            {
                icon: FileText,
                title: t('landing.v2.features.items.growth.title', 'Content and growth surfaces'),
                description: t(
                    'landing.v2.features.items.growth.description',
                    'Blog, custom pages, referrals, newsletter subscribers, express checkout, and SEO settings help stores keep moving after launch.',
                ),
                accent: t('landing.v2.features.items.growth.accent', 'More than just a theme switcher'),
            },
            {
                icon: BarChart3,
                title: t('landing.v2.features.items.analytics.title', 'Reporting and in-store tooling'),
                description: t(
                    'landing.v2.features.items.analytics.description',
                    'Analytics, exports, QR store codes, POS, and media management keep operations measurable and easier to run at scale.',
                ),
                accent: t('landing.v2.features.items.analytics.accent', 'Dashboard-first operating model'),
            },
        ],
        [t],
    );

    return (
        <section id="features" className="relative overflow-hidden bg-slate-950 py-20 text-white sm:py-24 lg:py-28">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: `radial-gradient(circle at 12% 18%, ${primaryColor}24, transparent 30%), radial-gradient(circle at 82% 12%, rgba(255,193,7,0.16), transparent 24%), linear-gradient(180deg, rgba(15,23,42,0.98), rgba(2,6,23,1))`,
                }}
                aria-hidden
            />
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start">
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
                            className="inline-flex rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/70"
                        >
                            {t('landing.v2.features.badge', 'Platform surface')}
                        </motion.span>
                        <motion.h2
                            variants={landingFadeUp}
                            custom={reduce}
                            className="mt-5 max-w-xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl"
                        >
                            {t('landing.v2.features.title', 'A landing page should sell the real product')}
                        </motion.h2>
                        <motion.p
                            variants={landingFadeUp}
                            custom={reduce}
                            className="mt-5 max-w-xl text-lg leading-relaxed text-white/68"
                        >
                            {t(
                                'landing.v2.features.subtitle',
                                'MTJRii is strongest when it is presented as a commerce workspace: storefronts, checkout, operations, and growth tooling living in the same system.',
                            )}
                        </motion.p>

                        <motion.div
                            variants={landingFadeUp}
                            custom={reduce}
                            className="mt-8 overflow-hidden rounded-[2rem] border border-white/12 bg-black/40 p-3 shadow-[0_34px_90px_-44px_rgba(0,0,0,0.72)] backdrop-blur-xl"
                        >
                            <div className="flex items-center justify-between rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-3">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
                                        {t('landing.v2.features.motionLabel', 'Platform film')}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-white/86">
                                        {t('landing.v2.features.motionTitle', 'The feature story is rendered inside the same Remotion system')}
                                    </p>
                                </div>
                                <span
                                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                                    style={{ backgroundColor: `${primaryColor}22`, color: '#fff' }}
                                >
                                    <Film className="h-3.5 w-3.5" aria-hidden />
                                    Remotion
                                </span>
                            </div>
                            <div className="mt-3 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black">
                                <div className="aspect-video w-full">
                                    <MarketingRemotionPlayer variant="landing" showControls={reduce} />
                                </div>
                            </div>
                            <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-white/[0.05] p-4">
                                <div className="flex items-start gap-3">
                                    <div
                                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]"
                                        style={{ color: primaryColor }}
                                    >
                                        <Sparkles className="h-5 w-5" aria-hidden />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-white">
                                            {t('landing.v2.features.motionCard.title', 'The page now explains capability as a motion sequence')}
                                        </h3>
                                        <p className="mt-2 text-sm leading-relaxed text-white/66">
                                            {t(
                                                'landing.v2.features.motionCard.description',
                                                'Instead of dropping isolated cards under a static headline, the landing keeps the product story alive while visitors scan each capability block.',
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                    <div className="grid gap-5">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;

                            return (
                                <motion.article
                                    key={feature.title}
                                    initial={reduce ? false : { opacity: 0, x: 20 }}
                                    whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
                                    viewport={LANDING_VIEWPORT}
                                    transition={landingRevealTransition(reduce, index)}
                                    className="group relative overflow-hidden rounded-[1.9rem] border border-white/12 bg-white/[0.05] p-6 shadow-[0_28px_70px_-34px_rgba(0,0,0,0.6)] backdrop-blur-sm sm:p-7"
                                >
                                    <div
                                        className="pointer-events-none absolute inset-y-0 left-0 w-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                                        style={{ background: `linear-gradient(180deg, transparent, ${primaryColor}, transparent)` }}
                                        aria-hidden
                                    />
                                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="flex items-start gap-4">
                                            <div
                                                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] border border-white/10 bg-white/[0.05]"
                                                style={{
                                                    color: primaryColor,
                                                    boxShadow: `0 0 0 1px color-mix(in srgb, ${primaryColor} 14%, transparent)`,
                                                }}
                                            >
                                                <Icon className="h-7 w-7" aria-hidden />
                                            </div>
                                            <div className="max-w-xl">
                                                <p
                                                    className="text-[11px] font-semibold uppercase tracking-[0.2em]"
                                                    style={{ color: primaryColor }}
                                                >
                                                    {feature.accent}
                                                </p>
                                                <h3 className="mt-3 text-xl font-semibold text-white sm:text-2xl">
                                                    {feature.title}
                                                </h3>
                                                <p className="mt-3 text-sm leading-relaxed text-white/68 sm:text-base">
                                                    {feature.description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="sm:w-44">
                                            <div className="rounded-[1.35rem] border border-white/10 bg-black/30 p-4">
                                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                                                    {t('landing.v2.features.sceneLabel', 'Scene')}
                                                </p>
                                                <p className="mt-2 text-sm font-semibold text-white/88">
                                                    {t('landing.v2.features.sceneValue', { index: index + 1, defaultValue: `Chapter ${index + 1}` })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.article>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
