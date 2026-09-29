import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import PublicMarketingShell from '@/components/public/PublicMarketingShell';
import { publicSectionContainer, publicSectionFade } from '@/lib/public-motion';

interface CustomPageNav {
  id: number;
  title: string;
  slug: string;
}

interface PageProps {
  [key: string]: unknown;
  settings: {
    company_name: string;
    contact_email?: string;
    contact_phone?: string;
    contact_address?: string;
    config_sections?: { colors?: { primary?: string; secondary?: string; accent?: string } };
    [key: string]: unknown;
  };
  customPages: CustomPageNav[];
}

export default function TermsPage() {
  const { settings, customPages } = usePage<PageProps>().props;
  const reduce = useReducedMotion() ?? false;
  const company = settings?.company_name || 'Tijraa';

  return (
    <>
      <Head>
        <title>Terms of Service - {company}</title>
        <meta name='description' content={`Terms of Service for ${company}`} />
      </Head>

      <PublicMarketingShell settings={settings} customPages={customPages}>
        <div className='relative isolate px-4 pb-20 pt-8 md:pt-12'>
          <div className='landing-page-ambient-top' aria-hidden />
          <div className='container relative mx-auto max-w-4xl'>
            <motion.div
              className='public-legal-hero mb-12 rounded-2xl border border-slate-200/80 bg-white/80 px-6 py-10 shadow-sm backdrop-blur-md md:px-10 md:py-12'
              initial='hidden'
              animate='visible'
              variants={publicSectionContainer}
              custom={reduce}
            >
              <motion.span
                variants={publicSectionFade}
                custom={reduce}
                className='block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500'
              >
                Legal
              </motion.span>
              <motion.h1
                variants={publicSectionFade}
                custom={reduce}
                className='mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl lg:text-5xl'
              >
                Terms of Service
              </motion.h1>
              <motion.p
                variants={publicSectionFade}
                custom={reduce}
                className='mt-4 text-lg text-slate-600'
              >
                Last updated:{' '}
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </motion.p>
            </motion.div>

            <div className='landing-card-depth rounded-2xl border border-slate-200/90 bg-white/90 p-8 shadow-sm backdrop-blur-sm md:p-12'>
              <div className='prose prose-lg max-w-none prose-headings:text-slate-900 prose-p:text-slate-600'>
                <section className='mb-10'>
                  <h2 className='text-2xl font-bold text-slate-900'>1. Acceptance of Terms</h2>
                  <p className='mt-4 leading-relaxed'>
                    By accessing and using {company}, you accept and agree to be bound by the terms and provision of
                    this agreement. If you do not agree to abide by the above, please do not use this service.
                  </p>
                </section>

                <section className='mb-10'>
                  <h2 className='text-2xl font-bold text-slate-900'>2. Use License</h2>
                  <p className='mt-4 leading-relaxed'>
                    Permission is granted to temporarily use our services for personal, non-commercial transitory
                    viewing only. This is the grant of a license, not a transfer of title, and under this license you
                    may not:
                  </p>
                  <ul className='mt-4 list-inside list-disc space-y-2 text-slate-600'>
                    <li>Modify or copy the materials</li>
                    <li>Use the materials for any commercial purpose</li>
                    <li>Attempt to decompile or reverse engineer any software</li>
                    <li>Remove any copyright or other proprietary notations</li>
                  </ul>
                </section>

                <section className='mb-10'>
                  <h2 className='text-2xl font-bold text-slate-900'>3. User Accounts</h2>
                  <p className='mt-4 leading-relaxed'>
                    When you create an account with us, you must provide information that is accurate, complete, and
                    current at all times. You are responsible for safeguarding the password and for all activities
                    that occur under your account.
                  </p>
                </section>

                <section className='mb-10'>
                  <h2 className='text-2xl font-bold text-slate-900'>4. Prohibited Uses</h2>
                  <p className='mt-4 leading-relaxed'>You may not use our service:</p>
                  <ul className='mt-4 list-inside list-disc space-y-2 text-slate-600'>
                    <li>In any way that violates any applicable law or regulation</li>
                    <li>To transmit any malicious code or viruses</li>
                    <li>To impersonate or attempt to impersonate the company</li>
                    <li>In any way that infringes upon the rights of others</li>
                  </ul>
                </section>

                <section className='mb-10'>
                  <h2 className='text-2xl font-bold text-slate-900'>5. Payment Terms</h2>
                  <p className='mt-4 leading-relaxed'>
                    All fees are payable in advance. By purchasing a subscription, you agree to pay the fees specified.
                    Subscriptions automatically renew unless cancelled. Refunds are subject to our refund policy.
                  </p>
                </section>

                <section className='mb-10'>
                  <h2 className='text-2xl font-bold text-slate-900'>6. Intellectual Property</h2>
                  <p className='mt-4 leading-relaxed'>
                    The service and its original content, features, and functionality are owned by {company} and are
                    protected by international copyright, trademark, patent, trade secret, and other intellectual
                    property laws.
                  </p>
                </section>

                <section className='mb-10'>
                  <h2 className='text-2xl font-bold text-slate-900'>7. Limitation of Liability</h2>
                  <p className='mt-4 leading-relaxed'>
                    In no event shall {company}, nor its directors, employees, partners, agents, suppliers, or
                    affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages
                    resulting from your use of the service.
                  </p>
                </section>

                <section>
                  <h2 className='text-2xl font-bold text-slate-900'>8. Contact Information</h2>
                  <p className='mt-4 leading-relaxed'>
                    If you have any questions about these Terms of Service, please{' '}
                    <a href={route('contact')} className='font-medium underline-offset-2 hover:underline'>
                      contact us
                    </a>
                    .
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </PublicMarketingShell>
    </>
  );
}
