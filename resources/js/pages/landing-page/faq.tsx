import PublicButton from '@/components/public/PublicButton';
import PublicMarketingShell from '@/components/public/PublicMarketingShell';
import PublicPageHero from '@/components/public/PublicPageHero';
import { AccordionItem, EASE_OUT, RevealGroup, RevealItem, SegmentedControl, useReduce } from '@/components/public/motion';
import { Head, Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircleQuestion, Search, X } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { publicTitle, type PublicPageProps } from './lib/public-page';

type Topic = 'general' | 'stores' | 'billing' | 'ai';
type Filter = 'all' | Topic;

const QUESTIONS: Array<{ key: string; topic: Topic }> = [
    { key: 'how', topic: 'general' },
    { key: 'skills', topic: 'general' },
    { key: 'security', topic: 'general' },
    { key: 'languages', topic: 'general' },
    { key: 'customize', topic: 'stores' },
    { key: 'multiple', topic: 'stores' },
    { key: 'domain', topic: 'stores' },
    { key: 'payments', topic: 'stores' },
    { key: 'analytics', topic: 'stores' },
    { key: 'trial', topic: 'billing' },
    { key: 'switch', topic: 'billing' },
    { key: 'fees', topic: 'billing' },
    { key: 'cancel', topic: 'billing' },
    { key: 'copilot', topic: 'ai' },
    { key: 'approval', topic: 'ai' },
    { key: 'aiData', topic: 'ai' },
];

export default function FaqPage() {
    const { settings, customPages = [] } = usePage<PublicPageProps>().props;
    const { t } = useTranslation();
    const reduce = useReduce();
    const [filter, setFilter] = React.useState<Filter>('all');
    const [query, setQuery] = React.useState('');
    const [open, setOpen] = React.useState<string | null>(null);

    const items = QUESTIONS.map((q) => ({
        ...q,
        question: t(`public.faq.items.${q.key}.question`),
        answer: t(`public.faq.items.${q.key}.answer`),
    }));

    const needle = query.trim().toLocaleLowerCase();
    const visible = items.filter(
        (item) =>
            (filter === 'all' || item.topic === filter) &&
            (!needle || item.question.toLocaleLowerCase().includes(needle) || item.answer.toLocaleLowerCase().includes(needle)),
    );

    const filters: Array<{ value: Filter; label: string }> = [
        { value: 'all', label: t('public.faq.filters.all') },
        { value: 'general', label: t('public.faq.filters.general') },
        { value: 'stores', label: t('public.faq.filters.stores') },
        { value: 'billing', label: t('public.faq.filters.billing') },
        { value: 'ai', label: t('public.faq.filters.ai') },
    ];

    return (
        <>
            <Head>
                <title>{publicTitle(t('public.nav.faq'), settings)}</title>
                <meta name="description" content={t('public.faq.hero.subtitle')} />
            </Head>

            <PublicMarketingShell settings={settings} customPages={customPages}>
                <PublicPageHero eyebrow={t('public.faq.hero.eyebrow')} title={t('public.faq.hero.title')} subtitle={t('public.faq.hero.subtitle')}>
                    <div className="relative mx-auto max-w-xl">
                        <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t('public.faq.searchPlaceholder')}
                            aria-label={t('public.faq.searchPlaceholder')}
                            className="h-14 w-full rounded-2xl border border-slate-200 bg-white/90 ps-12 pe-12 text-base text-slate-900 shadow-sm backdrop-blur transition-[border-color,box-shadow] duration-200 outline-none placeholder:text-slate-400 focus:border-[var(--primary-color)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--primary-color)_15%,transparent)] [&::-webkit-search-cancel-button]:hidden"
                        />
                        <AnimatePresence>
                            {query && (
                                <motion.button
                                    type="button"
                                    onClick={() => setQuery('')}
                                    aria-label={t('public.faq.clearSearch')}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.1 } }}
                                    transition={{ duration: 0.15, ease: EASE_OUT }}
                                    className="public-press absolute end-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                >
                                    <X className="h-4 w-4" aria-hidden />
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </PublicPageHero>

                <section className="px-4 pb-20 md:pb-28" aria-labelledby="faq-list-title">
                    <div className="container mx-auto max-w-3xl">
                        <h2 id="faq-list-title" className="sr-only">
                            {t('public.faq.hero.title')}
                        </h2>
                        <div className="mb-8 flex justify-center">
                            <SegmentedControl
                                options={filters}
                                value={filter}
                                onChange={setFilter}
                                layoutId="faq-filter"
                                label={t('public.faq.filters.label')}
                            />
                        </div>

                        <p className="sr-only" aria-live="polite">
                            {t('public.faq.resultCount', { count: visible.length })}
                        </p>

                        <motion.ul layout={!reduce} className="space-y-3">
                            <AnimatePresence mode="popLayout" initial={false}>
                                {visible.map((item) => (
                                    <motion.li
                                        key={item.key}
                                        layout={!reduce}
                                        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, filter: 'blur(4px)' }}
                                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                        exit={{ opacity: 0, transition: { duration: 0.12 } }}
                                        transition={{ duration: reduce ? 0.15 : 0.3, ease: EASE_OUT }}
                                    >
                                        <AccordionItem
                                            id={`faq-${item.key}`}
                                            question={item.question}
                                            open={open === item.key}
                                            onToggle={() => setOpen(open === item.key ? null : item.key)}
                                        >
                                            {item.answer}
                                        </AccordionItem>
                                    </motion.li>
                                ))}
                            </AnimatePresence>
                        </motion.ul>

                        <AnimatePresence>
                            {visible.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                                    transition={{ duration: 0.25, ease: EASE_OUT }}
                                    className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center"
                                >
                                    <p className="font-semibold text-slate-900">{t('public.faq.empty.title')}</p>
                                    <p className="mt-2 text-sm text-slate-600">{t('public.faq.empty.subtitle')}</p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setQuery('');
                                            setFilter('all');
                                        }}
                                        className="public-press mt-5 text-sm font-semibold underline underline-offset-4"
                                        style={{ color: 'var(--primary-color)' }}
                                    >
                                        {t('public.faq.empty.reset')}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <RevealGroup className="mt-16 flex flex-col items-center gap-5 rounded-3xl border border-slate-200/90 bg-white p-8 text-center shadow-sm sm:flex-row sm:text-start">
                            <RevealItem>
                                <span
                                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                                    style={{
                                        backgroundColor: 'color-mix(in srgb, var(--primary-color) 10%, white)',
                                        color: 'var(--primary-color)',
                                    }}
                                >
                                    <MessageCircleQuestion className="h-6 w-6" aria-hidden />
                                </span>
                            </RevealItem>
                            <RevealItem className="flex-1">
                                <p className="text-lg font-semibold text-slate-900">{t('landing.faq.stillHaveQuestions')}</p>
                                <p className="mt-1 text-slate-600">{t('public.faq.contactSubtitle')}</p>
                            </RevealItem>
                            <RevealItem className="flex flex-wrap justify-center gap-3">
                                <PublicButton href={route('contact')} arrow>
                                    {t('landing.faq.contactUs')}
                                </PublicButton>
                                <Link
                                    href={route('documentation.index')}
                                    className="public-press inline-flex items-center rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                                >
                                    {t('documentation.title', 'Documentation')}
                                </Link>
                            </RevealItem>
                        </RevealGroup>
                    </div>
                </section>
            </PublicMarketingShell>
        </>
    );
}
