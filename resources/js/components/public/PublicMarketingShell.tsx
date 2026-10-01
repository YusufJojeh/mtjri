import React from 'react';
import { usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import Header from '@/pages/landing-page/components/Header';
import Footer from '@/pages/landing-page/components/Footer';
import ThemeColorProvider from '@/components/ThemeColorProvider';
import { resolvePublicBrandColors } from '@/lib/public-brand';

interface CustomPageNav {
    id: number;
    title: string;
    slug: string;
}

interface SettingsShape {
    company_name: string;
    contact_email?: string;
    contact_phone?: string;
    contact_address?: string;
    config_sections?: {
        colors?: { primary?: string; secondary?: string; accent?: string };
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

interface PublicMarketingShellProps {
    children: React.ReactNode;
    settings: SettingsShape;
    customPages?: CustomPageNav[];
    /** Extra top padding under fixed header (default 4rem) */
    mainClassName?: string;
    /** Hide the footer's CTA strip when the page ends with its own call to action. */
    hideFooterCta?: boolean;
}

export default function PublicMarketingShell({
    children,
    settings,
    customPages = [],
    mainClassName = 'pt-16',
    hideFooterCta = false,
}: PublicMarketingShellProps) {
    const { i18n } = useTranslation();
    const page = usePage<{ auth?: { user?: unknown } }>();
    const auth = page.props.auth;

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

    const colors = resolvePublicBrandColors(settings);
    const footerSettings = {
        company_name: settings.company_name,
        contact_email: settings.contact_email ?? '',
        contact_phone: settings.contact_phone ?? '',
        contact_address: settings.contact_address ?? '',
        config_sections: settings.config_sections,
    };

    return (
        <ThemeColorProvider colors={colors}>
            <div
                data-public-shell
                className='relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900'
                dir={direction}
                style={
                    {
                        '--primary-color': colors.primary,
                        '--secondary-color': colors.secondary,
                        '--accent-color': colors.accent,
                        scrollBehavior: 'smooth',
                    } as React.CSSProperties
                }
            >
                <div className='public-ambient-mesh pointer-events-none fixed inset-0 -z-10' aria-hidden />
                <div className='public-noise pointer-events-none fixed inset-0 -z-10' aria-hidden />

                <Header
                    settings={settings as any}
                    customPages={customPages}
                    brandColor={colors.primary}
                    user={auth?.user as any}
                />

                <main className={mainClassName}>{children}</main>

                <Footer settings={footerSettings as any} brandColor={colors.primary} hideCta={hideFooterCta} />
            </div>
        </ThemeColorProvider>
    );
}
