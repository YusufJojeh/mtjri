import React, { useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { LANDING_VIEWPORT, landingContainer, landingFadeUp, landingRevealTransition } from '../lib/landing-motion';
import { sanitizeLandingHex } from '../lib/landing-brand';

// Simple encryption function for plan ID
const encryptPlanId = (planId: number): string => {
  const key = 'Store2025';
  const str = planId.toString();
  let encrypted = '';
  for (let i = 0; i < str.length; i++) {
    encrypted += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(encrypted);
};

interface Plan {
  stats?: Record<string, number | string>;
  id: number;
  name: string;
  description: string;
  price: number;
  yearly_price?: number;
  duration: string;
  features?: string[];
  is_popular?: boolean;
  is_plan_enable: string;
}

interface PlansSectionProps {
  brandColor?: string;
  plans: Plan[];
  settings?: any;
}

function PlansSection({ plans, settings, brandColor = '#3b82f6' }: PlansSectionProps) {
  const { t } = useTranslation();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const reduce = useReducedMotion() ?? false;

  const colors = settings?.config_sections?.colors || { primary: brandColor, secondary: '#059669', accent: '#065f46' };
  const primaryColor = sanitizeLandingHex(colors.primary, brandColor);
  const secondaryColor = sanitizeLandingHex(colors.secondary, '#059669');
  const accentColor = sanitizeLandingHex(colors.accent, '#065f46');

  // Filter enabled plans based on billing cycle and duration
  const enabledPlans = plans.filter(plan => {
    if (plan.is_plan_enable !== 'on') return false;
    
    // Filter by duration
    const billingType = billingCycle === 'yearly' ? 'yearly' : 'monthly';
    return plan.duration === billingType || plan.duration === 'both';
  });

  // Default plans if none provided
  const defaultPlans = [
    {
      id: 1,
      name: 'Starter',
      description: 'Perfect for individuals getting started with digital networking',
      price: 0,
      yearly_price: 0,
      duration: 'month',
      features: [
        '1 Digital Business Card',
        'Basic QR Code',
        'Contact Form',
        'Basic Analytics',
        'Email Support'
      ],
      is_popular: false,
      is_plan_enable: 'on'
    },
    {
      id: 2,
      name: 'Professional',
      description: 'Ideal for professionals and small businesses',
      price: 13,
      yearly_price: 190,
      duration: 'month',
      features: [
        '5 Digital Business Cards',
        'Custom QR Codes',
        'NFC Support',
        'Advanced Analytics',
        'Custom Branding',
        'Priority Support',
        'Lead Capture'
      ],
      is_popular: true,
      is_plan_enable: 'on'
    },
    {
      id: 3,
      name: 'Enterprise',
      description: 'For teams and large organizations',
      price: 49,
      yearly_price: 490,
      duration: 'month',
      features: [
        'Unlimited Digital Cards',
        'Team Management',
        'Custom Domain',
        'White Label Solution',
        'API Access',
        'Dedicated Support',
        'Advanced Integrations',
        'Custom Features'
      ],
      is_popular: false,
      is_plan_enable: 'on'
    }
  ];

  const displayPlans = enabledPlans.length > 0 ? enabledPlans : defaultPlans;

  const formatCurrency = (amount: string | number) => {
    if (typeof window !== 'undefined' && window.appSettings?.formatCurrency) {
      // Use numeric value if available, otherwise parse the string
      const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount);
      return window.appSettings.formatCurrency(numericAmount, { showSymbol: true });
    }
    // Fallback if appSettings is not available
    return amount;
  };
  
  const getPrice = React.useCallback((plan: Plan) => {
    if (billingCycle === 'yearly' && plan.yearly_price !== undefined) {
      return plan.yearly_price;
    }
    return plan.price;
  }, [billingCycle]);


  return (
    <section id='pricing' className='bg-gradient-to-b from-white via-slate-50/40 to-white py-12 sm:py-16 lg:py-20'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        <motion.div
          className='mb-8 text-center sm:mb-12 lg:mb-16'
          initial='hidden'
          whileInView='visible'
          viewport={LANDING_VIEWPORT}
          variants={landingContainer}
          custom={reduce}
        >
          <motion.h2
            variants={landingFadeUp}
            custom={reduce}
            className='mb-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl'
          >
            {t('landing.pricing.title')}
          </motion.h2>
          <motion.p
            variants={landingFadeUp}
            custom={reduce}
            className='mx-auto mb-8 max-w-3xl text-lg font-medium leading-relaxed text-slate-600'
          >
            {t('landing.pricing.subtitle')}
          </motion.p>

          <motion.div variants={landingFadeUp} custom={reduce} className='flex items-center justify-center gap-4'>
            <span className={`text-sm ${billingCycle === 'monthly' ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
              {t('landing.pricing.monthly')}
            </span>
            <button
              type='button'
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className='relative inline-flex h-6 w-11 items-center rounded-full transition-colors motion-reduce:transition-none'
              style={{ backgroundColor: billingCycle === 'yearly' ? primaryColor : '#e5e7eb' }}
              aria-pressed={billingCycle === 'yearly'}
              aria-label={t('landing.pricing.yearly')}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white motion-safe:transition-transform motion-safe:duration-300 ${
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${billingCycle === 'yearly' ? 'font-semibold text-slate-900' : 'text-slate-500'}`}>
              {t('landing.pricing.yearly')}
            </span>
          </motion.div>
        </motion.div>

        <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
          {displayPlans.map((plan, planIndex) => (
            <motion.div
              key={plan.id}
              className={`landing-pricing-lift group relative flex h-full flex-col ${plan.is_popular ? 'z-10' : ''}`}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={LANDING_VIEWPORT}
              transition={landingRevealTransition(reduce, planIndex)}
            >
              {/* Card with decorative elements */}
              <div
                className='absolute inset-0 overflow-hidden rounded-2xl border shadow-lg transition-shadow duration-300 motion-reduce:transition-none group-hover:shadow-xl'
                style={{
                  background: plan.is_popular
                    ? `linear-gradient(to bottom right, ${primaryColor}18, ${primaryColor}0a, transparent)`
                    : 'linear-gradient(to bottom right, rgb(243 244 246 / 0.8), rgb(249 250 251 / 0.5), transparent)',
                  borderColor: plan.is_popular ? `${primaryColor}28` : 'rgb(229 231 235 / 0.8)',
                  boxShadow: plan.is_popular ? `0 0 0 1px color-mix(in srgb, ${primaryColor} 35%, transparent), 0 12px 40px -24px color-mix(in srgb, ${primaryColor} 20%, transparent)` : undefined,
                }}
              >
                {/* Decorative background elements */}
                <div 
                  className='absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 opacity-70'
                  style={{ background: `linear-gradient(to bottom right, ${primaryColor}10, transparent)` }}
                ></div>
                <div 
                  className='absolute bottom-0 left-0 w-24 h-24 rounded-full -ml-12 -mb-12 opacity-50'
                  style={{ background: `linear-gradient(to top right, ${primaryColor}10, transparent)` }}
                ></div>
              </div>
              
              {/* Recommended indicator */}
              {plan.is_popular && (
                <div className='absolute -top-4 left-0 right-0 flex justify-center z-20'>
                  <div 
                    className='text-white px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 text-sm font-medium'
                    style={{ backgroundColor: accentColor }}
                  >
                    <Check className='h-4 w-4' />
                    {t('landing.pricing.recommended')}
                  </div>
                </div>
              )}
              
              {/* Content container */}
              <div className='relative z-10 flex flex-col h-full p-6 pt-8'>
                {/* Plan header */}
                <div className='mb-6'>
                  <h3 
                    className='text-2xl font-bold mb-2'
                    style={{ color: plan.is_popular ? primaryColor : 'inherit' }}
                  >
                    {plan.name}
                  </h3>
                  <div className='flex items-baseline gap-1.5 mb-3'>
                    <span 
                      className='text-3xl font-extrabold'
                      style={{ color: plan.is_popular ? primaryColor : 'inherit' }}
                    >
                      {getPrice(plan) === 0 ? formatCurrency(0) : formatCurrency(getPrice(plan))}
                    </span>
                    <span className='text-muted-foreground text-sm'>
                      /{billingCycle === 'yearly' ? 'year' : 'month'}
                    </span>
                  </div>
                  <p className='text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3'>
                    {plan.description}
                  </p>

                </div>
                
                {/* Divider with icon */}
                <div className='relative flex items-center my-4'>
                  <div className='flex-grow border-t border-gray-200'></div>
                  <div 
                    className='mx-3 p-1.5 rounded-full'
                    style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
                  >
                    <Check className='h-4 w-4' />
                  </div>
                  <div className='flex-grow border-t border-gray-200'></div>
                </div>
                
                {/* Usage limits */}
                <div className='mb-4'>
                  <h4 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3'>
                    {t('landing.pricing.usageLimits')}
                  </h4>
                  <div className='grid grid-cols-2 gap-2'>
                    <div className='bg-white/50 rounded-lg p-2 text-center'>
                      <div className='text-lg font-bold' style={{ color: primaryColor }}>{plan.stats?.businesses || 'N/A'}</div>
                      <div className='text-xs text-muted-foreground'>{t('landing.pricing.businesses')}</div>
                    </div>
                    <div className='bg-white/50 rounded-lg p-2 text-center'>
                      <div className='text-lg font-bold' style={{ color: primaryColor }}>{plan.stats?.users || 'N/A'}</div>
                      <div className='text-xs text-muted-foreground'>{t('landing.pricing.users')}</div>
                    </div>
                    <div className='bg-white/50 rounded-lg p-2 text-center'>
                      <div className='text-lg font-bold' style={{ color: primaryColor }}>{plan.stats?.storage || 'N/A'}</div>
                      <div className='text-xs text-muted-foreground'>{t('landing.pricing.storage')}</div>
                    </div>
                    <div className='bg-white/50 rounded-lg p-2 text-center'>
                      <div className='text-lg font-bold' style={{ color: primaryColor }}>{plan.stats?.templates || '34'}</div>
                      <div className='text-xs text-muted-foreground'>{t('landing.pricing.templates')}</div>
                    </div>
                    <div className='bg-white/50 rounded-lg p-2 text-center'>
                      <div className='text-lg font-bold' style={{ color: primaryColor }}>{plan.stats?.bio_links || 'N/A'}</div>
                      <div className='text-xs text-muted-foreground'>{t('landing.pricing.bioLinks')}</div>
                    </div>
                    <div className='bg-white/50 rounded-lg p-2 text-center'>
                      <div className='text-lg font-bold' style={{ color: primaryColor }}>{plan.stats?.bio_links_templates || '14'}</div>
                      <div className='text-xs text-muted-foreground'>{t('landing.pricing.bioTemplates')}</div>
                    </div>
                  </div>
                </div>
                
                {/* Features */}
                <div className='mb-6 flex-1'>
                  <h4 className='text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3'>
                    {t('landing.pricing.features')}
                  </h4>
                  <ul className='space-y-2.5'>
                    {(plan.features || []).map((feature, index) => {
                      // Handle template sections with count display
                      const displayFeature = feature.startsWith('Template Sections') ? feature : feature;
                      return (
                        <li key={index} className='flex items-center gap-3'>
                          <div 
                            className='flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center'
                            style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
                          >
                            <Check className='h-3.5 w-3.5' />
                          </div>
                          <span className='text-sm font-medium'>
                            {displayFeature}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                
                {/* Actions */}
                <div className='mt-auto pt-4 border-t border-gray-200'>
                  <Link
                    href={route('register', { plan: encryptPlanId(plan.id) })}
                    className={`landing-cta-depth block w-full rounded-lg px-6 py-3 text-center font-semibold transition-colors ${
                      plan.is_popular ? 'landing-cta-primary text-white' : ''
                    }`}
                    style={{
                      backgroundColor: plan.is_popular ? primaryColor : '#f3f4f6',
                      color: plan.is_popular ? 'white' : '#111827',
                    }}
                    onMouseEnter={(e) => {
                      if (plan.is_popular) {
                        e.currentTarget.style.backgroundColor = secondaryColor;
                      } else {
                        e.currentTarget.style.backgroundColor = '#e5e7eb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = plan.is_popular ? primaryColor : '#f3f4f6';
                    }}
                  >
                    {plan.price === 0 ? t('landing.pricing.startFree') : t('landing.pricing.getStarted')}
                    <ArrowRight className='w-4 h-4 inline-block ml-2' />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ Link - Removed dynamic content */}
      </div>
    </section>
  );
}

export default PlansSection;