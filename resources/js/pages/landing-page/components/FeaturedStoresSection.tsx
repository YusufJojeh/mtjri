import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getImageUrl } from '@/utils/image-helper';

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

export default function FeaturedStoresSection({
    stores,
    settings,
    brandColor = '#1E90FF',
}: FeaturedStoresSectionProps) {
    const { t } = useTranslation();
    const reduce = useReducedMotion() ?? false;

    const colors = settings?.config_sections?.colors || { primary: brandColor, secondary: '#1578D8', accent: '#FFC107' };
    const primaryColor = sanitizeLandingHex(colors.primary, brandColor);

    if (!stores.length) {
        return null;
    }

    return (
        <section id="featured-stores" className="relative overflow-hidden py-20 sm:py-24 lg:py-28">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: `radial-gradient(circle at 12% 22%, ${primaryColor}10, transparent 24%), linear-gradient(180deg, rgba(255,255,255,1), rgba(248,250,252,0.95))`,
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
                        {t('landing.featuredStores.badge', 'Live merchants')}
                    </motion.span>
                    <motion.h2
                        variants={landingFadeUp}
                        custom={reduce}
                        className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl"
                    >
                        {t('landing.v2.featuredStores.title', 'The product can also prove itself through active storefronts')}
                    </motion.h2>
                    <motion.p
                        variants={landingFadeUp}
                        custom={reduce}
                        className="mt-5 text-lg leading-relaxed text-slate-600"
                    >
                        {t(
                            'landing.v2.featuredStores.subtitle',
                            'When featured stores are available, they work better as restrained proof cards than as decorative logos with no context.',
                        )}
                    </motion.p>
                </motion.div>

                <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {stores.map((store, index) => (
                        <motion.article
                            key={store.id}
                            initial={reduce ? false : { opacity: 0, y: 18 }}
                            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                            viewport={LANDING_VIEWPORT}
                            transition={landingRevealTransition(reduce, index)}
                            className="landing-card-depth group rounded-[1.75rem] border border-slate-200/80 bg-white/92 p-6 shadow-sm"
                        >
                            <div className="flex items-start gap-4">
                                {store.logo ? (
                                    <img
                                        src={getImageUrl(store.logo)}
                                        alt={store.name}
                                        className="h-14 w-14 shrink-0 rounded-2xl border border-slate-200 object-cover"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                ) : (
                                    <div
                                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50"
                                        style={{ color: primaryColor }}
                                    >
                                        <Store className="h-7 w-7" aria-hidden />
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <h3 className="truncate text-xl font-semibold tracking-tight text-slate-950">{store.name}</h3>
                                    <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-slate-600">
                                        {store.description || t('landing.v2.featuredStores.defaultDescription', 'Storefront running on MTJRii')}
                                    </p>
                                </div>
                            </div>

                            <a
                                href={`/store/${store.slug}`}
                                className="landing-cta-depth mt-6 inline-flex items-center gap-2 rounded-2xl border border-[var(--primary-color)] bg-[var(--primary-color)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                            >
                                {t('landing.featuredStores.visitCta', 'Visit store')}
                                <ArrowUpRight className="h-4 w-4" aria-hidden />
                            </a>
                        </motion.article>
                    ))}
                </div>
            </div>
        </section>
    );
}
