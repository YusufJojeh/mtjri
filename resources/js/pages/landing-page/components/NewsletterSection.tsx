import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Mail, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NewsletterSectionProps {
  brandColor?: string;
  flash?: {
    success?: string;
    error?: string;
  };
  settings?: any;
}

export default function NewsletterSection({ flash, settings, brandColor = '#3b82f6' }: NewsletterSectionProps) {
  const { t } = useTranslation();
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const { data, setData, post, processing, errors, reset } = useForm({
    email: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('landing-page.subscribe'), {
      onSuccess: () => {
        setIsSubmitted(true);
        reset();
        setTimeout(() => setIsSubmitted(false), 3000);
      }
    });
  };

  return (
    <section className='py-20 md:py-32 bg-gray-50'>
      <div className='container mx-auto px-4'>
        {/* Section Header */}
        <div className='text-center max-w-3xl mx-auto mb-16'>
          <h2 className='text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6'>
            {t('landing.newsletter.title')}
          </h2>
          <p className='text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed' id='newsletter-description'>
            {t('landing.newsletter.subtitle')}
          </p>
        </div>

        {/* Newsletter Form */}
        <div className='max-w-6xl mx-auto'>
          {flash?.success && (
            <div className='bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6'>
              <div className='flex items-center gap-2'>
                <CheckCircle className='w-5 h-5' />
                <span>{flash.success}</span>
              </div>
            </div>
          )}

          {isSubmitted && !flash?.success && (
            <div className='bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6'>
              <div className='flex items-center gap-2'>
                <CheckCircle className='w-5 h-5' />
                <span>{t('Thank you for subscribing!')}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className='text-center mb-16  max-w-2xl mx-auto'>
            <div className='flex flex-col sm:flex-row gap-4 mb-4'>
              <div className='flex-1'>
                <input
                  type='email'
                  value={data.email}
                  onChange={(e) => setData('email', e.target.value)}
                  placeholder={t('landing.newsletter.enterEmail')}
                  className='w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors'
                  style={{ 
                    '--tw-ring-color': brandColor,
                    focusRingColor: brandColor
                  } as React.CSSProperties}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = brandColor;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '';
                  }}
                  required
                  disabled={processing}
                  aria-label='Email address for newsletter subscription'
                  aria-describedby='newsletter-description'
                />
                {errors.email && (
                  <p className='text-red-600 text-sm mt-1 text-left'>{errors.email}</p>
                )}
              </div>
              <button
                type='submit'
                disabled={processing}
                className='text-white px-8 py-3 rounded-lg transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px] hover:opacity-90'
                style={{ backgroundColor: brandColor }}
                aria-label={processing ? t('Subscribing to newsletter') : t('Subscribe to newsletter')}
              >
                {processing && (
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                )}
                {processing ? t('landing.newsletter.subscribing') : t('landing.newsletter.subscribe')}
              </button>
            </div>
            
            <p className='text-gray-500 text-sm'>
              {t('landing.newsletter.privacyText')}
            </p>
          </form>

          {/* Benefits - Removed dynamic content */}
        </div>
      </div>
    </section>
  );
}