import React from 'react';
import { Film, Layers3, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { getImageUrl } from '@/utils/image-helper';

import { LANDING_VIEWPORT, landingContainer, landingFadeUp, landingRevealTransition } from '../lib/landing-motion';
import { sanitizeLandingHex } from '../lib/landing-brand';
import MarketingRemotionPlayer from './MarketingRemotionPlayer';

interface ScreenshotsSectionProps {
    brandColor?: string;
    settings?: any;
}

export default function ScreenshotsSection({ brandColor = '#1E90FF', settings }: ScreenshotsSectionProps) {
    const { t } = useTranslation();
    const reduce = useReducedMotion() ?? false;

    const colors = settings?.config_sections?.colors || { primary: brandColor, secondary: '#1578D8', accent: '#FFC107' };
    const primaryColor = sanitizeLandingHex(colors.primary, brandColor);

    const scenes = [
        {
            src: getImageUrl('/storage/placeholder/landing-page/multi-store-dashboard.png'),
            title: t('landing.v2.screenshots.items.dashboard.title', 'A real dashboard, not a static hero render'),
            description: t(
                'landing.v2.screenshots.items.dashboard.description',
                'Dashboard, exports, store switching, top products, recent orders, and QR store access are already in the product surface.',
            ),
            badge: t('landing.v2.screenshots.items.dashboard.badge', 'Control center'),
            span: 'lg:col-span-7',
        },
        {
            src: getImageUrl('/storage/placeholder/landing-page/theme-selection.png'),
            title: t('landing.v2.screenshots.items.themes.title', 'Theme selection is part of setup'),
            description: t(
                'landing.v2.screenshots.items.themes.description',
                'Users do not just get a promise of flexibility. The product already ships a library of vertical storefront directions during onboarding and store editing.',
            ),
            badge: t('landing.v2.screenshots.items.themes.badge', 'Theme library'),
            span: 'lg:col-span-5',
        },
        {
            src: getImageUrl('/storage/placeholder/landing-page/product-management.png'),
            title: t('landing.v2.screenshots.items.catalog.title', 'Catalog operations stay close to the storefront'),
            description: t(
                'landing.v2.screenshots.items.catalog.description',
                'Products, categories, inventory, and media management are built for day-to-day store operations.',
            ),
            badge: t('landing.v2.screenshots.items.catalog.badge', 'Catalog'),
            span: 'lg:col-span-4',
        },
        {
            src: getImageUrl('/storage/placeholder/landing-page/order-management.png'),
            title: t('landing.v2.screenshots.items.orders.title', 'Orders and customer workflows are first-class'),
            description: t(
                'landing.v2.screenshots.items.orders.description',
                'The product already covers order processing, customer handling, reviews, shipping, and fulfillment-related workflows.',
            ),
            badge: t('landing.v2.screenshots.items.orders.badge', 'Operations'),
            span: 'lg:col-span-4',
        },
        {
            src: getImageUrl('/storage/placeholder/landing-page/payment-integration.png'),
            title: t('landing.v2.screenshots.items.payments.title', 'Payment coverage is visible, not implied'),
            description: t(
                'landing.v2.screenshots.items.payments.description',
                'Multiple payment controllers and store checkout flows are present in the codebase, so the landing page can confidently sell payment readiness.',
            ),
            badge: t('landing.v2.screenshots.items.payments.badge', 'Payments'),
            span: 'lg:col-span-4',
        },
    ];

    const motionPillars = [
        {
            icon: Film,
            title: t('landing.v2.screenshots.pillars.motion.title', 'Remotion is carrying the product narrative'),
            description: t(
                'landing.v2.screenshots.pillars.motion.description',
                'The landing storytelling is now anchored by the live composition instead of falling back to static screenshots only.',
            ),
        },
        {
            icon: Layers3,
            title: t('landing.v2.screenshots.pillars.sequence.title', 'Sections read like a visual sequence'),
            description: t(
                'landing.v2.screenshots.pillars.sequence.description',
                'Operators move from control center to themes to operations while the motion system keeps the product story coherent.',
            ),
        },
        {
            icon: Sparkles,
            title: t('landing.v2.screenshots.pillars.brand.title', 'Brand moments stay inside the existing DNA'),
            description: t(
                'landing.v2.screenshots.pillars.brand.description',
                'Blue, gold, logo treatment, and MTJRii product truth remain intact while the experience becomes more premium.',
            ),
        },
    ];

    return (
        <section id="screenshots" className="relative overflow-hidden bg-slate-950 py-20 text-white sm:py-24 lg:py-28">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: `radial-gradient(circle at 14% 18%, ${primaryColor}20, transparent 30%), radial-gradient(circle at 82% 16%, rgba(255,193,7,0.14), transparent 26%), linear-gradient(180deg, rgba(15,23,42,0.96), rgba(2,6,23,1))`,
                }}
                aria-hidden
            />
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div
                    className="mx-auto max-w-3xl text-center"
                    initial="hidden"
                    whileInView="visible"
                    viewport={LANDING_VIEWPORT}
                    variants={landingContainer}
                    custom={reduce}
                >
                    <motion.span
                        variants={landingFadeUp}
                        custom={reduce}
                        className="inline-flex rounded-full border border-white/12 bg-white/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/72"
                    >
                        {t('landing.v2.screenshots.badge', 'Motion storyboard')}
                    </motion.span>
                    <motion.h2
                        variants={landingFadeUp}
                        custom={reduce}
                        className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl"
                    >
                        {t('landing.v2.screenshots.title', 'The landing keeps moving while it explains the product')}
                    </motion.h2>
                    <motion.p
                        variants={landingFadeUp}
                        custom={reduce}
                        className="mt-5 text-lg leading-relaxed text-white/68"
                    >
                        {t(
                            'landing.v2.screenshots.subtitle',
                            'Remotion now acts as the living backdrop for the product explanation while the real admin surfaces continue to prove what the platform already does.',
                        )}
                    </motion.p>
                </motion.div>

                <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
                    <motion.div
                        initial={reduce ? false : { opacity: 0, y: 18 }}
                        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                        viewport={LANDING_VIEWPORT}
                        transition={landingRevealTransition(reduce, 0)}
                        className="landing-card-depth sticky top-28 overflow-hidden rounded-[2rem] border border-white/12 bg-black/50 p-3 shadow-[0_34px_90px_-44px_rgba(0,0,0,0.7)] backdrop-blur-xl"
                    >
                        <div className="flex items-center justify-between rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-3">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
                                    {t('landing.v2.screenshots.player.label', 'Live Remotion layer')}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-white/88">
                                    {t('landing.v2.screenshots.player.title', 'The landing storytelling is rendered by the composition code')}
                                </p>
                            </div>
                            <span
                                className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                                style={{ backgroundColor: `${primaryColor}24`, color: '#ffffff' }}
                            >
                                Remotion
                            </span>
                        </div>
                        <div className="mt-3 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black">
                            <div className="aspect-video w-full">
                                <MarketingRemotionPlayer variant="landing" showControls={reduce} />
                            </div>
                        </div>
                        <div className="mt-4 grid gap-3">
                            {motionPillars.map((pillar) => {
                                const Icon = pillar.icon;
                                return (
                                    <div
                                        key={pillar.title}
                                        className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] p-4"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]"
                                                style={{ color: primaryColor }}
                                            >
                                                <Icon className="h-5 w-5" aria-hidden />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-semibold text-white">{pillar.title}</h3>
                                                <p className="mt-2 text-sm leading-relaxed text-white/68">{pillar.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>

                    <div className="grid gap-5 lg:grid-cols-12">
                        {scenes.map((scene, index) => (
                            <motion.article
                                key={scene.title}
                                initial={reduce ? false : { opacity: 0, y: 18 }}
                                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                                viewport={LANDING_VIEWPORT}
                                transition={landingRevealTransition(reduce, index + 1)}
                                className={`overflow-hidden rounded-[1.9rem] border border-white/12 bg-white/[0.06] shadow-[0_22px_70px_-34px_rgba(0,0,0,0.65)] backdrop-blur-sm ${scene.span}`}
                            >
                                <div className="aspect-[16/10] overflow-hidden border-b border-white/10 bg-slate-900">
                                    <img
                                        src={scene.src}
                                        alt={scene.title}
                                        className="h-full w-full object-cover object-top"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </div>
                                <div className="p-6">
                                    <span
                                        className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                                        style={{
                                            backgroundColor: `${primaryColor}24`,
                                            color: '#ffffff',
                                        }}
                                    >
                                        {scene.badge}
                                    </span>
                                    <h3 className="mt-4 text-xl font-semibold tracking-tight text-white">{scene.title}</h3>
                                    <p className="mt-3 text-sm leading-relaxed text-white/68 sm:text-base">{scene.description}</p>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
