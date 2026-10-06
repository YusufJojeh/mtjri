import React from 'react';
import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Film, PlayCircle, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getStoreThemes } from '@/data/storeThemes';

import { LANDING_VIEWPORT, landingContainer, landingFadeUp, landingRevealTransition } from '../lib/landing-motion';
import { sanitizeLandingHex } from '../lib/landing-brand';
import MarketingRemotionPlayer from './MarketingRemotionPlayer';

interface RemotionShowcaseSectionProps {
    settings: any;
    brandColor: string;
}

export default function RemotionShowcaseSection({ settings, brandColor }: RemotionShowcaseSectionProps) {
    const { t } = useTranslation();
    const reduce = useReducedMotion() ?? false;

    const colors = settings?.config_sections?.colors || { primary: brandColor, secondary: '#1578D8', accent: '#FFC107' };
    const primaryColor = sanitizeLandingHex(colors.primary, brandColor);
    const accentColor = sanitizeLandingHex(colors.accent, '#FFC107');

    const themes = React.useMemo(() => getStoreThemes().slice(0, 4), []);

    const storyCards = [
        {
            icon: Film,
            title: t('landing.v2.remotion.cards.film.title', 'Real Remotion landing film'),
            description: t(
                'landing.v2.remotion.cards.film.description',
                'The section uses the existing MTJRii landing composition rendered from the repo, not a placeholder animation.',
            ),
        },
        {
            icon: Sparkles,
            title: t('landing.v2.remotion.cards.scenes.title', 'Built from actual product screens'),
            description: t(
                'landing.v2.remotion.cards.scenes.description',
                'Dashboard, theme onboarding, orders, payments, and catalog scenes all come from the current project assets.',
            ),
        },
        {
            icon: PlayCircle,
            title: t('landing.v2.remotion.cards.embed.title', 'Visible in the public experience'),
            description: t(
                'landing.v2.remotion.cards.embed.description',
                'Remotion now appears as an intentional proof block on the landing page instead of remaining hidden in the codebase.',
            ),
        },
    ];

    return (
        <section id="remotion-showcase" className="relative overflow-hidden py-20 sm:py-24 lg:py-28">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: `radial-gradient(circle at 15% 18%, ${primaryColor}10, transparent 34%), radial-gradient(circle at 84% 22%, ${accentColor}14, transparent 28%), linear-gradient(180deg, rgba(15,23,42,0.02), rgba(15,23,42,0))`,
                }}
                aria-hidden
            />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center">
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={LANDING_VIEWPORT}
                        variants={landingContainer}
                        custom={reduce}
                        className="max-w-2xl"
                    >
                        <motion.span
                            variants={landingFadeUp}
                            custom={reduce}
                            className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600"
                        >
                            {t('landing.v2.remotion.badge', 'Remotion showcase')}
                        </motion.span>
                        <motion.h2
                            variants={landingFadeUp}
                            custom={reduce}
                            className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl lg:text-5xl"
                        >
                            {t('landing.v2.remotion.title', 'Motion proof built from the actual MTJRii product story')}
                        </motion.h2>
                        <motion.p
                            variants={landingFadeUp}
                            custom={reduce}
                            className="mt-5 text-lg leading-relaxed text-slate-600"
                        >
                            {t(
                                'landing.v2.remotion.subtitle',
                                'The repo already includes crafted Remotion compositions. The redesign promotes that work into the public experience so visitors can immediately see the platform narrative in motion.',
                            )}
                        </motion.p>

                        <div className="mt-8 space-y-4">
                            {storyCards.map((card, index) => {
                                const Icon = card.icon;

                                return (
                                    <motion.article
                                        key={card.title}
                                        initial={reduce ? false : { opacity: 0, y: 18 }}
                                        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                                        viewport={LANDING_VIEWPORT}
                                        transition={landingRevealTransition(reduce, index)}
                                        className="landing-card-depth rounded-[1.5rem] border border-slate-200/80 bg-white/92 p-5 shadow-sm"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div
                                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50"
                                                style={{ color: primaryColor }}
                                            >
                                                <Icon className="h-6 w-6" aria-hidden />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-slate-950">{card.title}</h3>
                                                <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                                                    {card.description}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.article>
                                );
                            })}
                        </div>

                        <div className="mt-8 flex flex-wrap gap-3">
                            {themes.map((theme) => (
                                <span
                                    key={theme.id}
                                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
                                >
                                    {theme.name}
                                </span>
                            ))}
                        </div>

                        <div className="mt-8">
                            <Link
                                href={route('register.stepper.index')}
                                className="landing-cta-depth inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--primary-color)] bg-[var(--primary-color)] px-7 py-4 text-base font-semibold text-white shadow-[0_24px_48px_-26px_var(--primary-color)] transition hover:brightness-110"
                            >
                                {t('landing.v2.remotion.cta', 'Start with the guided setup')}
                                <ArrowRight className="h-5 w-5" aria-hidden />
                            </Link>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={reduce ? false : { opacity: 0, y: 18 }}
                        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                        viewport={LANDING_VIEWPORT}
                        transition={landingRevealTransition(reduce, 1)}
                        className="landing-card-depth overflow-hidden rounded-[2rem] border border-slate-200/80 bg-slate-950 p-3 shadow-[0_34px_90px_-44px_rgba(15,23,42,0.6)]"
                    >
                        <div className="flex items-center justify-between rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-white">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
                                    {t('landing.v2.remotion.video.label', 'Landing film')}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-white/88">
                                    {t('landing.v2.remotion.video.title', 'Existing MTJRii Remotion composition rendered into the page')}
                                </p>
                            </div>
                            <span
                                className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                                style={{ backgroundColor: `${accentColor}24`, color: accentColor }}
                            >
                                Remotion
                            </span>
                        </div>

                        <div className="mt-3 overflow-hidden rounded-[1.55rem] border border-white/10 bg-black">
                            <div className="aspect-video w-full">
                                <MarketingRemotionPlayer variant="landing" showControls={reduce} />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
