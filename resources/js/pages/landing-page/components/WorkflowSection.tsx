import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, LayoutTemplate, Sparkles, Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { LANDING_VIEWPORT, landingContainer, landingFadeUp, landingRevealTransition } from '../lib/landing-motion';
import { sanitizeLandingHex } from '../lib/landing-brand';
import MarketingRemotionPlayer from './MarketingRemotionPlayer';

interface WorkflowSectionProps {
    brandColor?: string;
    settings: any;
}

const icons = [Store, LayoutTemplate, ArrowUpRight];

export default function WorkflowSection({ settings, brandColor = '#1E90FF' }: WorkflowSectionProps) {
    const { t } = useTranslation();
    const reduce = useReducedMotion() ?? false;

    const colors = settings?.config_sections?.colors || { primary: brandColor, secondary: '#1578D8', accent: '#FFC107' };
    const primaryColor = sanitizeLandingHex(colors.primary, brandColor);
    const accentColor = sanitizeLandingHex(colors.accent, '#FFC107');

    const steps = [
        {
            title: t('landing.v2.workflow.step1.title', 'Create the workspace'),
            description: t(
                'landing.v2.workflow.step1.description',
                'Start with company registration, create the store shell, and define the brand, language, and domain direction.',
            ),
        },
        {
            title: t('landing.v2.workflow.step2.title', 'Choose a storefront direction'),
            description: t(
                'landing.v2.workflow.step2.description',
                'Pick the theme that fits the vertical, load products, organize categories, and shape the public experience.',
            ),
        },
        {
            title: t('landing.v2.workflow.step3.title', 'Connect operations and publish'),
            description: t(
                'landing.v2.workflow.step3.description',
                'Activate payments, shipping, taxes, blog, coupons, analytics, and ongoing store management from the same workspace.',
            ),
        },
    ];

    return (
        <section id="workflow" className="relative overflow-hidden bg-slate-950 py-20 text-white sm:py-24 lg:py-28">
            <div
                className="pointer-events-none absolute inset-0 opacity-75"
                style={{
                    background: `radial-gradient(ellipse 68% 48% at 50% -6%, color-mix(in srgb, ${primaryColor} 28%, transparent), transparent 62%),
                    radial-gradient(ellipse 34% 26% at 82% 18%, color-mix(in srgb, ${accentColor} 10%, transparent), transparent 70%)`,
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
                        className="inline-flex rounded-full border border-white/12 bg-white/6 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/72"
                    >
                        {t('landing.v2.workflow.badge', 'Launch rhythm')}
                    </motion.span>
                    <motion.h2
                        variants={landingFadeUp}
                        custom={reduce}
                        className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl"
                    >
                        {t('landing.v2.workflow.title', 'The onboarding flow already points toward commerce operations')}
                    </motion.h2>
                    <motion.p
                        variants={landingFadeUp}
                        custom={reduce}
                        className="mt-5 text-lg leading-relaxed text-white/68"
                    >
                        {t(
                            'landing.v2.workflow.subtitle',
                            'The product already guides users from workspace setup to theme choice to plan-aware store activation. The landing page should mirror that path.',
                        )}
                    </motion.p>
                </motion.div>

                <div className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
                    <motion.div
                        initial={reduce ? false : { opacity: 0, y: 18 }}
                        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                        viewport={LANDING_VIEWPORT}
                        transition={landingRevealTransition(reduce, 0)}
                        className="overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.04] p-3 shadow-[0_32px_90px_-42px_rgba(0,0,0,0.72)] backdrop-blur-sm"
                    >
                        <div className="flex items-center justify-between rounded-[1.3rem] border border-white/10 bg-white/[0.04] px-4 py-3">
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">
                                    {t('landing.v2.workflow.player.label', 'Motion-led onboarding')}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-white/86">
                                    {t('landing.v2.workflow.player.title', 'The landing flow is visually tied to the same Remotion system')}
                                </p>
                            </div>
                            <span
                                className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
                                style={{ backgroundColor: `${accentColor}24`, color: accentColor }}
                            >
                                <Sparkles className="mr-1 inline h-3.5 w-3.5" aria-hidden />
                                Motion
                            </span>
                        </div>
                        <div className="mt-3 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black">
                            <div className="aspect-video w-full">
                                <MarketingRemotionPlayer variant="hero" showControls={reduce} />
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid gap-5">
                        {steps.map((step, index) => {
                            const Icon = icons[index] ?? Store;

                            return (
                                <motion.article
                                    key={step.title}
                                    initial={reduce ? false : { opacity: 0, x: 18 }}
                                    whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
                                    viewport={LANDING_VIEWPORT}
                                    transition={landingRevealTransition(reduce, index + 1)}
                                    className="landing-card-depth-dark group relative rounded-[1.75rem] border border-white/12 bg-white/[0.045] p-7 shadow-[0_28px_80px_-34px_rgba(0,0,0,0.6)] backdrop-blur-sm"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div
                                            className="landing-workflow-icon inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.05]"
                                            style={{ color: primaryColor }}
                                        >
                                            <Icon className="h-7 w-7" aria-hidden />
                                        </div>
                                        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/30">
                                            {t('landing.v2.workflow.stepLabel', 'Step')} {index + 1}
                                        </span>
                                    </div>
                                    <h3 className="mt-8 text-2xl font-semibold tracking-tight text-white">{step.title}</h3>
                                    <p className="mt-4 text-sm leading-relaxed text-white/68 sm:text-base">{step.description}</p>
                                    <div
                                        className="landing-workflow-accent-line pointer-events-none absolute inset-x-8 bottom-0 h-px opacity-0 group-hover:opacity-100"
                                        style={{
                                            background: `linear-gradient(90deg, transparent, ${accentColor}88, transparent)`,
                                        }}
                                        aria-hidden
                                    />
                                </motion.article>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
