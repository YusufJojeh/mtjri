import PublicMarketingShell from '@/components/public/PublicMarketingShell';
import { RevealGroup, RevealItem } from '@/components/public/motion';
import type { PublicCustomPageNav, PublicSettings } from '@/pages/landing-page/lib/public-page';
import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface LegalSection {
    title: string;
    body?: string;
    items?: string[];
}

interface LegalPageProps {
    /** Translation namespace under `public.legal`, e.g. "privacy" or "terms". */
    doc: 'privacy' | 'terms';
    settings: PublicSettings;
    customPages?: PublicCustomPageNav[];
}

/**
 * Shared layout for the legal pages. All copy comes from
 * `public.legal.<doc>` so every language gets the full document.
 */
export default function LegalPage({ doc, settings, customPages = [] }: LegalPageProps) {
    const { t, i18n } = useTranslation();
    const company = settings?.company_name || 'Tijraa';
    const vars = { company };

    const title = t(`public.legal.${doc}.title`);
    const sections = t(`public.legal.${doc}.sections`, { ...vars, returnObjects: true }) as unknown;
    const list: LegalSection[] = Array.isArray(sections) ? (sections as LegalSection[]) : [];

    const updated = new Date().toLocaleDateString(i18n.language || 'ar', { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <>
            <Head>
                <title>{`${title} — ${company}`}</title>
                <meta name="description" content={t(`public.legal.${doc}.description`, vars)} />
            </Head>

            <PublicMarketingShell settings={settings} customPages={customPages}>
                <div className="relative isolate px-4 pt-8 pb-20 md:pt-12">
                    <div className="landing-page-ambient-top" aria-hidden />
                    <div className="relative container mx-auto max-w-4xl">
                        <RevealGroup
                            immediate
                            className="public-legal-hero mb-12 rounded-2xl border border-slate-200/80 bg-white/80 px-6 py-10 shadow-sm backdrop-blur-md md:px-10 md:py-12"
                        >
                            <RevealItem as="span" className="block text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">
                                {t('public.legal.eyebrow')}
                            </RevealItem>
                            <RevealItem as="h1" className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
                                {title}
                            </RevealItem>
                            <RevealItem as="p" className="mt-4 text-lg text-slate-600">
                                {t('public.legal.lastUpdated', { date: updated })}
                            </RevealItem>
                        </RevealGroup>

                        <div className="landing-card-depth rounded-2xl border border-slate-200/90 bg-white/90 p-8 shadow-sm backdrop-blur-sm md:p-12">
                            {list.map((section, index) => (
                                <section key={index} className="mb-10">
                                    <h2 className="text-2xl font-bold text-slate-900">
                                        {index + 1}. {section.title}
                                    </h2>
                                    {section.body && <p className="mt-4 text-lg leading-relaxed text-slate-600">{section.body}</p>}
                                    {section.items && section.items.length > 0 && (
                                        <ul className="mt-4 list-inside list-disc space-y-2 text-lg text-slate-600">
                                            {section.items.map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    )}
                                </section>
                            ))}

                            <section>
                                <h2 className="text-2xl font-bold text-slate-900">
                                    {list.length + 1}. {t('public.legal.contactTitle')}
                                </h2>
                                <p className="mt-4 text-lg leading-relaxed text-slate-600">
                                    {t(`public.legal.${doc}.contactBefore`)}{' '}
                                    <Link
                                        href={route('contact')}
                                        className="font-medium underline underline-offset-2"
                                        style={{ color: 'var(--primary-color)' }}
                                    >
                                        {t('public.legal.contactLink')}
                                    </Link>
                                    {t('public.legal.contactAfter')}
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </PublicMarketingShell>
        </>
    );
}
