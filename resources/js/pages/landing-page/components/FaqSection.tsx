import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from '@inertiajs/react';
import { LANDING_VIEWPORT, landingContainer, landingFadeUp, landingRevealTransition } from '../lib/landing-motion';

interface Faq {
    id: number;
    question: string;
    answer: string;
}

interface FaqSectionProps {
    brandColor?: string;
    faqs: Faq[];
    settings?: any;
}

export default function FaqSection({ faqs: _faqs, settings, brandColor = '#3b82f6' }: FaqSectionProps) {
    const { t, i18n } = useTranslation();
    const reduce = useReducedMotion() ?? false;
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const colors = settings?.config_sections?.colors || { primary: brandColor, secondary: '#059669', accent: '#065f46' };
    const primaryColor = colors.primary || brandColor;

    const displayFaqs = React.useMemo(
        () => [
            { id: 1, question: t('landing.faq.items.1.question'), answer: t('landing.faq.items.1.answer') },
            { id: 2, question: t('landing.faq.items.2.question'), answer: t('landing.faq.items.2.answer') },
            { id: 3, question: t('landing.faq.items.3.question'), answer: t('landing.faq.items.3.answer') },
            { id: 4, question: t('landing.faq.items.4.question'), answer: t('landing.faq.items.4.answer') },
            { id: 5, question: t('landing.faq.items.5.question'), answer: t('landing.faq.items.5.answer') },
        ],
        [t, i18n.language],
    );

    const toggleFaq = (id: number) => {
        setOpenFaq(openFaq === id ? null : id);
    };

    return (
        <section id='faqs' className='relative overflow-hidden bg-slate-950 py-20 text-white md:py-32'>
            <div
                className='pointer-events-none absolute inset-0'
                style={{
                    background: `radial-gradient(circle at 18% 16%, ${primaryColor}24, transparent 28%), radial-gradient(circle at 84% 18%, rgba(255,193,7,0.16), transparent 22%), linear-gradient(180deg, rgba(15,23,42,0.98), rgba(2,6,23,1))`,
                }}
                aria-hidden
            />
            <div className='relative container mx-auto px-4'>
                <motion.div
                    className='mx-auto mb-16 max-w-3xl text-center'
                    initial='hidden'
                    whileInView='visible'
                    viewport={LANDING_VIEWPORT}
                    variants={landingContainer}
                    custom={reduce}
                >
                    <motion.span
                        variants={landingFadeUp}
                        custom={reduce}
                        className='inline-flex rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/72'
                    >
                        {t('landing.v2.faq.badge', 'Closing chapter')}
                    </motion.span>
                    <motion.h2
                        variants={landingFadeUp}
                        custom={reduce}
                        className='mt-4 mb-6 text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl'
                    >
                        {t('landing.faq.title')}
                    </motion.h2>
                    <motion.p variants={landingFadeUp} custom={reduce} className='text-lg text-white/68'>
                        {t('landing.faq.subtitle')}
                    </motion.p>
                </motion.div>

                <div className='mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start'>
                    <motion.div
                        initial={reduce ? false : { opacity: 0, y: 12 }}
                        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                        viewport={LANDING_VIEWPORT}
                        transition={landingRevealTransition(reduce, 0)}
                        className='landing-card-depth-dark rounded-[2rem] border border-white/12 bg-white/[0.05] p-6 shadow-[0_30px_80px_-44px_rgba(0,0,0,0.62)] backdrop-blur-sm'
                    >
                        <div className='flex items-start gap-4'>
                            <div
                                className='flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]'
                                style={{ color: primaryColor }}
                            >
                                <HelpCircle className='h-7 w-7' aria-hidden />
                            </div>
                            <div>
                                <p className='text-[11px] font-semibold uppercase tracking-[0.2em] text-white/42'>
                                    {t('landing.v2.faq.side.label', 'Final clarity')}
                                </p>
                                <h3 className='mt-3 text-2xl font-semibold text-white'>
                                    {t('landing.v2.faq.side.title', 'Questions should resolve friction, not interrupt the cinematic flow')}
                                </h3>
                                <p className='mt-4 text-sm leading-relaxed text-white/66 sm:text-base'>
                                    {t(
                                        'landing.v2.faq.side.description',
                                        'This final chapter keeps the landing readable and conversion-focused while preserving the same motion-led visual language established above.',
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className='mt-6 space-y-3'>
                            {[
                                t('landing.v2.faq.side.points.one', 'Clear answers for setup, pricing, and support'),
                                t('landing.v2.faq.side.points.two', 'High-contrast surfaces for readability'),
                                t('landing.v2.faq.side.points.three', 'Contact CTA remains visible at the end of the story'),
                            ].map((point) => (
                                <div key={point} className='flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3'>
                                    <span
                                        className='inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]'
                                        style={{ color: primaryColor }}
                                    >
                                        <Sparkles className='h-4 w-4' aria-hidden />
                                    </span>
                                    <span className='text-sm text-white/82'>{point}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <div className='space-y-4'>
                    {displayFaqs.map((faq, index) => (
                        <motion.div
                            key={faq.id}
                            initial={reduce ? false : { opacity: 0, y: 12 }}
                            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                            viewport={LANDING_VIEWPORT}
                            transition={landingRevealTransition(reduce, index)}
                            className='rounded-[1.4rem] border border-white/12 bg-white/[0.05] px-6 shadow-[0_24px_60px_-36px_rgba(0,0,0,0.65)] backdrop-blur-sm'
                            style={{
                                borderColor: openFaq === faq.id ? `${primaryColor}55` : 'rgba(255,255,255,0.10)',
                            }}
                        >
                            <button
                                type='button'
                                onClick={() => toggleFaq(faq.id)}
                                className='flex w-full items-center justify-between py-5 text-left hover:no-underline'
                                aria-expanded={openFaq === faq.id}
                                aria-controls={`faq-answer-${faq.id}`}
                                aria-describedby={`faq-question-${faq.id}`}
                            >
                                <span className='pr-4 font-semibold text-white' id={`faq-question-${faq.id}`}>
                                    {faq.question}
                                </span>
                                {openFaq === faq.id ? (
                                    <ChevronUp className='h-5 w-5 shrink-0 text-white/66' aria-hidden />
                                ) : (
                                    <ChevronDown className='h-5 w-5 shrink-0 text-white/66' aria-hidden />
                                )}
                            </button>

                            {openFaq === faq.id && (
                                <div
                                    className='motion-safe:transition-all motion-safe:duration-300 pb-5 text-white/68'
                                    id={`faq-answer-${faq.id}`}
                                    role='region'
                                    aria-labelledby={`faq-question-${faq.id}`}
                                >
                                    {faq.answer}
                                </div>
                            )}
                        </motion.div>
                    ))}
                    </div>
                </div>

                <motion.div
                    className='mt-12 text-center'
                    initial={reduce ? false : { opacity: 0, y: 12 }}
                    whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                    viewport={LANDING_VIEWPORT}
                    transition={landingRevealTransition(reduce, displayFaqs.length)}
                >
                    <p className='mb-4 text-white/66'>{t('landing.faq.stillHaveQuestions')}</p>
                    <Link
                        href={route('contact')}
                        className='landing-cta-depth landing-cta-primary inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold text-white'
                        style={{ backgroundColor: primaryColor }}
                    >
                        {t('landing.faq.contactUs')}
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
