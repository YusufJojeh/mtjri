import PublicButton from '@/components/public/PublicButton';
import PublicCtaBand from '@/components/public/PublicCtaBand';
import PublicMarketingShell from '@/components/public/PublicMarketingShell';
import PublicPageHero from '@/components/public/PublicPageHero';
import { RevealGroup, RevealItem } from '@/components/public/motion';
import { Head, usePage } from '@inertiajs/react';
import { Award, Heart, Lightbulb, Target, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { publicTitle, type PublicPageProps } from './lib/public-page';

const VALUES: Array<{ key: string; icon: LucideIcon }> = [
    { key: 'mission', icon: Target },
    { key: 'values', icon: Heart },
    { key: 'commitment', icon: Award },
    { key: 'vision', icon: Lightbulb },
];

const PRINCIPLES = ['local', 'simple', 'owned', 'ai'] as const;

export default function AboutPage() {
    const { settings, customPages = [] } = usePage<PublicPageProps>().props;
    const { t } = useTranslation();

    return (
        <>
            <Head>
                <title>{publicTitle(t('public.nav.about'), settings)}</title>
                <meta name="description" content={t('public.about.hero.subtitle')} />
            </Head>

            <PublicMarketingShell settings={settings} customPages={customPages} hideFooterCta>
                <PublicPageHero
                    eyebrow={t('public.about.hero.eyebrow')}
                    title={t('public.about.hero.title')}
                    subtitle={t('public.about.hero.subtitle')}
                    actions={
                        <>
                            <PublicButton href={route('register')} arrow>
                                {t('public.cta.primary')}
                            </PublicButton>
                            <PublicButton href={route('contact')} variant="secondary">
                                {t('public.cta.talkToUs')}
                            </PublicButton>
                        </>
                    }
                />

                <section className="px-4 pb-20 md:pb-28" aria-labelledby="story-title">
                    <div className="container mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
                        <RevealGroup>
                            <RevealItem
                                as="span"
                                className="block text-xs font-semibold tracking-[0.2em] uppercase"
                                style={{ color: 'var(--primary-color)' }}
                            >
                                {t('public.about.story.eyebrow')}
                            </RevealItem>
                            <RevealItem
                                as="h2"
                                id="story-title"
                                className="mt-4 text-3xl font-bold tracking-tight text-balance text-slate-900 md:text-4xl"
                            >
                                {t('public.about.story.title')}
                            </RevealItem>
                            <RevealItem as="p" className="mt-6 text-lg leading-relaxed text-slate-600">
                                {t('public.about.story.p1')}
                            </RevealItem>
                            <RevealItem as="p" className="mt-4 text-lg leading-relaxed text-slate-600">
                                {t('public.about.story.p2')}
                            </RevealItem>
                        </RevealGroup>

                        <RevealGroup as="ol" className="relative space-y-8 border-s border-slate-200 ps-8">
                            {PRINCIPLES.map((key, index) => (
                                <RevealItem as="li" key={key} className="relative">
                                    <span
                                        className="absolute -start-[2.875rem] top-0 flex h-7 w-7 items-center justify-center rounded-full border-4 border-white text-[11px] font-bold text-white shadow-sm"
                                        style={{ backgroundColor: 'var(--primary-color)' }}
                                        aria-hidden
                                    >
                                        {index + 1}
                                    </span>
                                    <h3 className="font-semibold text-slate-900">{t(`public.about.principles.${key}.title`)}</h3>
                                    <p className="mt-1.5 leading-relaxed text-slate-600">{t(`public.about.principles.${key}.description`)}</p>
                                </RevealItem>
                            ))}
                        </RevealGroup>
                    </div>
                </section>

                <section className="bg-white/60 px-4 py-20 md:py-28" aria-labelledby="values-title">
                    <div className="container mx-auto max-w-6xl">
                        <RevealGroup className="mx-auto mb-12 max-w-2xl text-center">
                            <RevealItem as="h2" id="values-title" className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                                {t('public.about.values.title')}
                            </RevealItem>
                            <RevealItem as="p" className="mt-4 text-lg text-slate-600">
                                {t('public.about.values.subtitle')}
                            </RevealItem>
                        </RevealGroup>
                        <RevealGroup as="ul" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {VALUES.map(({ key, icon: Icon }) => (
                                <RevealItem as="li" key={key}>
                                    <div className="public-card h-full rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
                                        <span
                                            className="flex h-11 w-11 items-center justify-center rounded-xl"
                                            style={{
                                                backgroundColor: 'color-mix(in srgb, var(--primary-color) 9%, white)',
                                                color: 'var(--primary-color)',
                                            }}
                                        >
                                            <Icon className="h-5 w-5" aria-hidden />
                                        </span>
                                        <h3 className="mt-5 text-lg font-semibold text-slate-900">{t(`landing.about.values.${key}.title`)}</h3>
                                        <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
                                            {t(`landing.about.values.${key}.description`)}
                                        </p>
                                    </div>
                                </RevealItem>
                            ))}
                        </RevealGroup>
                    </div>
                </section>

                <div className="pt-20 md:pt-28">
                    <PublicCtaBand secondaryHref={route('contact')} secondaryLabel={t('public.cta.talkToUs')} />
                </div>
            </PublicMarketingShell>
        </>
    );
}
