import React from 'react';
import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { getStoreThemes } from '@/data/storeThemes';

import { LANDING_VIEWPORT, landingContainer, landingFadeUp, landingRevealTransition } from '../lib/landing-motion';
import { sanitizeLandingHex } from '../lib/landing-brand';

interface TemplatesSectionProps {
    settings: any;
    brandColor: string;
}

export default function TemplatesSection({ settings, brandColor }: TemplatesSectionProps) {
    const { t } = useTranslation();
    const reduce = useReducedMotion() ?? false;

    const colors = settings?.config_sections?.colors || { primary: brandColor, secondary: '#1578D8', accent: '#FFC107' };
    const primaryColor = sanitizeLandingHex(colors.primary, brandColor);

    const themes = React.useMemo(() => getStoreThemes(), []);
    const featuredThemes = themes.slice(0, 6);

    return (
        <section id="templates" className="relative overflow-hidden py-20 sm:py-24 lg:py-28">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: `radial-gradient(circle at 14% 24%, ${primaryColor}12, transparent 26%), linear-gradient(180deg, rgba(255,255,255,1), rgba(248,250,252,0.94))`,
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
                        className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600"
                    >
                        {t('landing.v2.templates.badge', 'Theme library')}
                    </motion.span>
                    <motion.h2
                        variants={landingFadeUp}
                        custom={reduce}
                        className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl lg:text-5xl"
                    >
                        {t('landing.v2.templates.title', 'Ten storefront directions already ship with the product')}
                    </motion.h2>
                    <motion.p
                        variants={landingFadeUp}
                        custom={reduce}
                        className="mt-5 text-lg leading-relaxed text-slate-600"
                    >
                        {t(
                            'landing.v2.templates.subtitle',
                            'The theme gallery is one of the clearest differentiators in the codebase. Showing it directly is stronger than promising abstract flexibility.',
                        )}
                    </motion.p>
                </motion.div>

                <div className="mt-14 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/86 p-4 shadow-[0_30px_80px_-44px_rgba(15,23,42,0.24)] backdrop-blur-sm sm:p-5">
                    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-4">
                        {themes.map((theme) => (
                            <span
                                key={theme.id}
                                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600"
                            >
                                {theme.name}
                            </span>
                        ))}
                    </div>

                    <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {featuredThemes.map((theme, index) => (
                            <motion.article
                                key={theme.id}
                                initial={reduce ? false : { opacity: 0, y: 18 }}
                                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                                viewport={LANDING_VIEWPORT}
                                transition={landingRevealTransition(reduce, index)}
                                className="landing-card-depth group overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-sm"
                            >
                                <div className="theme-preview-container aspect-[16/11] overflow-hidden border-b border-slate-200 bg-slate-100">
                                    <img
                                        src={theme.thumbnail}
                                        alt={theme.name}
                                        className="theme-preview-image h-full w-full object-cover object-top"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                </div>
                                <div className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="text-xl font-semibold tracking-tight text-slate-950">{theme.name}</h3>
                                            <p className="mt-2 text-sm leading-relaxed text-slate-600">{theme.description}</p>
                                        </div>
                                        <span
                                            className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                                            style={{
                                                backgroundColor: `${primaryColor}12`,
                                                color: primaryColor,
                                            }}
                                        >
                                            {t('landing.v2.templates.badgeLabel', 'Storefront')}
                                        </span>
                                    </div>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                </div>

                <div className="mt-10 text-center">
                    <Link
                        href={route('register.stepper.index')}
                        className="landing-cta-depth inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--primary-color)] bg-[var(--primary-color)] px-7 py-4 text-base font-semibold text-white shadow-[0_24px_48px_-26px_var(--primary-color)] transition hover:brightness-110"
                    >
                        {t('landing.v2.templates.cta', 'Choose your theme during setup')}
                        <ArrowRight className="h-5 w-5" aria-hidden />
                    </Link>
                </div>
            </div>
        </section>
    );
}
