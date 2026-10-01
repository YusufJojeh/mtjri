import PublicButton from '@/components/public/PublicButton';
import PublicCtaBand from '@/components/public/PublicCtaBand';
import PublicMarketingShell from '@/components/public/PublicMarketingShell';
import PublicPageHero from '@/components/public/PublicPageHero';
import { EASE_OUT, RevealGroup, RevealItem, SegmentedControl, useReduce } from '@/components/public/motion';
import { resolvePublicBrandColors } from '@/lib/public-brand';
import { Head, usePage } from '@inertiajs/react';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import {
    BarChart3,
    BookOpen,
    Bot,
    Boxes,
    CheckCheck,
    CreditCard,
    Gift,
    Globe,
    Languages,
    LayoutTemplate,
    Mail,
    MessageCircle,
    Monitor,
    Newspaper,
    PackageCheck,
    Search,
    ShieldCheck,
    ShoppingBag,
    Sparkles,
    Store,
    Tag,
    Truck,
    Users,
    Zap,
    type LucideIcon,
} from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import WorkflowSection from './components/WorkflowSection';
import { publicTitle, type PublicPageProps } from './lib/public-page';

type Category = 'sell' | 'operate' | 'grow' | 'ai';
type Filter = 'all' | Category;

interface Feature {
    key: string;
    icon: LucideIcon;
    category: Category;
}

const FEATURES: Feature[] = [
    { key: 'storefronts', icon: LayoutTemplate, category: 'sell' },
    { key: 'payments', icon: CreditCard, category: 'sell' },
    { key: 'expressCheckout', icon: Zap, category: 'sell' },
    { key: 'pos', icon: Monitor, category: 'sell' },
    { key: 'domains', icon: Globe, category: 'sell' },
    { key: 'multiStore', icon: Store, category: 'operate' },
    { key: 'orders', icon: PackageCheck, category: 'operate' },
    { key: 'inventory', icon: Boxes, category: 'operate' },
    { key: 'shipping', icon: Truck, category: 'operate' },
    { key: 'customers', icon: Users, category: 'operate' },
    { key: 'roles', icon: ShieldCheck, category: 'operate' },
    { key: 'analytics', icon: BarChart3, category: 'grow' },
    { key: 'coupons', icon: Tag, category: 'grow' },
    { key: 'seo', icon: Search, category: 'grow' },
    { key: 'newsletter', icon: Mail, category: 'grow' },
    { key: 'referrals', icon: Gift, category: 'grow' },
    { key: 'blog', icon: Newspaper, category: 'grow' },
    { key: 'copilot', icon: Bot, category: 'ai' },
    { key: 'studio', icon: Sparkles, category: 'ai' },
    { key: 'actions', icon: CheckCheck, category: 'ai' },
    { key: 'knowledge', icon: BookOpen, category: 'ai' },
];

const LOCAL_POINTS: Array<{ key: string; icon: LucideIcon }> = [
    { key: 'rtl', icon: Languages },
    { key: 'whatsapp', icon: MessageCircle },
    { key: 'gateways', icon: CreditCard },
    { key: 'pwa', icon: ShoppingBag },
];

