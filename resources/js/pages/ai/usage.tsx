import { usePage } from '@inertiajs/react';
import { Gauge } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageTemplate } from '@/components/page-template';
import { EmptyState, MetricCard, Panel } from '@/components/ds/layout';
import { ToneBadge } from '@/components/ds/status-badge';
import { Progress } from '@/components/ui/progress';
import { useCommerceFormat } from '@/hooks/use-commerce-format';
import type { AiDescription, BudgetSummary } from '@/lib/tijraa/types';

interface PageProps {
    ai: AiDescription;
    budget: BudgetSummary;
    by_feature: Array<{ feature: string; tokens: number; cost: number; requests: number }>;
    daily: Array<{ day: string; tokens: number }>;
    recent: Array<{ feature: string; provider: string; model: string | null; input_tokens: number; output_tokens: number; cost_usd: number; status: string; error_code: string | null; created_at: string }>;
}

const FEATURE: Record<string, string> = { copilot: 'Ask Tijraa', content_studio: 'Content Studio', content_editor: 'Product editor', knowledge: 'Knowledge' };

export default function AiUsage() {
    const { t } = useTranslation();
    const fmt = useCommerceFormat();
    const { ai, budget, by_feature, daily, recent } = usePage().props as unknown as PageProps;
    const max = Math.max(1, ...daily.map((d) => Number(d.tokens)));
    const tone = budget.percent >= 90 ? 'danger' : budget.percent >= 75 ? 'warning' : 'success';

    return (
        <PageTemplate
            title={t('AI usage')}
            description={t('Tokens used by Tijraa AI features this month, against your plan allowance.')}
            url="/ai/usage"
            breadcrumbs={[{ title: t('Dashboard'), href: route('dashboard') }, { title: t('AI usage') }]}
        >
            <div className="space-y-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <MetricCard label={t('Used this month')} value={fmt.number(budget.used, { notation: 'compact' })} hint={t('of {{limit}} tokens', { limit: fmt.number(budget.limit, { notation: 'compact' }) })} />
                    <MetricCard label={t('Remaining')} value={fmt.number(budget.remaining, { notation: 'compact' })} hint={t('Resets {{date}}', { date: fmt.date(budget.resets_at) })} emphasis={budget.remaining <= 0 ? 'danger' : 'default'} />
                    <MetricCard
                        label={t('Provider')}
                        value={ai.configured ? (ai.is_test_model ? t('Test model') : (ai.provider ?? '—')) : t('Not connected')}
                        hint={ai.model ?? undefined}
                        emphasis={ai.configured ? 'default' : 'warning'}
                    />
                </div>

                <Panel title={t('Monthly allowance')} action={<ToneBadge tone={tone}>{t('{{percent}}% used', { percent: budget.percent })}</ToneBadge>}>
                    <Progress value={budget.percent} className="h-2" aria-label={t('Monthly allowance used')} />
                    <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                        {Object.entries(budget.features).map(([f, v]) => (
                            <li key={f} className="rounded-lg border p-3">
                                <p className="text-xs font-medium">{t(FEATURE[f] ?? f)}</p>
                                <p className="text-sm tabular-nums">
                                    {fmt.number(v.used, { notation: 'compact' })} / {fmt.number(v.limit, { notation: 'compact' })}
                                </p>
                                <Progress value={v.limit ? Math.min(100, (v.used / v.limit) * 100) : 0} className="mt-2 h-1.5" aria-label={t(FEATURE[f] ?? f)} />
                            </li>
                        ))}
                    </ul>
                    {budget.remaining <= 0 && <p className="text-danger-fg mt-3 text-sm">{t('AI features are paused until the allowance resets. Store data, reports and manual editing keep working.')}</p>}
                </Panel>

                <div className="grid gap-5 lg:grid-cols-2">
                    <Panel title={t('Daily tokens')}>
                        {daily.length === 0 ? (
                            <EmptyState compact icon={<Gauge />} title={t('No AI usage yet this month')} />
                        ) : (
                            <>
                                <div className="flex h-36 items-end gap-1" role="img" aria-label={t('Daily token usage chart; values listed in the table below')}>
                                    {daily.map((d) => (
                                        <div key={d.day} className="group relative flex-1">
                                            <div className="bg-ai rounded-t-[4px]" style={{ height: `${Math.max(2, (Number(d.tokens) / max) * 136)}px` }} title={`${fmt.date(d.day)} · ${fmt.number(d.tokens)}`} />
                                        </div>
                                    ))}
                                </div>
                                <details className="mt-3 text-xs">
                                    <summary className="text-muted-foreground cursor-pointer">{t('Show as table')}</summary>
                                    <table className="mt-2 w-full">
                                        <tbody>
                                            {daily.map((d) => (
                                                <tr key={d.day} className="border-b last:border-0">
                                                    <td className="py-1">{fmt.date(d.day)}</td>
                                                    <td className="py-1 text-end tabular-nums">{fmt.number(d.tokens)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </details>
                            </>
                        )}
                    </Panel>
                    <Panel title={t('By feature')}>
                        {by_feature.length === 0 ? (
                            <p className="text-muted-foreground text-sm">{t('No AI usage yet this month')}</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-muted-foreground text-xs">
                                        <th className="pb-2 text-start font-medium">{t('Feature')}</th>
                                        <th className="pb-2 text-end font-medium">{t('Requests')}</th>
                                        <th className="pb-2 text-end font-medium">{t('Tokens')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {by_feature.map((f) => (
                                        <tr key={f.feature} className="border-t">
                                            <td className="py-2">{t(FEATURE[f.feature] ?? f.feature)}</td>
                                            <td className="py-2 text-end tabular-nums">{fmt.number(f.requests)}</td>
                                            <td className="py-2 text-end tabular-nums">{fmt.number(f.tokens)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </Panel>
                </div>

                <Panel title={t('Recent requests')} flush>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[560px] text-sm">
                            <thead>
                                <tr className="text-muted-foreground border-y text-xs">
                                    <th className="px-4 py-2 text-start font-medium">{t('When')}</th>
                                    <th className="px-4 py-2 text-start font-medium">{t('Feature')}</th>
                                    <th className="px-4 py-2 text-start font-medium">{t('Status')}</th>
                                    <th className="px-4 py-2 text-end font-medium">{t('Tokens')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recent.map((r, i) => (
                                    <tr key={i} className="border-b last:border-0">
                                        <td className="text-muted-foreground px-4 py-2">{fmt.relative(r.created_at)}</td>
                                        <td className="px-4 py-2">{t(FEATURE[r.feature] ?? r.feature)}</td>
                                        <td className="px-4 py-2">
                                            <ToneBadge tone={r.status === 'ok' ? 'success' : r.status === 'budget_blocked' ? 'warning' : 'danger'}>
                                                {r.status === 'ok' ? t('OK') : r.status === 'budget_blocked' ? t('Blocked by allowance') : t('Error')}
                                            </ToneBadge>
                                        </td>
                                        <td className="px-4 py-2 text-end tabular-nums">{fmt.number(r.input_tokens + r.output_tokens)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Panel>
            </div>
        </PageTemplate>
    );
}
