import React from 'react';
import { Star, Quote } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getImageUrl } from '@/utils/image-helper';
import { PUBLIC_BRAND_ACCENT, PUBLIC_BRAND_PRIMARY, PUBLIC_BRAND_SECONDARY } from '@/lib/public-brand';
import { sanitizeLandingHex } from '../lib/landing-brand';
import { LANDING_VIEWPORT, landingContainer, landingFadeUp, landingRevealTransition } from '../lib/landing-motion';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company?: string;
  content: string;
  avatar?: string;
  rating: number;
}

const DEFAULT_TESTIMONIALS = [
  {
    id: 1,
    name: 'Alex Thompson',
    role: 'Store Owner',
    company: 'Fashion Hub',
    content: 'Tijraa has revolutionized how I manage my multiple online stores. The multi-store dashboard is a game-changer!',
    rating: 5,
  },
  {
    id: 2,
    name: 'Maria Garcia',
    role: 'E-commerce Manager',
    company: 'Electronics Plus',
    content: 'The analytics and inventory management features help me track my sales ROI across all stores. Highly recommend for any merchant.',
    rating: 5,
  },
  {
    id: 3,
    name: 'James Wilson',
    role: 'Entrepreneur',
    company: 'Home Decor Co.',
    content: 'Clean, professional, and incredibly easy to use. My customers love the seamless shopping experience across all my stores.',
    rating: 5,
  },
];

interface TestimonialsSectionProps {
  brandColor?: string;
  testimonials: Testimonial[];
  settings?: any;
}

export default function TestimonialsSection({ testimonials, settings, brandColor = PUBLIC_BRAND_PRIMARY }: TestimonialsSectionProps) {
  const { t } = useTranslation();
  const reduce = useReducedMotion() ?? false;

  const colors = settings?.config_sections?.colors || {
    primary: brandColor,
    secondary: PUBLIC_BRAND_SECONDARY,
    accent: PUBLIC_BRAND_ACCENT,
  };
  const primaryColor = sanitizeLandingHex(colors.primary, brandColor);
  const accentColor = sanitizeLandingHex(colors.accent, PUBLIC_BRAND_ACCENT);

  const settingsTestimonials =
    settings?.config_sections?.sections
      ?.find((section: any) => section.key === 'testimonials')
      ?.testimonials?.map((testimonial: any, index: number) => ({
        id: index + 1,
        name: testimonial.name,
        role: testimonial.role,
        company: testimonial.company,
        content: testimonial.content,
        rating: testimonial.rating || 5,
        avatar: testimonial.avatar,
      })) || [];

  const defaultTestimonials: Testimonial[] = DEFAULT_TESTIMONIALS;
  const displayTestimonials =
    settingsTestimonials.length > 0 ? settingsTestimonials : testimonials.length > 0 ? testimonials : defaultTestimonials;

  const renderStars = (rating: number) =>
    Array.from({ length: rating }, (_, index) => (
      <Star key={index} className='h-4 w-4 fill-current' style={{ color: accentColor }} />
    ));

  return (
    <section id='testimonials' className='bg-slate-50 py-20 md:py-32'>
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
            Testimonials
          </motion.span>
          <motion.h2 variants={landingFadeUp} custom={reduce} className='mt-4 text-3xl font-bold text-slate-900 md:text-4xl lg:text-5xl'>
            {t('landing.testimonials.title')}
          </motion.h2>
          <motion.p variants={landingFadeUp} custom={reduce} className='mt-4 text-lg text-slate-600'>
            {t('landing.testimonials.subtitle')}
          </motion.p>
        </motion.div>

        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {displayTestimonials.map((testimonial: Testimonial, i: number) => (
            <motion.article
              key={testimonial.id}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={LANDING_VIEWPORT}
              transition={landingRevealTransition(reduce, i)}
              className='landing-card-depth rounded-xl border border-slate-200/90 bg-white p-6'
            >
              <Quote className='mb-4 h-10 w-10' style={{ color: `${primaryColor}33` }} />

              <div className='mb-4 flex gap-1'>{renderStars(testimonial.rating)}</div>

              <p className='mb-6 leading-relaxed text-slate-900'>&apos;{testimonial.content}&apos;</p>

              <div className='flex items-center gap-3'>
                <div
                  className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full'
                  style={{ backgroundColor: `${primaryColor}12` }}
                >
                  {testimonial.avatar ? (
                    <img
                      src={getImageUrl(testimonial.avatar)}
                      alt={testimonial.name}
                      className='h-12 w-12 rounded-full object-cover'
                    />
                  ) : (
                    <span className='font-semibold' style={{ color: primaryColor }}>
                      {testimonial.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <p className='font-semibold text-slate-900'>{testimonial.name}</p>
                  <p className='text-sm text-slate-600'>
                    {testimonial.role}
                    {testimonial.company && `, ${testimonial.company}`}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
