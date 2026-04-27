import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

import ThemeColorProvider from '@/components/ThemeColorProvider';
import { useBrand } from '@/contexts/BrandContext';
import {
    getMarketingLogoDisplayUrl,
    resolvePublicBrandColors,
} from '@/lib/public-brand';

import CinematicLanding from './components/CinematicLanding';
import Footer from './components/Footer';
import Header from './components/Header';

interface Plan {
    id: number;
    name: string;
    description: string;
    price: number;
    yearly_price?: number | null;
    duration: string;
    features?: string[];
    is_popular?: boolean;
    is_plan_enable: string;
    stats?: {
        stores?: number | null;
        users_per_store?: number | null;
        products_per_store?: number | null;
        storage?: string | null;
        themes?: number | null;
        trial_days?: number | null;
    };
}

interface Faq {
    id: number;
    question: string;
    answer: string;
}

interface CustomPage {
    id: number;
    title: string;
    slug: string;
}

interface LandingSettings {
    company_name: string;
    contact_email: string;
    contact_phone: string;
    contact_address: string;
    config_sections?: {
        colors?: {
            primary?: string;
            secondary?: string;
            accent?: string;
        };
        seo?: {
            meta_title?: string;
            meta_description?: string;
            meta_keywords?: string;
        };
        custom_css?: string;
        custom_js?: string;
        section_visibility?: Record<string, boolean>;
    };
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
    faqs: Faq[];
    customPages: CustomPage[];
    settings: LandingSettings;
    featuredStores: FeaturedStore[];
    flash?: {
        success?: string;
        error?: string;
    };
    auth?: {
        user?: unknown;
    };
}

export default function LandingPage() {
    const page = usePage<PageProps>();
    const { plans, faqs, customPages = [], settings, featuredStores = [], auth } = page.props;
    const { t, i18n } = useTranslation();
    const { titleText, logoLight, logoDark } = useBrand();

    const rtlLanguages = ['ar', 'fa', 'ur'];
    const currentLang = i18n.language || 'ar';
    const isRTL = rtlLanguages.includes(currentLang.split('-')[0]);
    const direction = isRTL ? 'rtl' : 'ltr';

    React.useEffect(() => {
        document.documentElement.dir = direction;
        document.documentElement.lang = currentLang;
        if (document.body) {
            document.body.dir = direction;
        }
    }, [direction, currentLang]);

    const colors = resolvePublicBrandColors(settings);
    const seo = settings.config_sections?.seo;
    const pageTitle =
        seo?.meta_title ||
        titleText ||
        settings.company_name ||
        t('landing.cinematic.meta.title');
    const metaDescription =
        seo?.meta_description ||
        t('landing.cinematic.meta.description');
    const socialPreviewImage = getMarketingLogoDisplayUrl(logoLight, logoDark, false);

    React.useEffect(() => {
        const customCss = settings.config_sections?.custom_css;
        const styleId = 'landing-custom-css';
        let styleElement = document.getElementById(styleId) as HTMLStyleElement | null;

        if (!customCss) {
            styleElement?.remove();
            return;
        }

        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            document.head.appendChild(styleElement);
        }

        styleElement.textContent = customCss;
    }, [settings.config_sections?.custom_css]);

    React.useEffect(() => {
        const customJs = settings.config_sections?.custom_js;
        const scriptId = 'landing-custom-js';
        const existing = document.getElementById(scriptId);
        existing?.remove();

        if (!customJs) {
            return;
        }

        const scriptElement = document.createElement('script');
        scriptElement.id = scriptId;
        scriptElement.textContent = customJs;
        document.body.appendChild(scriptElement);

        return () => {
            scriptElement.remove();
        };
    }, [settings.config_sections?.custom_js]);

    return (
        <ThemeColorProvider colors={colors}>
            <Head>
                <title>{pageTitle}</title>
                <meta name="description" content={metaDescription} />
                {seo?.meta_keywords ? <meta name="keywords" content={seo.meta_keywords} /> : null}
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={metaDescription} />
                <meta property="og:type" content="website" />
                <meta property="og:image" content={socialPreviewImage} />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={pageTitle} />
                <meta name="twitter:description" content={metaDescription} />
                <meta name="twitter:image" content={socialPreviewImage} />
            </Head>

            <div
                data-landing-page="true"
                dir={direction}
                className="relative min-h-screen overflow-x-clip bg-[linear-gradient(180deg,#081223_0%,#0b1731_24%,#08111f_62%,#030712_100%)] text-white"
                style={
                    {
                        '--brand-color': colors.primary,
                        '--primary-color': colors.primary,
                        '--secondary-color': colors.secondary,
                        '--accent-color': colors.accent,
                        scrollBehavior: 'smooth',
                    } as React.CSSProperties
                }
            >
                <div className="landing-page-ambient-top" aria-hidden />
                <div
                    className="pointer-events-none fixed inset-0 z-0 opacity-90"
                    style={{
                        background: `radial-gradient(circle at 16% 8%, ${colors.primary}20, transparent 24%), radial-gradient(circle at 84% 12%, ${colors.accent}14, transparent 20%), radial-gradient(circle at 50% 100%, ${colors.primary}16, transparent 28%)`,
                    }}
                    aria-hidden
                />
                <div className="landing-noise pointer-events-none absolute inset-0 -z-10" aria-hidden />
                <Header settings={settings as any} customPages={customPages} brandColor={colors.primary} user={auth?.user} />
                <main className="relative z-10">
                    <CinematicLanding settings={settings} brandColor={colors.primary} />
                </main>
                <Footer settings={settings as any} brandColor={colors.primary} />
            </div>
        </ThemeColorProvider>
    );
}
