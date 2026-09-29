import React from 'react';
import { useTranslation } from 'react-i18next';
import { usePage } from '@inertiajs/react';
import Header from '@/pages/landing-page/components/Header';
import Footer from '@/pages/landing-page/components/Footer';
import DocumentationSidebar from './DocumentationSidebar';
import ThemeColorProvider from '@/components/ThemeColorProvider';
import { resolvePublicBrandColors } from '@/lib/public-brand';

interface CustomPageNav {
  id: number;
  title: string;
  slug: string;
}

interface DocumentationLayoutProps {
  children: React.ReactNode;
  customPages?: CustomPageNav[];
  categories?: Array<{
    key: string;
    name: string;
    icon: string;
    articles: Array<{
      slug: string;
      title: string;
      category: string;
    }>;
    count: number;
  }>;
  currentArticle?: {
    slug: string;
    category: string;
  };
  settings?: {
    company_name: string;
    config_sections?: {
      colors?: {
        primary?: string;
        secondary?: string;
        accent?: string;
      };
    };
    [key: string]: any;
  };
}

export default function DocumentationLayout({
  children,
  customPages: customPagesProp,
  categories = [],
  currentArticle,
  settings,
}: DocumentationLayoutProps) {
  const { i18n } = useTranslation();
  const page = usePage<{ customPages?: CustomPageNav[]; auth?: { user?: unknown } }>();
  const customPages = customPagesProp ?? page.props.customPages ?? [];

  const rtlLanguages = ['ar', 'fa', 'ur'];
  const currentLang = i18n.language || 'ar';
  const isRTL = rtlLanguages.includes(currentLang.split('-')[0]);
  const direction = isRTL ? 'rtl' : 'ltr';

  React.useEffect(() => {
    document.documentElement.setAttribute('dir', direction);
    document.documentElement.setAttribute('lang', currentLang);
    if (document.body) {
      document.body.setAttribute('dir', direction);
    }
  }, [direction, currentLang]);

  const palette = resolvePublicBrandColors(settings);
  const primaryColor = palette.primary;

  const headerFooterSettings = {
    company_name: settings?.company_name || 'Tijraa',
    contact_email: (settings as any)?.contact_email ?? '',
    contact_phone: (settings as any)?.contact_phone ?? '',
    contact_address: (settings as any)?.contact_address ?? '',
    config_sections: settings?.config_sections,
  };

  return (
    <ThemeColorProvider colors={palette}>
      <div
        data-public-shell
        data-testid="documentation-layout"
        className="relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900"
        dir={direction}
        style={
          {
            '--primary-color': primaryColor,
            '--secondary-color': palette.secondary,
            '--accent-color': palette.accent,
          } as React.CSSProperties
        }
      >
        <div className="public-ambient-mesh pointer-events-none fixed inset-0 -z-10" aria-hidden />
        <div className="public-noise pointer-events-none fixed inset-0 -z-10" aria-hidden />

        <Header
          settings={headerFooterSettings as any}
          customPages={customPages}
          brandColor={primaryColor}
          user={page.props.auth?.user as any}
        />

        <div className="pt-20">
          <div className="container mx-auto max-w-7xl px-4 py-8">
            <div className="flex flex-col gap-8 lg:flex-row">
              <aside className="lg:w-64 lg:flex-shrink-0">
                <div className="sticky top-24">
                  <DocumentationSidebar
                    categories={categories}
                    currentArticle={currentArticle}
                    primaryColor={primaryColor}
                  />
                </div>
              </aside>

              <main className="min-w-0 flex-1">{children}</main>
            </div>
          </div>
        </div>

        <Footer settings={headerFooterSettings as any} brandColor={primaryColor} />
      </div>
    </ThemeColorProvider>
  );
}

