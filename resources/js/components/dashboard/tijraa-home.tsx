import { Link, router } from '@inertiajs/react';
import axios from 'axios';
import { ArrowRight, BookOpen, CheckCircle2, ClipboardCheck, EyeOff, Lightbulb, ListChecks, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, Panel } from '@/components/ds/layout';
import { ToneBadge } from '@/components/ds/status-badge';
import { useNotificationText } from '@/components/tijraa/notifications';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AiDescription } from '@/lib/tijraa/types';

export interface TijraaSummary {
    ai: AiDescription;
    can_ask: boolean;
    insights: Array<{
        id: number;
        type: string;
        severity: 'critical' | 'high' | 'medium' | 'low' | 'positive';
        title: string;
        description: string | null;
        params: Record<string, string | number> & { _title?: string; _description?: string };
        estimated_impact: string | number | null;
        action_url: string | null;
    }>;
    pending_actions?: { count: number; latest: Array<{ uuid: string; type: string; resource_label: string | null; goal: string | null }> };
    knowledge?: { ready: number; failed: number; processing: number };
    onboarding?: { progress: { completed: number; total: number; percent: number; next: string | null }; todo: Array<{ id: string; required: boolean }> };
}

const SEVERITY = {
    critical: { tone: 'danger', label: 'Critical' },
    high: { tone: 'danger', label: 'High' },
    medium: { tone: 'warning', label: 'Medium' },
    low: { tone: 'neutral', label: 'Low' },
    positive: { tone: 'success', label: 'Good news' },
} as const;

/** Types the Copilot can turn into a reviewed proposal. */
const PREPARE: Record<string, string> = {
    product_sales_decline: 'Prepare a discount for products with falling sales',
    content_gap: 'Improve the thinnest product description',
    seo_gap: 'Fix search metadata for a blog post that is missing it',
    discount_unused: 'Should I keep or retire my unused discounts?',
};

const STEP_TITLE: Record<string, string> = {
    identity: 'Name and describe your store',
    brand: 'Add your logo and colors',
    products: 'Add your first product',
    payments: 'Turn on a payment method',
    shipping: 'Set up shipping',
    policies: 'Publish your policies',
    domain: 'Connect a domain',
    knowledge: 'Teach Tijraa about your brand',
    ai_preferences: 'Choose how Tijraa writes',
    go_live: 'Go live',
};

export function AskTijraaBar({ summary }: { summary: TijraaSummary }) {
    const { t } = useTranslation();
    const [q, setQ] = useState('');
    const pending = summary.pending_actions?.count ?? 0;
    const k = summary.knowledge;
    if (!summary.can_ask && !pending) return null;
    return (
        <section aria-label={t('Ask Tijraa')} className="bg-card flex flex-col gap-3 rounded-xl border p-3 shadow-card sm:p-4 lg:flex-row lg:items-center">
            {summary.can_ask && (
                <form
                    className="focus-within:ring-ring/40 flex min-w-0 flex-1 items-center gap-2 rounded-lg border px-3 focus-within:ring-[3px]"
                    onSubmit={(e) => {
                        e.preventDefault();
                        router.visit(route('copilot.index', q.trim() ? { q: q.trim() } : {}));
                    }}
                >
                    <Sparkles className="text-ai size-4 shrink-0" aria-hidden />
                    <label htmlFor="ask-tijraa" className="sr-only">
                        {t('Ask Tijraa')}
                    </label>
                    <input
                        id="ask-tijraa"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        maxLength={500}
                        disabled={!summary.ai.configured}
                        placeholder={summary.ai.configured ? t('Ask Tijraa about sales, stock, customers…') : t('Connect an AI provider in Settings to ask Tijraa')}
                        className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none"
                    />
                    <Button type="submit" size="sm" variant="ghost" disabled={!summary.ai.configured} className="shrink-0">
                        {t('Ask')} <ArrowRight className="rtl:rotate-180" />
                    </Button>
                </form>
            )}
            <div className="flex flex-wrap gap-2">
                {summary.pending_actions && (
                    <Link href={route('ai-actions.index')} className={cn('inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium', pending ? 'border-warning/40 bg-warning-soft text-warning-fg' : 'text-muted-foreground')}>
                        <ClipboardCheck className="size-4" aria-hidden />
                        {pending ? t('{{count}} changes to review', { count: pending }) : t('No changes to review')}
                    </Link>
                )}
                {k && (
                    <Link href={route('knowledge.index')} className={cn('inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm', k.failed ? 'border-danger/40 text-danger-fg' : 'text-muted-foreground')}>
                        <BookOpen className="size-4" aria-hidden />
                        {k.failed ? t('{{count}} knowledge documents failed', { count: k.failed }) : k.ready ? t('{{count}} knowledge documents ready', { count: k.ready }) : t('No brand knowledge yet')}
                    </Link>
                )}
            </div>
        </section>
    );
}

