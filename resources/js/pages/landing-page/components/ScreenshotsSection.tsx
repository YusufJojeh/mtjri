import React from 'react';
import { Monitor } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getImageUrl } from '../../../utils/image-helper';
import { LANDING_VIEWPORT, landingContainer, landingFadeUp, landingRevealTransition } from '../lib/landing-motion';

interface ScreenshotsSectionProps {
    brandColor?: string;
    settings?: any;
}

export default function ScreenshotsSection({ brandColor = '#3b82f6', settings }: ScreenshotsSectionProps) {
    const { t } = useTranslation();
    const reduce = useReducedMotion() ?? false;

    const colors = settings?.config_sections?.colors || { primary: brandColor, secondary: '#059669', accent: '#065f46' };
    const primaryColor = colors.primary || brandColor;

    const screenshots: Array<{
        src: string;
        alt: string;
        title: string;
        description: string;
    }> = [
        {
            src: t('landing.screenshots.items.1.src'),
            alt: t('landing.screenshots.items.1.alt'),
            title: t('landing.screenshots.items.1.title'),
            description: t('landing.screenshots.items.1.description'),
        },
        {
            src: t('landing.screenshots.items.2.src'),
            alt: t('landing.screenshots.items.2.alt'),
            title: t('landing.screenshots.items.2.title'),
            description: t('landing.screenshots.items.2.description'),
        },
        {
            src: t('landing.screenshots.items.3.src'),
            alt: t('landing.screenshots.items.3.alt'),
            title: t('landing.screenshots.items.3.title'),
            description: t('landing.screenshots.items.3.description'),
        },
        {
            src: t('landing.screenshots.items.4.src'),
            alt: t('landing.screenshots.items.4.alt'),
            title: t('landing.screenshots.items.4.title'),
            description: t('landing.screenshots.items.4.description'),
        },
        {
            src: t('landing.screenshots.items.5.src'),
            alt: t('landing.screenshots.items.5.alt'),
            title: t('landing.screenshots.items.5.title'),
            description: t('landing.screenshots.items.5.description'),
        },
        {
            src: t('landing.screenshots.items.6.src'),
            alt: t('landing.screenshots.items.6.alt'),
            title: t('landing.screenshots.items.6.title'),
            description: t('landing.screenshots.items.6.description'),
        },
    ];

    return (
        <section id='screenshots' className='bg-white py-20 md:py-32'>
            <div className='container mx-auto max-w-7xl px-4'>
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
                        className='block text-sm font-semibold uppercase tracking-wider'
                        style={{ color: primaryColor }}
                    >
                        Screenshots
                    </motion.span>
                    <motion.h2
                        variants={landingFadeUp}
                        custom={reduce}
                        className='mt-4 mb-6 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl lg:text-5xl'
                    >
                        {t('landing.screenshots.title')}
                    </motion.h2>
                    <motion.p variants={landingFadeUp} custom={reduce} className='text-lg text-slate-600'>
                        {t('landing.screenshots.subtitle')}
                    </motion.p>
                </motion.div>

                {screenshots.length > 0 ? (
                    <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
                        {screenshots.map((screenshot, index) => (
                            <motion.article
                                key={index}
                                initial={reduce ? false : { opacity: 0, y: 14 }}
                                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                                viewport={LANDING_VIEWPORT}
                                transition={landingRevealTransition(reduce, index)}
                                className='landing-card-depth group overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm'
                                style={{
                                    borderColor: 'rgba(15, 23, 42, 0.08)',
                                }}
                            >
                                <div className='aspect-video overflow-hidden bg-slate-100'>
                                    {screenshot.src ? (
                                        <img
                                            src={getImageUrl(screenshot.src)}
                                            alt={screenshot.alt}
                                            className='h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out motion-safe:group-hover:scale-[1.02]'
                                            loading='lazy'
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                const nextSibling = e.currentTarget.nextElementSibling as HTMLElement | null;
                                                if (nextSibling) {
                                                    nextSibling.style.display = 'flex';
                                                }
                                            }}
                                        />
                                    ) : null}
                                    <div
                                        className='flex h-full w-full items-center justify-center text-slate-400'
                                        style={{ display: screenshot.src ? 'none' : 'flex' }}
                                    >
                                        <Monitor className='h-12 w-12' />
                                    </div>
                                </div>
                                <div className='p-6'>
                                    <h3 className='mb-2 text-lg font-semibold text-slate-900'>{screenshot.title}</h3>
                                    <p className='text-sm leading-relaxed text-slate-600'>{screenshot.description}</p>
                                </div>
                            </motion.article>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        className='py-12 text-center'
                        initial={reduce ? false : { opacity: 0, y: 12 }}
                        whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                        viewport={LANDING_VIEWPORT}
                        transition={landingRevealTransition(reduce, 0)}
                    >
                        <div className='mb-4 text-slate-400'>
                            <Monitor className='mx-auto h-16 w-16' />
                        </div>
                        <p className='text-slate-500'>{t('No screenshots configured yet. Add some in the admin settings.')}</p>
                    </motion.div>
                )}
            </div>
        </section>
    );
}