export default function FeaturesPage() {
    const { settings, customPages = [] } = usePage<PublicPageProps>().props;
    const { t } = useTranslation();
    const reduce = useReduce();
    const [filter, setFilter] = React.useState<Filter>('all');
    const brand = resolvePublicBrandColors(settings);

    const visible = filter === 'all' ? FEATURES : FEATURES.filter((f) => f.category === filter);

    const filters: Array<{ value: Filter; label: string }> = [
        { value: 'all', label: t('public.features.filters.all') },
        { value: 'sell', label: t('public.features.filters.sell') },
        { value: 'operate', label: t('public.features.filters.operate') },
        { value: 'grow', label: t('public.features.filters.grow') },
        { value: 'ai', label: t('public.features.filters.ai') },
    ];

    return (
        <>
            <Head>
                <title>{publicTitle(t('public.nav.features'), settings)}</title>
                <meta name="description" content={t('public.features.hero.subtitle')} />
            </Head>

            <PublicMarketingShell settings={settings} customPages={customPages} hideFooterCta>
                <PublicPageHero
                    eyebrow={t('public.features.hero.eyebrow')}
                    title={t('public.features.hero.title')}
                    subtitle={t('public.features.hero.subtitle')}
                    actions={
                        <>
                            <PublicButton href={route('register')} arrow>
                                {t('public.cta.primary')}
                            </PublicButton>
                            <PublicButton href={route('templates')} variant="secondary">
                                {t('public.features.hero.secondary')}
                            </PublicButton>
                        </>
                    }
                />

                <section className="px-4 pb-20 md:pb-28" aria-labelledby="features-grid-title">
                    <div className="container mx-auto max-w-6xl">
                        <h2 id="features-grid-title" className="sr-only">
                            {t('public.features.gridTitle')}
                        </h2>
                        <div className="mb-10 flex justify-center">
                            <SegmentedControl
                                options={filters}
                                value={filter}
                                onChange={setFilter}
                                layoutId="features-filter"
                                label={t('public.features.filters.label')}
                            />
                        </div>

                        <motion.ul layout={!reduce} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <AnimatePresence mode="popLayout" initial={false}>
                                {visible.map((feature) => {
                                    const Icon = feature.icon;
                                    return (
                                        <motion.li
                                            key={feature.key}
                                            layout={!reduce}
                                            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, filter: 'blur(4px)' }}
                                            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                            exit={
                                                reduce
                                                    ? { opacity: 0, transition: { duration: 0.1 } }
                                                    : { opacity: 0, scale: 0.96, filter: 'blur(4px)', transition: { duration: 0.15, ease: EASE_OUT } }
                                            }
                                            transition={{ duration: reduce ? 0.15 : 0.32, ease: EASE_OUT }}
                                        >
                                            <div className="public-card relative flex h-full flex-col rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <span
                                                        className="flex h-11 w-11 items-center justify-center rounded-xl"
                                                        style={{
                                                            backgroundColor: 'color-mix(in srgb, var(--primary-color) 9%, white)',
                                                            color: 'var(--primary-color)',
                                                        }}
                                                    >
                                                        <Icon className="h-5 w-5" aria-hidden />
                                                    </span>
                                                    <span className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
                                                        {t(`public.features.filters.${feature.category}`)}
                                                    </span>
                                                </div>
                                                <h3 className="mt-5 text-lg font-semibold text-slate-900">
                                                    {t(`public.features.items.${feature.key}.title`)}
                                                </h3>
                                                <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
                                                    {t(`public.features.items.${feature.key}.description`)}
                                                </p>
                                            </div>
                                        </motion.li>
                                    );
                                })}
                            </AnimatePresence>
                        </motion.ul>
                    </div>
                </section>

                <section className="overflow-x-clip px-4 pb-20 md:pb-28">
                    <div className="container mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
                        <RevealGroup>
                            <RevealItem
                                as="span"
                                className="block text-xs font-semibold tracking-[0.2em] uppercase"
                                style={{ color: 'var(--primary-color)' }}
                            >
                                {t('public.features.local.eyebrow')}
                            </RevealItem>
                            <RevealItem as="h2" className="mt-4 text-3xl font-bold tracking-tight text-balance text-slate-900 md:text-4xl">
                                {t('public.features.local.title')}
                            </RevealItem>
                            <RevealItem as="p" className="mt-4 text-lg leading-relaxed text-slate-600">
                                {t('public.features.local.subtitle')}
                            </RevealItem>
                            <RevealGroup as="ul" className="mt-8 grid gap-5 sm:grid-cols-2">
                                {LOCAL_POINTS.map(({ key, icon: Icon }) => (
                                    <RevealItem as="li" key={key} className="flex gap-3">
                                        <Icon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: 'var(--primary-color)' }} aria-hidden />
                                        <div>
                                            <p className="font-semibold text-slate-900">{t(`public.features.local.points.${key}.title`)}</p>
                                            <p className="mt-1 text-sm leading-relaxed text-slate-600">
                                                {t(`public.features.local.points.${key}.description`)}
                                            </p>
                                        </div>
                                    </RevealItem>
                                ))}
                            </RevealGroup>
                        </RevealGroup>

                        <LocalizedPreview />
                    </div>
                </section>

                <WorkflowSection settings={settings} brandColor={brand.primary} />

                <div className="pt-20 md:pt-28">
                    <PublicCtaBand />
                </div>
            </PublicMarketingShell>
        </>
    );
}

