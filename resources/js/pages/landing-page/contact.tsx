import React from 'react';
import { usePage, Head } from '@inertiajs/react';
import ContactSection from './components/ContactSection';
import PublicMarketingShell from '@/components/public/PublicMarketingShell';
import { resolvePublicBrandColors } from '@/lib/public-brand';

interface CustomPageNav {
  id: number;
  title: string;
  slug: string;
}

interface PageProps {
  [key: string]: unknown;
  settings?: {
    company_name: string;
    contact_email?: string;
    contact_phone?: string;
    contact_address?: string;
    config_sections?: {
      colors?: {
        primary?: string;
        secondary?: string;
        accent?: string;
      };
      sections?: Array<{
        key: string;
        [key: string]: unknown;
      }>;
    };
    [key: string]: unknown;
  };
  customPages?: CustomPageNav[];
  flash?: {
    success?: string;
    error?: string;
  };
}

export default function ContactPage() {
  const page = usePage<PageProps>();
  const { settings, customPages = [], flash } = page.props || {};

  const defaultSettings = {
    company_name: 'Tijraa',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
  };

  const finalSettings = { ...defaultSettings, ...settings };
  const finalFlash = flash || {};

  return (
    <>
      <Head>
        <title>Contact Us - {finalSettings.company_name}</title>
        <meta
          name='description'
          content={`Contact ${finalSettings.company_name} — we'd love to hear from you.`}
        />
      </Head>

      <PublicMarketingShell settings={finalSettings as any} customPages={customPages}>
        <ContactSection
          flash={finalFlash}
          settings={finalSettings as any}
          brandColor={resolvePublicBrandColors(finalSettings as any).primary}
        />
      </PublicMarketingShell>
    </>
  );
}
