import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Store, Palette, Rocket } from 'lucide-react';
import { LANDING_VIEWPORT, landingContainer, landingFadeUp, landingRevealTransition } from '../lib/landing-motion';
import { sanitizeLandingHex } from '../lib/landing-brand';

interface WorkflowSectionProps {
    brandColor?: string;
    settings: any;
}

const icons = [Store, Palette, Rocket];

export default function WorkflowSection({ settings, brandColor = '#10b981' }: WorkflowSectionProps) {
    const { t } = useTranslation();
    const reduce = useReducedMotion() ?? false;

    const colors = settings?.config_sections?.colors || { primary: brandColor, secondary: '#059669', accent: '#065f46' };
    const primaryColor = sanitizeLandingHex(colors.primary, brandColor);
    const accentColor = sanitizeLandingHex(colors.accent, '#065f46');

    const steps = [
        { title: t('landing.workflow.step1.title'), description: t('landing.workflow.step1.description') },
        { title: t('landing.workflow.step2.title'), description: t('landing.workflow.step2.description') },
        { title: t('landing.workflow.step3.title'), description: t('landing.workflow.step3.description') },
    ];

    return (
        <section id='workflow' className='relative overflow-hidden bg-zinc-950 py-20 text-white md:py-28'>
            <div
                className='pointer-events-none absolute inset-0 opacity-40'
                style={{
                    background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${primaryColor}33, transparent 60%)`,
                }}
                aria-hidden
            />
            <div className='container relative mx-auto px-4'>
                <motion.div
                    className='mx-auto mb-14 max-w-3xl text-center md:mb-20'
                    initial='hidden'
                    whileInView='visible'
                    viewport={LANDING_VIEWPORT}
                    variants={landingContainer}
                    custom={reduce}
                >
                    <motion.span
                        variants={landingFadeUp}
                        custom={reduce}
                        className='inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/80'
                    >
                        {t('landing.workflow.badge')}
                    </motion.span>
                    <motion.h2
                        variants={landingFadeUp}
                        custom={reduce}
                        className='mt-5 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl'
                    >
                        {t('landing.workflow.title')}
                    </motion.h2>
                    <motion.p
                        variants={landingFadeUp}
                        custom={reduce}
                        className='mt-4 text-lg leading-relaxed text-zinc-400 md:text-xl'
                    >
                        {t('landing.workflow.subtitle')}
                    </motion.p>
                </motion.div>

                <div className='landing-workflow-track mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-stretch md:gap-0'>
                    {steps.map((step, index) => (
                        <React.Fragment key={step.title}>
                            <motion.article
                                initial={reduce ? false : { opacity: 0, y: 14 }}
                                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                                viewport={LANDING_VIEWPORT}
                                transition={landingRevealTransition(reduce, index)}
                                className='landing-card-depth-dark group relative flex-1 rounded-2xl border border-white/10 bg-white/[0.04] p-8 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.5)] backdrop-blur-sm'
                                aria-labelledby={`workflow-step-${index}-label workflow-step-${index}-title`}
                            >
                                <div
                                    className='landing-workflow-icon mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-white/10'
                                    style={{ backgroundColor: `${primaryColor}22` }}
                                >
                                    {(() => {
                                        const Icon = icons[index] ?? Store;
                                        return <Icon className='h-7 w-7' style={{ color: primaryColor }} aria-hidden />;
                                    })()}
                                </div>
                                <p
                                    className='mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500'
                                    id={`workflow-step-${index}-label`}
                                >
                                    {t('landing.workflow.stepLabel', { count: index + 1 })}
                                </p>
                                <h3 className='text-xl font-semibold tracking-tight text-white' id={`workflow-step-${index}-title`}>
                                    {step.title}
                                </h3>
                                <p className='mt-3 text-sm leading-relaxed text-zinc-400 md:text-base'>{step.description}</p>
                                <div
                                    className='landing-workflow-accent-line pointer-events-none absolute inset-x-6 bottom-0 h-px opacity-0 motion-reduce:opacity-[0.22] motion-reduce:group-hover:opacity-[0.28] group-hover:opacity-100'
                                    style={{
                                        background: `linear-gradient(90deg, transparent, ${accentColor}88, transparent)`,
                                    }}
                                    aria-hidden
                                />
                            </motion.article>
                            {index < steps.length - 1 && (
                                <div
                                    className='hidden shrink-0 md:flex md:w-12 md:flex-col md:items-center md:justify-center'
                                    aria-hidden
                                >
                                    <div className='landing-workflow-connector h-full min-h-[6rem] w-px bg-gradient-to-b from-transparent via-white/20 to-transparent' />
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </section>
    );
}
