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

export default function PrivacyPage() {
  const { settings, customPages } = usePage<PageProps>().props;
  const reduce = useReducedMotion() ?? false;
  const company = settings?.company_name || 'MTJRii';

  return (
    <>
      <Head>
        <title>Privacy Policy - {company}</title>
        <meta name='description' content={`Privacy Policy for ${company}`} />
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
                Privacy Policy
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
                  <h2 className='text-2xl font-bold text-slate-900'>1. Introduction</h2>
                  <p className='mt-4 leading-relaxed'>
                    Welcome to {company}. We are committed to protecting your personal information and your
                    right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard
                    your information when you visit our website and use our services.
                  </p>
                </section>

                <section className='mb-10'>
                  <h2 className='text-2xl font-bold text-slate-900'>2. Information We Collect</h2>
                  <p className='mt-4 leading-relaxed'>
                    We collect information that you provide directly to us, such as when you create an account,
                    make a purchase, or contact us for support. This may include:
                  </p>
                  <ul className='mt-4 list-inside list-disc space-y-2 text-slate-600'>
                    <li>Name and contact information</li>
                    <li>Payment and billing information</li>
                    <li>Account credentials</li>
                    <li>Communication preferences</li>
                  </ul>
                </section>

                <section className='mb-10'>
                  <h2 className='text-2xl font-bold text-slate-900'>3. How We Use Your Information</h2>
                  <p className='mt-4 leading-relaxed'>We use the information we collect to:</p>
                  <ul className='mt-4 list-inside list-disc space-y-2 text-slate-600'>
                    <li>Provide, maintain, and improve our services</li>
                    <li>Process transactions and send related information</li>
                    <li>Send you technical notices and support messages</li>
                    <li>Respond to your comments and questions</li>
                    <li>Monitor and analyze trends and usage</li>
                  </ul>
                </section>

                <section className='mb-10'>
                  <h2 className='text-2xl font-bold text-slate-900'>4. Information Sharing</h2>
                  <p className='mt-4 leading-relaxed'>
                    We do not sell, trade, or rent your personal information to third parties. We may share your
                    information only in the following circumstances:
                  </p>
                  <ul className='mt-4 list-inside list-disc space-y-2 text-slate-600'>
                    <li>With your consent</li>
                    <li>To comply with legal obligations</li>
                    <li>To protect our rights and safety</li>
                    <li>With service providers who assist us in operating our services</li>
                  </ul>
                </section>

                <section className='mb-10'>
                  <h2 className='text-2xl font-bold text-slate-900'>5. Data Security</h2>
                  <p className='mt-4 leading-relaxed'>
                    We implement appropriate technical and organizational security measures to protect your personal
                    information. However, no method of transmission over the Internet is 100% secure, and we cannot
                    guarantee absolute security.
                  </p>
                </section>

                <section className='mb-10'>
                  <h2 className='text-2xl font-bold text-slate-900'>6. Your Rights</h2>
                  <p className='mt-4 leading-relaxed'>You have the right to:</p>
                  <ul className='mt-4 list-inside list-disc space-y-2 text-slate-600'>
                    <li>Access your personal information</li>
                    <li>Correct inaccurate data</li>
                    <li>Request deletion of your data</li>
                    <li>Object to processing of your data</li>
                    <li>Data portability</li>
                  </ul>
                </section>

                <section>
                  <h2 className='text-2xl font-bold text-slate-900'>7. Contact Us</h2>
                  <p className='mt-4 leading-relaxed'>
                    If you have questions about this Privacy Policy, please contact us via our{' '}
                    <a href={route('contact')} className='font-medium underline-offset-2 hover:underline'>
                      contact page
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
