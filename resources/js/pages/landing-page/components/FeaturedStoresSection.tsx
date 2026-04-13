import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANDING_VIEWPORT, landingContainer, landingFadeUp, landingRevealTransition } from '../lib/landing-motion';
import { sanitizeLandingHex } from '../lib/landing-brand';

export interface FeaturedStore {
    id: number;
    name: string;
    description: string;
    slug: string;
    logo?: string;
}

interface FeaturedStoresSectionProps {
    stores: FeaturedStore[];
    brandColor?: string;
    settings: any;
}

export default function FeaturedStoresSection({ stores, settings, brandColor = '#10b981' }: FeaturedStoresSectionProps) {
    const { t } = useTranslation();
    const reduce = useReducedMotion() ?? false;
    const colors = settings?.config_sections?.colors || { primary: brandColor, secondary: '#059669', accent: '#065f46' };
    const primaryColor = sanitizeLandingHex(colors.primary, brandColor);

    if (!stores.length) return null;

    return (
        <section id='featured-stores' className='relative bg-gradient-to-b from-slate-50 to-white py-20 md:py-28'>
            <div className='container mx-auto px-4'>
                <motion.div
                    className='mx-auto mb-12 max-w-3xl text-center md:mb-16'
                    initial='hidden'
                    whileInView='visible'
                    viewport={LANDING_VIEWPORT}
                    variants={landingContainer}
                    custom={reduce}
                >
                    <motion.span
                        variants={landingFadeUp}
                        custom={reduce}
                        className='inline-block text-xs font-semibold uppercase tracking-[0.2em]'
                        style={{ color: primaryColor }}
                    >
                        {t('landing.featuredStores.badge')}
                    </motion.span>
                    <motion.h2 variants={landingFadeUp} custom={reduce} className='mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl'>
                        {t('landing.featuredStores.title')}
                    </motion.h2>
                    <motion.p variants={landingFadeUp} custom={reduce} className='mt-3 text-lg text-slate-600'>
                        {t('landing.featuredStores.subtitle')}
                    </motion.p>
                </motion.div>

                <div className='mx-auto grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
                    {stores.map((store, i) => (
                        <motion.article
                            key={store.id}
                            initial={reduce ? false : { opacity: 0, y: 14 }}
                            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                            viewport={LANDING_VIEWPORT}
                            transition={landingRevealTransition(reduce, i)}
                            className='landing-card-depth group relative flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm'
                        >
                            <div className='flex items-start gap-4'>
                                {store.logo ? (
                                    <img
                                        src={store.logo}
                                        alt={store.name}
                                        className='h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-slate-100'
                                    />
                                ) : (
                                    <div
                                        className='flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white'
                                        style={{ backgroundColor: primaryColor }}
                                        aria-hidden
                                    >
                                        {store.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className='min-w-0 flex-1'>
                                    <h3 className='truncate text-lg font-semibold text-slate-900'>{store.name}</h3>
                                    <p className='mt-1 line-clamp-3 text-sm leading-relaxed text-slate-600'>{store.description}</p>
                                </div>
                            </div>
                            <a
                                href={`/store/${store.slug}`}
                                className='landing-cta-primary landing-cta-depth mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none'
                                style={{ backgroundColor: primaryColor }}
                            >
                                {t('landing.featuredStores.visitCta')}
                                <ArrowUpRight
                                    className='h-4 w-4 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:translate-x-px'
                                    aria-hidden
                                />
                            </a>
                        </motion.article>
                    ))}
                </div>
            </div>
        </section>
    );
}