export function TijraaIntelligence({ summary }: { summary: TijraaSummary }) {
    const { t } = useTranslation();
    const text = useNotificationText();
    const [hidden, setHidden] = useState<number[]>([]);
    const insights = summary.insights.filter((i) => !hidden.includes(i.id));
    const ob = summary.onboarding;
    const showSetup = !!ob && ob.progress.percent < 100 && ob.todo.length > 0;

    const dismiss = async (id: number) => {
        setHidden((h) => [...h, id]);
        try {
            await axios.post(route('insights.dismiss', id), {}, { headers: { Accept: 'application/json' } });
        } catch {
            setHidden((h) => h.filter((x) => x !== id));
        }
    };

    return (
        <div className="grid gap-5 lg:grid-cols-3">
            <Panel
                title={t('Tijraa Intelligence')}
                description={t('Findings computed from your store data. Numbers come from your records, not from AI.')}
                icon={<Lightbulb />}
                className={showSetup ? 'lg:col-span-2' : 'lg:col-span-3'}
                flush
            >
                {insights.length === 0 ? (
                    <EmptyState compact icon={<CheckCircle2 />} title={t('Nothing unusual right now')} description={t('Findings appear when sales, stock, payments or content change meaningfully')} />
                ) : (
                    <ul className={cn('grid divide-y border-t', !showSetup && 'lg:grid-cols-2 lg:divide-y-0')} role="list">
                        {insights.map((ins) => {
                            const sev = SEVERITY[ins.severity] ?? SEVERITY.low;
                            const title = ins.params?._title ? text(ins.params._title, ins.params) : ins.title;
                            const desc = ins.params?._description ? text(ins.params._description, ins.params) : ins.description;
                            const prepare = PREPARE[ins.type];
                            return (
                                <li key={ins.id} className="flex gap-3 px-4 py-3 sm:px-5">
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-medium">{title}</p>
                                            <ToneBadge tone={sev.tone} className="h-5 text-[11px]">
                                                {t(sev.label)}
                                            </ToneBadge>
                                        </div>
                                        {desc && <p className="text-muted-foreground text-sm">{desc}</p>}
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
                                            {summary.can_ask && summary.ai.configured && (
                                                <Link href={route('copilot.index', { q: prepare ? t(prepare) : t('Explain: {{title}}', { title }) })} className="text-ai-fg inline-flex items-center gap-1 text-xs font-medium hover:underline">
                                                    <Sparkles className="size-3" aria-hidden />
                                                    {prepare ? t('Ask Tijraa to prepare a fix') : t('Ask Tijraa why')}
                                                </Link>
                                            )}
                                            {ins.action_url && (
                                                <Link href={ins.action_url} className="inline-flex items-center gap-1 text-xs font-medium hover:underline">
                                                    {t('Open')}
                                                    <ArrowRight className="size-3 rtl:rotate-180" aria-hidden />
                                                </Link>
                                            )}
                                            <button type="button" onClick={() => dismiss(ins.id)} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs">
                                                <EyeOff className="size-3" aria-hidden /> {t('Dismiss')}
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Panel>

            {showSetup && ob && (
                <Panel title={t('Setup guide')} description={t('{{done}} of {{total}} complete', { done: ob.progress.completed, total: ob.progress.total })} icon={<ListChecks />}>
                    <div className="bg-muted mb-3 h-1.5 overflow-hidden rounded-full" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={ob.progress.percent} aria-label={t('Setup progress')}>
                        <div className="bg-primary h-full rounded-full" style={{ width: `${ob.progress.percent}%` }} />
                    </div>
                    <ul className="space-y-1" role="list">
                        {ob.todo.map((s) => (
                            <li key={s.id}>
                                <Link href={route('onboarding.index')} className="hover:bg-muted -mx-2 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium">
                                    <span className="border-muted-foreground/50 size-4 shrink-0 rounded-full border" aria-hidden />
                                    <span className="flex-1">{t(STEP_TITLE[s.id] ?? s.id)}</span>
                                    {!s.required && <span className="text-muted-foreground text-xs font-normal">{t('Optional')}</span>}
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <Button variant="outline" size="sm" asChild className="mt-3 w-full">
                        <Link href={route('onboarding.index')}>{t('Open setup guide')}</Link>
                    </Button>
                </Panel>
            )}
        </div>
    );
}
