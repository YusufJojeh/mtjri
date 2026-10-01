import PublicCtaBand from '@/components/public/PublicCtaBand';
import PublicMarketingShell from '@/components/public/PublicMarketingShell';
import PublicPageHero from '@/components/public/PublicPageHero';
import { EASE_OUT, SegmentedControl, useReduce } from '@/components/public/motion';
import { getStoreThemes } from '@/data/storeThemes';
import { resolvePublicBrandColors } from '@/lib/public-brand';
import { Head, Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Store } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import FeaturedStoresSection, { type FeaturedStore } from './components/FeaturedStoresSection';
import { publicTitle, type PublicPageProps } from './lib/public-page';

type Group = 'all' | 'style' | 'home' | 'tech' | 'family';

/** Which filter each bundled storefront theme belongs to. */
const THEME_GROUP: Record<string, Exclude<Group, 'all'>> = {
    fashion: 'style',
    'beauty-cosmetics': 'style',
    jewelry: 'style',
    watches: 'style',
    'perfume-fragrances': 'style',
    'home-accessories': 'home',
    'furniture-interior': 'home',
    electronics: 'tech',
    'cars-automotive': 'tech',
    'baby-kids': 'family',
};

export default function TemplatesPage() {
    const { settings, customPages = [], featuredStores = [] } = usePage<PublicPageProps & { featuredStores?: FeaturedStore[] }>().props;
    const { t } = useTranslation();
    const reduce = useReduce();
    const brand = resolvePublicBrandColors(settings);
    const [group, setGroup] = React.useState<Group>('all');

    const themes = React.useMemo(() => getStoreThemes(), []);
    const visible = group === 'all' ? themes : themes.filter((theme) => THEME_GROUP[theme.id] === group);

    const groups: Array<{ value: Group; label: string }> = [
        { value: 'all', label: t('public.templates.filters.all') },
        { value: 'style', label: t('public.templates.filters.style') },
        { value: 'home', label: t('public.templates.filters.home') },
        { value: 'tech', label: t('public.templates.filters.tech') },
        { value: 'family', label: t('public.templates.filters.family') },
    ];

    return (
        <>
            <Head>
                <title>{publicTitle(t('public.nav.templates'), settings)}</title>
                <meta name="description" content={t('public.templates.hero.subtitle')} />
            </Head>

            <PublicMarketingShell settings={settings} customPages={customPages} hideFooterCta>
                <PublicPageHero
                    eyebrow={t('public.templates.hero.eyebrow', { count: themes.length })}
                    title={t('public.templates.hero.title')}
                    subtitle={t('public.templates.hero.subtitle')}
                />

                <section className="px-4 pb-20 md:pb-28" aria-labelledby="templates-grid-title">
                    <div className="container mx-auto max-w-6xl">
                        <h2 id="templates-grid-title" className="sr-only">
                            {t('public.nav.templates')}
                        </h2>
                        <div className="mb-10 flex justify-center">
                            <SegmentedControl
                                options={groups}
                                value={group}
                                onChange={setGroup}
                                layoutId="templates-filter"
                                label={t('public.templates.filters.label')}
                            />
                        </div>

                        <motion.ul layout={!reduce} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            <AnimatePresence mode="popLayout" initial={false}>
                                {visible.map((theme, index) => (
                                    <motion.li
                                        key={theme.id}
                                        layout={!reduce}
                                        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, filter: 'blur(4px)' }}
                                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                        exit={
                                            reduce
                                                ? { opacity: 0, transition: { duration: 0.1 } }
                                                : { opacity: 0, scale: 0.96, filter: 'blur(4px)', transition: { duration: 0.15, ease: EASE_OUT } }
                                        }
                                        transition={{ duration: reduce ? 0.15 : 0.34, ease: EASE_OUT, delay: reduce ? 0 : Math.min(index, 5) * 0.03 }}
                                    >
                                        <TemplateCard
                                            thumbnail={theme.thumbnail}
                                            name={t(`public.templates.themes.${theme.id}.name`, theme.name)}
                                            description={t(`public.templates.themes.${theme.id}.description`, theme.description)}
                                            groupLabel={t(`public.templates.filters.${THEME_GROUP[theme.id] ?? 'all'}`)}
                                        />
                                    </motion.li>
                                ))}
                            </AnimatePresence>
                        </motion.ul>

                        <p className="mt-10 text-center text-sm text-slate-500">{t('public.templates.note')}</p>
                    </div>
                </section>

                <FeaturedStoresSection stores={featuredStores} settings={settings} brandColor={brand.primary} />

                <div className={featuredStores.length ? 'pt-20 md:pt-28' : ''}>
                    <PublicCtaBand
                        title={t('public.templates.cta.title')}
                        subtitle={t('public.templates.cta.subtitle')}
                        secondaryHref={route('features')}
                        secondaryLabel={t('public.templates.cta.secondary')}
                    />
                </div>
            </PublicMarketingShell>
        </>
    );
}

interface TemplateCardProps {
    thumbnail: string;
    name: string;
    description: string;
    groupLabel: string;
}

function TemplateCard({ thumbnail, name, description, groupLabel }: TemplateCardProps) {
    const { t } = useTranslation();
    const [failed, setFailed] = React.useState(!thumbnail);
    const [loaded, setLoaded] = React.useState(false);

    return (
        <article className="public-card group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
            <div className="public-card-media relative aspect-[4/3] overflow-hidden bg-slate-100">
                {failed ? (
                    <div
                        className="flex h-full w-full items-center justify-center text-4xl font-bold text-white/90"
                        style={{
                            background:
                                'linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 80%, black), color-mix(in srgb, var(--primary-color) 40%, var(--accent-color)))',
                        }}
                        aria-hidden
                    >
                        <Store className="h-10 w-10" />
                    </div>
                ) : (
                    <img
                        src={thumbnail}
                        alt={t('public.templates.previewAlt', { name })}
                        loading="lazy"
                        decoding="async"
                        onLoad={() => setLoaded(true)}
                        onError={() => setFailed(true)}
                        className={`h-full w-full object-cover object-top transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                    />
                )}
                <span className="absolute start-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur">
                    {groupLabel}
                </span>
            </div>
            <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-slate-600">{description}</p>
                <Link
                    href={route('register')}
                    className="public-press mt-5 inline-flex items-center gap-1.5 self-start rounded-lg text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)] focus-visible:ring-offset-2"
                    style={{ color: 'var(--primary-color)' }}
                >
                    {t('public.templates.useTemplate')}
                    <ArrowRight className="public-arrow h-4 w-4 rtl:-scale-x-100" aria-hidden />
                </Link>
            </div>
        </article>
    );
}
