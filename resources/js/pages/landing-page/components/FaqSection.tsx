import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
        <section id='faqs' className='bg-gradient-to-b from-white to-slate-50/60 py-20 md:py-32'>
            <div className='container mx-auto px-4'>
                <motion.div
                    className='mx-auto mb-16 max-w-3xl text-center'
                    initial='hidden'
                    whileInView='visible'
                    viewport={LANDING_VIEWPORT}
                    variants={landingContainer}
                    custom={reduce}
                >
                    <motion.h2
                        variants={landingFadeUp}
                        custom={reduce}
                        className='mt-4 mb-6 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl lg:text-5xl'
                    >
                        {t('landing.faq.title')}
                    </motion.h2>
                    <motion.p variants={landingFadeUp} custom={reduce} className='text-lg text-slate-600'>
                        {t('landing.faq.subtitle')}
                    </motion.p>
                </motion.div>

                <div className='mx-auto max-w-3xl space-y-4'>
                    {displayFaqs.map((faq, index) => (
                        <motion.div
                            key={faq.id}
                            initial={reduce ? false : { opacity: 0, y: 12 }}
                            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                            viewport={LANDING_VIEWPORT}
                            transition={landingRevealTransition(reduce, index)}
                            className='landing-card-depth rounded-xl border border-slate-200/90 bg-white px-6 shadow-sm'
                            style={{
                                borderColor: openFaq === faq.id ? `${primaryColor}40` : 'rgba(15, 23, 42, 0.08)',
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
                                <span className='pr-4 font-semibold text-slate-900' id={`faq-question-${faq.id}`}>
                                    {faq.question}
                                </span>
                                {openFaq === faq.id ? (
                                    <ChevronUp className='h-5 w-5 shrink-0 text-slate-600' aria-hidden />
                                ) : (
                                    <ChevronDown className='h-5 w-5 shrink-0 text-slate-600' aria-hidden />
                                )}
                            </button>

                            {openFaq === faq.id && (
                                <div
                                    className='motion-safe:transition-all motion-safe:duration-300 pb-5 text-slate-600'
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

                <motion.div
                    className='mt-12 text-center'
                    initial={reduce ? false : { opacity: 0, y: 12 }}
                    whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                    viewport={LANDING_VIEWPORT}
                    transition={landingRevealTransition(reduce, displayFaqs.length)}
                >
                    <p className='mb-4 text-slate-600'>{t('landing.faq.stillHaveQuestions')}</p>
                    <Link
                        href={route('contact')}
                        className='landing-cta-depth landing-cta-primary inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-white'
                        style={{ backgroundColor: primaryColor }}
                    >
                        {t('landing.faq.contactUs')}
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
