import React from 'react';
import { usePage, Head } from '@inertiajs/react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import WorkflowSection from './components/WorkflowSection';
import FeaturedStoresSection from './components/FeaturedStoresSection';
import FeaturesSection from './components/FeaturesSection';
import ScreenshotsSection from './components/ScreenshotsSection';
import WhyChooseUs from './components/WhyChooseUs';
import TemplatesSection from './components/TemplatesSection';
import AboutUs from './components/AboutUs';
import TeamSection from './components/TeamSection';
import TestimonialsSection from './components/TestimonialsSection';
import PlansSection from './components/PlansSection';
import FaqSection from './components/FaqSection';
import NewsletterSection from './components/NewsletterSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import ActiveCampaignsSection from './components/ActiveCampaignsSection';
import { useBrand } from '@/contexts/BrandContext';
import { resolvePublicBrandColors, PUBLIC_BRAND_PRIMARY } from '@/lib/public-brand';
import { useFavicon } from '@/hooks/use-favicon';
import { useTranslation } from 'react-i18next';
import ThemeColorProvider from '@/components/ThemeColorProvider';

interface Plan {
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

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company?: string;
  content: string;
  avatar?: string;
  rating: number;
}

interface Faq {
  id: number;
  question: string;
  answer: string;
}

interface LandingSettings {
  company_name: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  config_sections?: {
    sections: Array<{
      key: string;
      [key: string]: any;
    }>;
    theme?: {
      primary_color?: string;
      secondary_color?: string;
      accent_color?: string;
      logo_light?: string;
      logo_dark?: string;
      favicon?: string;
    };
    seo?: {
      meta_title?: string;
      meta_description?: string;
      meta_keywords?: string;
    };
    custom_css?: string;
    custom_js?: string;
    section_order?: string[];
    section_visibility?: {
      [key: string]: boolean;
    };
  };
}

interface CustomPage {
  id: number;
  title: string;
  slug: string;
}

interface FeaturedStore {
  id: number;
  name: string;
  description: string;
  slug: string;
  logo?: string;
}

interface PageProps {
  plans: Plan[];
  testimonials: Testimonial[];
  faqs: Faq[];
  customPages: CustomPage[];
  settings: LandingSettings;
  featuredStores: FeaturedStore[];
  flash?: {
    success?: string;
    error?: string;
  };
  [key: string]: any;
}

