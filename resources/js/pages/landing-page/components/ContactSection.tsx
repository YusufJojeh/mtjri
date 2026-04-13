import React from 'react';
import { useForm } from '@inertiajs/react';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { PUBLIC_BRAND_PRIMARY } from '@/lib/public-brand';
import { LANDING_VIEWPORT, landingContainer, landingFadeUp, landingRevealTransition } from '../lib/landing-motion';

interface ContactSectionProps {
  brandColor?: string;
  flash?: {
    success?: string;
    error?: string;
  };
  settings?: {
    contact_email?: string;
    contact_phone?: string;
    contact_address?: string;
  };
}

export default function ContactSection({ flash, settings, brandColor = PUBLIC_BRAND_PRIMARY }: ContactSectionProps) {
  const { t } = useTranslation();
  const reduce = useReducedMotion() ?? false;
  
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('landing-page.contact'), {
      onSuccess: () => {
        reset();
      }
    });
  };

  const contactInfo = [
    {
      icon: Mail,
      title: t('Email Us'),
      content: settings?.contact_email || 'support@Store.com',
      description: t('Send us an email anytime!')
    },
    {
      icon: Phone,
      title: t('Call Us'),
      content: settings?.contact_phone || '+1 (555) 123-4567',
      description: t('Mon-Fri from 8am to 5pm')
    },
    {
      icon: MapPin,
      title: t('Visit Us'),
      content: settings?.contact_address || '123 Business Ave, Suite 100',
      description: t('Visit our office location')
    }
  ].filter(info => info.content); // Only show items that have content

  return (
    <section id='contact' className='relative isolate overflow-hidden bg-slate-50/80 py-12 backdrop-blur-sm sm:py-16 lg:py-20'>
      <div className='landing-page-ambient-top' aria-hidden />
      <div className='relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <motion.div
          className='mb-8 text-center sm:mb-12 lg:mb-16'
          initial='hidden'
          whileInView='visible'
          viewport={LANDING_VIEWPORT}
          variants={landingContainer}
          custom={reduce}
        >
          <motion.h2 variants={landingFadeUp} custom={reduce} className='mb-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl'>
            {t('landing.contact.title')}
          </motion.h2>
          <motion.p variants={landingFadeUp} custom={reduce} className='mx-auto max-w-3xl text-lg font-medium leading-relaxed text-slate-600'>
            {t('landing.contact.subtitle')}
          </motion.p>
        </motion.div>

        <div className='grid gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-16'>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={LANDING_VIEWPORT}
            transition={landingRevealTransition(reduce, 0)}
          >
            <div className='landing-card-depth rounded-xl border border-slate-200/90 bg-white p-8 shadow-sm'>
              <h3 className='text-2xl font-bold text-gray-900 mb-6'>
                {t('landing.contact.formTitle')}
              </h3>

              {flash?.success && (
                <div className='bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle className='w-5 h-5' />
                    <span>{flash.success}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className='space-y-6' role='form' aria-label='Contact form'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6'>
                  <div>
                    <label htmlFor='name' className='block text-sm font-medium text-gray-700 mb-2'>
                      {t('Full Name')} <span className='text-red-500' aria-label='required'>*</span>
                    </label>
                    <input
                      type='text'
                      id='name'
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed'
                      style={{ '--tw-ring-color': brandColor } as React.CSSProperties}
                      placeholder={t('Your full name')}
                      required
                      disabled={processing}
                    />
                    {errors.name && (
                      <p className='text-red-600 text-sm mt-1'>{errors.name}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-2'>
                      {t('Email Address')} <span className='text-red-500' aria-label='required'>*</span>
                    </label>
                    <input
                      type='email'
                      id='email'
                      value={data.email}
                      onChange={(e) => setData('email', e.target.value)}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed'
                      style={{ '--tw-ring-color': brandColor } as React.CSSProperties}
                      placeholder={t('your@email.com')}
                      required
                      disabled={processing}
                    />
                    {errors.email && (
                      <p className='text-red-600 text-sm mt-1'>{errors.email}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor='subject' className='block text-sm font-medium text-gray-700 mb-2'>
                    {t('Subject')} <span className='text-red-500' aria-label='required'>*</span>
                  </label>
                  <input
                    type='text'
                    id='subject'
                    value={data.subject}
                    onChange={(e) => setData('subject', e.target.value)}
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed'
                    style={{ '--tw-ring-color': brandColor } as React.CSSProperties}
                    placeholder={t("What's this about?")}
                    required
                    disabled={processing}
                  />
                  {errors.subject && (
                    <p className='text-red-600 text-sm mt-1'>{errors.subject}</p>
                  )}
                </div>

                <div>
                  <label htmlFor='message' className='block text-sm font-medium text-gray-700 mb-2'>
                    {t('Message')} <span className='text-red-500' aria-label='required'>*</span>
                  </label>
                  <textarea
                    id='message'
                    rows={6}
                    value={data.message}
                    onChange={(e) => setData('message', e.target.value)}
                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed'
                    style={{ '--tw-ring-color': brandColor } as React.CSSProperties}
                    placeholder={t('Tell us more about your inquiry...')}
                    required
                    disabled={processing}
                  />
                  {errors.message && (
                    <p className='text-red-600 text-sm mt-1'>{errors.message}</p>
                  )}
                </div>

                <button
                  type='submit'
                  disabled={processing}
                  className='landing-cta-depth landing-cta-primary flex w-full items-center justify-center gap-2 rounded-lg px-8 py-4 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50'
                  style={{ backgroundColor: brandColor }}
                  aria-label={processing ? t('Sending message') : t('Send contact message')}
                >
                  {processing ? (
                    <>
                      <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                      {t('Sending...')}
                    </>
                  ) : (
                    <>
                      <Send className='w-5 h-5' />
                      {t('Send Message')}
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={LANDING_VIEWPORT}
            transition={landingRevealTransition(reduce, 1)}
          >
            <div className='landing-card-depth space-y-8 rounded-xl border border-slate-200/90 bg-white/90 p-8 shadow-sm'>
              <div>
                <h3 className='mb-6 text-2xl font-bold text-gray-900'>{t('landing.contact.infoTitle')}</h3>
                <p className='mb-8 text-gray-600'>{t('landing.contact.infoDescription')}</p>
              </div>

              <div className='space-y-8'>
                {contactInfo.map((info, index) => {
                  const IconComponent = info.icon;
                  return (
                    <div key={index} className='flex items-start gap-4 border-b border-slate-100 pb-8 last:border-b-0 last:pb-0'>
                      <div
                        className='flex h-12 w-12 shrink-0 items-center justify-center rounded-lg'
                        style={{ backgroundColor: `${brandColor}15` }}
                      >
                        <IconComponent className='h-6 w-6' style={{ color: brandColor }} />
                      </div>
                      <div>
                        <h4 className='mb-1 text-lg font-semibold text-gray-900'>{info.title}</h4>
                        <p className='mb-1 font-medium text-gray-900'>{info.content}</p>
                        <p className='text-sm text-gray-600'>{info.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
