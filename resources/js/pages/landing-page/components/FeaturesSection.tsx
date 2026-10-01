import React from 'react';
import { ArrowRight, QrCode, Smartphone, Share2, BarChart3, Globe, Shield, Star, Zap, Users, Lock, Wifi, Heart, Layers, Clock } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import {
    LANDING_VIEWPORT,
    landingContainer,
    landingFadeUp,
    landingRevealTransition,
} from '../lib/landing-motion';
import { sanitizeLandingHex } from '../lib/landing-brand';

interface FeaturesSectionProps {
    brandColor?: string;
    settings: any;
}

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties; 'aria-hidden'?: boolean }>> = {
    'qr-code': QrCode,
    smartphone: Smartphone,
    'share-2': Share2,
    share2: Share2,
    hare: Share2,
    'bar-chart': BarChart3,
    globe: Globe,
    shield: Shield,
    hield: Shield,
    star: Star,
    tar: Star,
    zap: Zap,
    users: Users,
    lock: Lock,
    wifi: Wifi,
    heart: Heart,
    layers: Layers,
    clock: Clock,
};

export default function FeaturesSection({ settings, brandColor = '#3b82f6' }: FeaturesSectionProps) {
    const { t, i18n } = useTranslation();
    const reduce = useReducedMotion() ?? false;

    const colors = settings?.config_sections?.colors || { primary: brandColor, secondary: '#059669', accent: '#065f46' };
    const primaryColor = sanitizeLandingHex(colors.primary, brandColor);

    const features = React.useMemo(
        () => [
            {
                icon: 'bar-chart',
                title: t('landing.features.analytics.title'),
                description: t('landing.features.analytics.description'),
            },
            {
                icon: 'globe',
                title: t('landing.features.domains.title'),
                description: t('landing.features.domains.description'),
            },
            {
                icon: 'shield',
                title: t('landing.features.security.title'),
                description: t('landing.features.security.description'),
            },
        ],
        [t, i18n.language],
    );

    return (
        <section id='features' className='relative py-20 md:py-28 bg-gradient-to-b from-white via-slate-50/80 to-slate-50'>
            <div className='container mx-auto px-4'>
                <motion.div
                    className='mx-auto mb-14 max-w-3xl text-center md:mb-16'
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
                        {t('landing.features.badge')}
                    </motion.span>
                    <motion.h2
                        variants={landingFadeUp}
                        custom={reduce}
                        className='mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl lg:text-5xl'
                    >
                        {t('landing.features.title')}
                    </motion.h2>
                    <motion.p variants={landingFadeUp} custom={reduce} className='mt-4 text-lg text-slate-600'>
                        {t('landing.features.description')}
                    </motion.p>
                </motion.div>

                <div className='mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-2'>
                    {features.map((feature, index) => {
                        const IconComponent = iconMap[feature.icon] || QrCode;
                        const isLead = index === 0;
                        return (
                            <motion.article
                                key={feature.title}
                                role='article'
                                aria-labelledby={`feature-${index}-title`}
                                initial={reduce ? false : { opacity: 0, y: 14 }}
                                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                                viewport={LANDING_VIEWPORT}
                                transition={landingRevealTransition(reduce, index)}
                                className={`landing-card-depth group relative rounded-2xl border border-slate-200/90 bg-white shadow-sm ${
                                    isLead ? 'p-8 md:col-span-2 md:flex md:min-h-[12rem] md:items-start md:gap-10 md:p-10' : 'p-8'
                                }`}
                            >
                                <div
                                    className={`mb-5 flex shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 transition-colors duration-300 group-hover:bg-white ${
                                        isLead ? 'h-16 w-16 md:mb-0 md:h-[4.5rem] md:w-[4.5rem]' : 'h-14 w-14'
                                    }`}
                                    style={{ boxShadow: `0 0 0 1px color-mix(in srgb, ${primaryColor} 12%, transparent)` }}
                                >
                                    <IconComponent
                                        className={isLead ? 'h-9 w-9 md:h-10 md:w-10' : 'h-7 w-7'}
                                        style={{ color: primaryColor }}
                                        aria-hidden
                                    />
                                </div>
                                <div className='min-w-0 flex-1'>
                                    <h3
                                        className={`font-semibold text-slate-900 ${isLead ? 'text-xl md:text-2xl' : 'text-xl'}`}
                                        id={`feature-${index}-title`}
                                    >
                                        {feature.title}
                                    </h3>
                                    <p
                                        className={`mt-3 leading-relaxed text-slate-600 ${isLead ? 'max-w-2xl text-sm md:text-lg' : 'text-sm md:text-base'}`}
                                    >
                                        {feature.description}
                                    </p>
                                </div>
                                <div
                                    className='pointer-events-none absolute inset-x-8 bottom-0 h-px scale-x-0 opacity-0 transition duration-300 group-hover:scale-x-100 group-hover:opacity-100'
                                    style={{
                                        background: `linear-gradient(90deg, transparent, ${primaryColor}66, transparent)`,
                                    }}
                                />
                            </motion.article>
                        );
                    })}
                </div>

                <div className='mt-10 text-center'>
                    <Link
                        href={route('features')}
                        className='group inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
                        style={{ color: primaryColor }}
                    >
                        {t('public.landing.allFeatures')}
                        <ArrowRight className='public-arrow h-4 w-4 rtl:-scale-x-100' aria-hidden />
                    </Link>
                </div>
            </div>
        </section>
    );
}
