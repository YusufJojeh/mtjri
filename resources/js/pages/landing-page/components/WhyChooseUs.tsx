import React from 'react';
import { CheckCircle, Clock, Users, Zap, Star, Shield, Heart, Award } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { PUBLIC_BRAND_PRIMARY, PUBLIC_BRAND_SECONDARY } from '@/lib/public-brand';
import { sanitizeLandingHex } from '../lib/landing-brand';
import { LANDING_VIEWPORT, landingContainer, landingFadeUp, landingRevealTransition } from '../lib/landing-motion';

interface WhyChooseUsProps {
  brandColor?: string;
  settings: any;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  clock: Clock,
  users: Users,
  zap: Zap,
  'check-circle': CheckCircle,
  star: Star,
  shield: Shield,
  heart: Heart,
  award: Award,
};

export default function WhyChooseUs({ settings, brandColor = PUBLIC_BRAND_PRIMARY }: WhyChooseUsProps) {
  const { t, i18n } = useTranslation();
  const reduce = useReducedMotion() ?? false;

  const colors = settings?.config_sections?.colors || {
    primary: brandColor,
    secondary: PUBLIC_BRAND_SECONDARY,
  };
  const primaryColor = sanitizeLandingHex(colors.primary, brandColor);
  const secondaryColor = sanitizeLandingHex(colors.secondary, PUBLIC_BRAND_SECONDARY);

  const reasons = React.useMemo(
    () => [
      {
        icon: 'clock',
        title: t('landing.whyChooseUs.multiStore.title'),
        description: t('landing.whyChooseUs.multiStore.description'),
      },
      {
        icon: 'users',
        title: t('landing.whyChooseUs.noFees.title'),
        description: t('landing.whyChooseUs.noFees.description'),
      },
    ],
    [t, i18n.language],
  );

  const stats = React.useMemo(
    () => [
      { value: t('landing.hero.stats.users.value'), label: t('landing.hero.stats.users.label'), color: primaryColor },
      {
        value: t('landing.hero.stats.satisfaction.value'),
        label: t('landing.hero.stats.satisfaction.label'),
        color: secondaryColor,
      },
    ],
    [t, i18n.language, primaryColor, secondaryColor],
  );

  return (
    <section className='bg-slate-50 py-16 md:py-24'>
      <div className='container mx-auto px-4'>
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
            className='block text-sm font-semibold uppercase tracking-[0.18em]'
            style={{ color: primaryColor }}
          >
            {t('landing.whyChooseUs.badge')}
          </motion.span>
          <motion.h2 variants={landingFadeUp} custom={reduce} className='mt-4 text-3xl font-bold text-slate-900 md:text-4xl lg:text-5xl'>
            {t('landing.whyChooseUs.title')}
          </motion.h2>
          <motion.p variants={landingFadeUp} custom={reduce} className='mt-4 text-lg text-slate-600'>
            {t('landing.whyChooseUs.subtitle')}
          </motion.p>
        </motion.div>

        <div className='mx-auto grid max-w-7xl items-start gap-8 lg:grid-cols-2 lg:gap-12'>
          <div className='space-y-6'>
            {reasons.map((reason, index) => {
              const IconComponent = iconMap[reason.icon] || Clock;
              return (
                <motion.div
                  key={reason.title}
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={LANDING_VIEWPORT}
                  transition={landingRevealTransition(reduce, index)}
                  className='landing-card-depth group rounded-xl border border-slate-200/90 bg-white p-6'
                >
                  <div className='flex items-start gap-4'>
                    <div
                      className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg transition-colors duration-300 group-hover:bg-slate-50'
                      style={{ backgroundColor: `${primaryColor}12` }}
                    >
                      <IconComponent className='h-6 w-6' style={{ color: primaryColor }} />
                    </div>
                    <div className='min-w-0 flex-1'>
                      <h3 className='text-lg font-semibold text-slate-900'>{reason.title}</h3>
                      <p className='mt-2 text-sm leading-relaxed text-slate-600'>{reason.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={LANDING_VIEWPORT}
            transition={landingRevealTransition(reduce, 2)}
            className='landing-card-depth rounded-xl border border-slate-200/90 bg-white p-8 shadow-sm'
          >
            <div className='mb-8 text-center'>
              <h3 className='text-2xl font-bold text-slate-900'>{t('landing.whyChooseUs.trustedBy')}</h3>
              <p className='mt-2 text-slate-600'>{t('landing.whyChooseUs.joinCommunity')}</p>
            </div>

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6'>
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className='landing-card-depth rounded-lg border border-slate-200/90 bg-slate-50/80 p-6 text-center'
                >
                  <div className='text-3xl font-bold tabular-nums md:text-4xl' style={{ color: stat.color }}>
                    {stat.value}
                  </div>
                  <div className='mt-2 text-sm font-medium text-slate-600'>{stat.label}</div>
                </div>
              ))}
            </div>

            <Link
              href={route('register')}
              className='landing-cta-depth landing-cta-primary mt-8 block rounded-lg p-6 text-center text-white'
              style={{ backgroundColor: primaryColor }}
            >
              <span className='block text-xl font-bold'>{t('landing.whyChooseUs.readyToStart')}</span>
              <span className='mt-2 block text-sm text-white/85'>{t('landing.whyChooseUs.joinThousands')}</span>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