/**
 * A small storefront card that flips between English and Arabic on a loop,
 * showing the same product mirrored for RTL. Static under reduced motion.
 */
function LocalizedPreview() {
    const { t } = useTranslation();
    const reduce = useReduce();
    const [rtl, setRtl] = React.useState(true);
    const ref = React.useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { amount: 0.5 });

    // Only cycle while the preview is on screen.
    React.useEffect(() => {
        if (reduce || !inView) return;
        const id = window.setInterval(() => setRtl((v) => !v), 3200);
        return () => window.clearInterval(id);
    }, [reduce, inView]);

    const copy = rtl
        ? { dir: 'rtl' as const, store: 'متجر الريحان', product: 'عطر العود الملكي', price: '٢٤٩ ر.س', cta: 'أضف إلى السلة', badge: 'العربية' }
        : { dir: 'ltr' as const, store: 'Rayhan Store', product: 'Royal Oud Perfume', price: 'SAR 249', cta: 'Add to cart', badge: 'English' };

    return (
        <RevealGroup className="relative">
            <RevealItem className="relative mx-auto max-w-md">
                <div ref={ref} className="absolute inset-0" aria-hidden />
                <div
                    className="absolute -inset-6 -z-10 rounded-[2rem] opacity-70 blur-2xl"
                    style={{ background: 'radial-gradient(closest-side, color-mix(in srgb, var(--primary-color) 22%, transparent), transparent)' }}
                    aria-hidden
                />
                <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-900/10">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-3">
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
                        <span className="ms-auto text-[11px] font-medium text-slate-400">{t('public.features.local.previewLabel')}</span>
                    </div>
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={copy.dir}
                            dir={copy.dir}
                            initial={reduce ? { opacity: 0 } : { opacity: 0, filter: 'blur(6px)', x: copy.dir === 'rtl' ? -10 : 10 }}
                            animate={{ opacity: 1, filter: 'blur(0px)', x: 0 }}
                            exit={reduce ? { opacity: 0 } : { opacity: 0, filter: 'blur(6px)', transition: { duration: 0.16, ease: EASE_OUT } }}
                            transition={{ duration: 0.36, ease: EASE_OUT }}
                            className="p-5"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-900">{copy.store}</span>
                                <span
                                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                    style={{
                                        backgroundColor: 'color-mix(in srgb, var(--accent-color) 18%, white)',
                                        color: '#7a5a12',
                                    }}
                                >
                                    {copy.badge}
                                </span>
                            </div>
                            <div
                                className="mt-4 aspect-[4/3] rounded-2xl"
                                style={{
                                    background:
                                        'linear-gradient(135deg, color-mix(in srgb, var(--primary-color) 85%, black), color-mix(in srgb, var(--primary-color) 45%, var(--accent-color)))',
                                }}
                                aria-hidden
                            />
                            <div className="mt-4 flex items-end justify-between gap-4">
                                <div>
                                    <p className="font-semibold text-slate-900">{copy.product}</p>
                                    <p className="mt-1 text-sm text-slate-500">{copy.price}</p>
                                </div>
                                <span
                                    className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
                                    style={{ backgroundColor: 'var(--primary-color)' }}
                                >
                                    {copy.cta}
                                </span>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </RevealItem>
        </RevealGroup>
    );
}
