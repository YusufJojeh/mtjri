import PublicCtaBand from '@/components/public/PublicCtaBand';
import PublicMarketingShell from '@/components/public/PublicMarketingShell';
import PublicPageHero from '@/components/public/PublicPageHero';
import { AccordionItem, RevealGroup, RevealItem } from '@/components/public/motion';
import { resolvePublicBrandColors } from '@/lib/public-brand';
import { Head, Link, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import PlansSection from './components/PlansSection';
import { publicTitle, type PublicPageProps } from './lib/public-page';

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

const INCLUDED = ['storefront', 'checkout', 'ssl', 'languages', 'orders', 'analytics', 'support', 'updates'] as const;
const PRICING_FAQ = ['trial', 'switch', 'fees', 'payment', 'cancel'] as const;

export default function PricingPage() {
    const { settings, customPages = [], plans = [] } = usePage<PublicPageProps & { plans?: Plan[] }>().props;
    const { t } = useTranslation();
    const brand = resolvePublicBrandColors(settings);
    const [open, setOpen] = React.useState<string | null>(PRICING_FAQ[0]);

    return (
        <>
            <Head>
                <title>{publicTitle(t('public.nav.pricing'), settings)}</title>
                <meta name="description" content={t('public.pricing.hero.subtitle')} />
            </Head>

            <PublicMarketingShell settings={settings} customPages={customPages} hideFooterCta>
                <PublicPageHero
                    eyebrow={t('public.pricing.hero.eyebrow')}
                    title={t('public.pricing.hero.title')}
                    subtitle={t('public.pricing.hero.subtitle')}
                />

                <PlansSection plans={plans} settings={settings} brandColor={brand.primary} hideHeading />

                <section className="px-4 py-20 md:py-24" aria-labelledby="included-title">
                    <RevealGroup className="container mx-auto max-w-5xl rounded-3xl border border-slate-200/90 bg-white p-8 shadow-sm md:p-12">
                        <RevealItem as="h2" id="included-title" className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                            {t('public.pricing.included.title')}
                        </RevealItem>
                        <RevealItem as="p" className="mt-3 max-w-2xl text-slate-600">
                            {t('public.pricing.included.subtitle')}
                        </RevealItem>
                        <RevealGroup as="ul" className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                            {INCLUDED.map((key) => (
                                <RevealItem as="li" key={key} className="flex items-start gap-3">
                                    <span
                                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                                        style={{
                                            backgroundColor: 'color-mix(in srgb, var(--primary-color) 12%, white)',
                                            color: 'var(--primary-color)',
                                        }}
                                        aria-hidden
                                    >
                                        <Check className="h-3 w-3" strokeWidth={3} />
                                    </span>
                                    <span className="text-[15px] text-slate-700">{t(`public.pricing.included.items.${key}`)}</span>
                                </RevealItem>
                            ))}
                        </RevealGroup>
                    </RevealGroup>
                </section>

                <section className="px-4 pb-20 md:pb-28" aria-labelledby="pricing-faq-title">
                    <div className="container mx-auto max-w-3xl">
                        <RevealGroup className="mb-10 text-center">
                            <RevealItem as="h2" id="pricing-faq-title" className="text-3xl font-bold tracking-tight text-slate-900">
                                {t('public.pricing.faq.title')}
                            </RevealItem>
                            <RevealItem as="p" className="mt-3 text-slate-600">
                                {t('public.pricing.faq.subtitle')}{' '}
                                <Link
                                    href={route('faq')}
                                    className="font-semibold underline decoration-slate-300 underline-offset-4 transition-colors hover:decoration-current"
                                    style={{ color: 'var(--primary-color)' }}
                                >
                                    {t('public.pricing.faq.link')}
                                </Link>
                            </RevealItem>
                        </RevealGroup>
                        <RevealGroup className="space-y-3">
                            {PRICING_FAQ.map((key) => (
                                <RevealItem key={key}>
                                    <AccordionItem
                                        id={`pricing-faq-${key}`}
                                        question={t(`public.pricing.faq.items.${key}.question`)}
                                        open={open === key}
                                        onToggle={() => setOpen(open === key ? null : key)}
                                    >
                                        {t(`public.pricing.faq.items.${key}.answer`)}
                                    </AccordionItem>
                                </RevealItem>
                            ))}
                        </RevealGroup>
                    </div>
                </section>

                <PublicCtaBand secondaryHref={route('contact')} secondaryLabel={t('public.cta.talkToUs')} />
            </PublicMarketingShell>
        </>
    );
}