export default function LandingPage() {
  const { plans, testimonials, faqs, customPages = [], settings, featuredStores = [], flash } = usePage<PageProps>().props;
  const { i18n } = useTranslation();

  useFavicon();
  
  // RTL/LTR handling
  const rtlLanguages = ['ar', 'fa', 'ur'];
  const currentLang = i18n.language || 'ar';
  const isRTL = rtlLanguages.includes(currentLang.split('-')[0]);
  const currentDirection = isRTL ? 'rtl' : 'ltr';
  
  // Update document direction when language changes
  React.useEffect(() => {
    document.documentElement.dir = currentDirection;
    document.documentElement.setAttribute('dir', currentDirection);
    document.documentElement.setAttribute('lang', currentLang);
    if (document.body) {
      document.body.dir = currentDirection;
    }
  }, [currentDirection, currentLang]);
  // Public marketing colors: only `settings.config_sections.colors` (CMS) or logo-aligned defaults.
  // Do not inherit dashboard `THEME_COLORS` from BrandContext — that was forcing emerald/green on the landing.
  const resolved = resolvePublicBrandColors(settings as Parameters<typeof resolvePublicBrandColors>[0]);
  const primaryColor = resolved.primary || PUBLIC_BRAND_PRIMARY;
  const secondaryColor = resolved.secondary;
  const accentColor = resolved.accent;
  const page = usePage<any>();
  const { auth } = page.props || { auth: {} };
  
  // i18next is the ONLY source of truth for language
  // NO backend language, NO auth.lang, NO cookies - ONLY i18next localStorage
  // Arabic is the default language
  
  // Get title from brand context (superadmin settings) first, then SEO, then fallback
  const { titleText } = useBrand();
  const seo = settings.config_sections?.seo;
  const pageTitle = titleText || seo?.meta_title || 'MTJRii - Build Your Online Store';
  const metaDescription = seo?.meta_description || 'Create beautiful, professional online stores with MTJRii. Everything you need to start selling online.';

  // Custom CSS
  React.useEffect(() => {
    const customCss = settings.config_sections?.custom_css;
    if (customCss) {
      const styleId = 'landing-custom-css';
      let styleElement = document.getElementById(styleId);
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = customCss;
    }
  }, [settings.config_sections?.custom_css]);

  // Custom JS
  React.useEffect(() => {
    const customJs = settings.config_sections?.custom_js;
    if (customJs) {
      const scriptId = 'landing-custom-js';
      let scriptElement = document.getElementById(scriptId);
      if (scriptElement) {
        scriptElement.remove();
      }
      scriptElement = document.createElement('script');
      scriptElement.id = scriptId;
      scriptElement.textContent = customJs;
      document.body.appendChild(scriptElement);
    }
  }, [settings.config_sections?.custom_js]);

  // Get section visibility (only for showing/hiding sections, NOT for content)
  const isSectionVisible = (key: string) => {
    return settings.config_sections?.section_visibility?.[key] !== false;
  };

  // Get section order or use default
  const defaultOrder = [
    'header', 'hero', 'features', 'workflow', 'screenshots', 'why_choose_us', 'templates', 'about',
    'team', 'testimonials', 'featured_stores', 'plans', 'faq', 'newsletter', 'footer',
  ];

  /** Insert workflow after features for existing installs that predate the section. */
  const mergeLandingSectionOrder = (order: string[]): string[] => {
    const next = [...order];
    if (!next.includes('workflow')) {
      const fi = next.indexOf('features');
      if (fi !== -1) {
        next.splice(fi + 1, 0, 'workflow');
      }
    }
    return next;
  };

  const userOrder = settings.config_sections?.section_order || defaultOrder;
  // Remove 'contact' from section order (now on separate page)
  const sectionOrder = mergeLandingSectionOrder(userOrder).filter((section: string) => section !== 'contact');

  // Component mapping
  const sectionComponents = {
    header: () => isSectionVisible('header') && (
      <Header 
        settings={settings as any} 
        customPages={customPages} 
        brandColor={primaryColor} 
        user={auth?.user}
      />
    ),
    hero: () => isSectionVisible('hero') && (
      <HeroSection 
        settings={settings} 
        brandColor={primaryColor} 
      />
    ),
    features: () => isSectionVisible('features') && (
      <FeaturesSection 
        settings={settings} 
        brandColor={primaryColor} 
      />
    ),
    workflow: () => isSectionVisible('workflow') && (
      <WorkflowSection settings={settings} brandColor={primaryColor} />
    ),
    screenshots: () => isSectionVisible('screenshots') && (
      <ScreenshotsSection 
        settings={settings} 
        brandColor={primaryColor} 
      />
    ),
    why_choose_us: () => isSectionVisible('why_choose_us') && (
      <WhyChooseUs 
        settings={settings} 
        brandColor={primaryColor} 
      />
    ),
    templates: () => isSectionVisible('templates') && (
      <TemplatesSection 
        settings={settings} 
        brandColor={primaryColor} 
      />
    ),
    about: () => isSectionVisible('about') && (
      <AboutUs 
        settings={settings} 
        brandColor={primaryColor} 
      />
    ),
    team: () => isSectionVisible('team') && (
      <TeamSection 
        settings={settings} 
        brandColor={primaryColor} 
      />
    ),
    testimonials: () => isSectionVisible('testimonials') && (
      <TestimonialsSection 
        testimonials={testimonials} 
        settings={settings} 
        brandColor={primaryColor} 
      />
    ),
    featured_stores: () =>
      isSectionVisible('featured_stores') &&
      featuredStores.length > 0 && (
        <FeaturedStoresSection stores={featuredStores} settings={settings} brandColor={primaryColor} />
      ),
    plans: () => isSectionVisible('plans') && (
      <PlansSection 
        plans={plans} 
        settings={settings} 
        brandColor={primaryColor} 
      />
    ),
    faq: () => isSectionVisible('faq') && (
      <FaqSection 
        faqs={faqs} 
        settings={settings} 
        brandColor={primaryColor} 
      />
    ),
    newsletter: () => isSectionVisible('newsletter') && (
      <NewsletterSection 
        flash={flash} 
        settings={settings} 
        brandColor={primaryColor} 
      />
    ),
    contact: () => isSectionVisible('contact') && (
      <ContactSection 
        flash={flash} 
        settings={settings} 
        brandColor={primaryColor} 
      />
    ),
    footer: () => isSectionVisible('footer') && (
        <Footer 
          settings={settings as any} 
          brandColor={primaryColor} 
        />
    )
  };

  return (
    <ThemeColorProvider colors={{ primary: primaryColor, secondary: secondaryColor, accent: accentColor }}>
      <Head>
        <title>{pageTitle}</title>
        <meta name='description' content={metaDescription} />
        {seo?.meta_keywords && <meta name='keywords' content={seo.meta_keywords} />}
      </Head>
      <div 
        className='min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900' 
        data-landing-page='true'
        dir={currentDirection}
        style={{ 
          scrollBehavior: 'smooth', 
          '--brand-color': primaryColor,
          '--primary-color': primaryColor,
          '--secondary-color': secondaryColor,
          '--accent-color': accentColor
        } as React.CSSProperties}
      >
        {sectionOrder.map((sectionKey) => {
          const Component = sectionComponents[sectionKey as keyof typeof sectionComponents];
          return Component ? <React.Fragment key={sectionKey}>{Component()}</React.Fragment> : null;
        })}
      </div>
    </ThemeColorProvider>
  );
}
