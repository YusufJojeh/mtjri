import { Link, router, usePage } from '@inertiajs/react';
import { ClipboardCheck, MessageSquare, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageTemplate } from '@/components/page-template';
import { EmptyState, Panel } from '@/components/ds/layout';
import { Pager, SegmentedTabs, type PageMeta } from '@/components/ds/data-table';
import { ToneBadge } from '@/components/ds/status-badge';
import { ActionCard } from '@/components/tijraa/action-card';
import { ACTION_STATUS, ACTION_TYPE_LABEL } from '@/components/tijraa/labels';
import { Button } from '@/components/ui/button';
import { useCommerceFormat } from '@/hooks/use-commerce-format';
import { cn } from '@/lib/utils';
import type { AgentActionView } from '@/lib/tijraa/types';

type Tab = 'pending' | 'executed' | 'rejected' | 'failed' | 'expired' | 'all';

interface PageProps {
    tab: Tab;
    counts: Record<string, number>;
    actions: PageMeta & { data: AgentActionView[] };
    selected: AgentActionView | null;
}

export default function ActionCenter() {
    const { t } = useTranslation();
    const fmt = useCommerceFormat();
    const { tab, counts, actions, selected: initialSelected } = usePage().props as unknown as PageProps;
    const [items, setItems] = useState(actions.data);
    const [selectedId, setSelectedId] = useState<string | null>(initialSelected?.id ?? actions.data[0]?.id ?? null);
    const [extra, setExtra] = useState<AgentActionView | null>(initialSelected && !actions.data.some((a) => a.id === initialSelected.id) ? initialSelected : null);
    const selected = items.find((a) => a.id === selectedId) ?? (extra?.id === selectedId ? extra : null);

    const go = (params: Record<string, string | number>) => router.get(route('ai-actions.index'), { status: tab, ...params }, { preserveScroll: true });
    const update = (a: AgentActionView) => {
        setItems((list) => list.map((x) => (x.id === a.id ? a : x)));
        if (extra?.id === a.id) setExtra(a);
        router.reload({ only: ['counts', 'tijraa'] });
    };

    const segments = (['pending', 'executed', 'rejected', 'failed', 'expired', 'all'] as Tab[]).map((v) => ({
        value: v,
        label: t(v === 'pending' ? 'Needs review' : v === 'executed' ? 'Applied' : v === 'rejected' ? 'Rejected' : v === 'failed' ? 'Failed' : v === 'expired' ? 'Expired' : 'All'),
        count: v === 'all' ? Object.values(counts).reduce((a, b) => a + Number(b), 0) : v === 'expired' ? Number(counts.expired ?? 0) + Number(counts.cancelled ?? 0) : Number(counts[v] ?? 0),
    }));

    return (
        <PageTemplate
            title={t('AI Actions')}
            description={t('Every change Tijraa proposes waits here until someone approves it.')}
            url="/ai-actions"
            breadcrumbs={[{ title: t('Dashboard'), href: route('dashboard') }, { title: t('AI Actions') }]}
        >
            <div className="space-y-4">
                <SegmentedTabs segments={segments} value={tab} onChange={(v) => go({ status: v })} label={t('Filter by status')} />

                {items.length === 0 && !selected ? (
                    <Panel>
                        <EmptyState
                            icon={<ClipboardCheck />}
                            title={tab === 'pending' ? t('Nothing waiting for review') : t('No actions here yet')}
                            description={t('Ask Tijraa to prepare a change — for example new product copy, a discount or SEO fixes. It will appear here for approval.')}
                            action={
                                <Button asChild size="sm">
                                    <Link href={route('copilot.index')}>
                                        <Sparkles /> {t('Ask Tijraa')}
                                    </Link>
                                </Button>
                            }
                        />
                    </Panel>
                ) : (
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
                        <Panel flush as="div" className="overflow-hidden">
                            <ul className="divide-y" aria-label={t('Proposed changes')}>
                                {items.map((a) => {
                                    const st = ACTION_STATUS[a.status] ?? ACTION_STATUS.pending;
                                    return (
                                        <li key={a.id}>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedId(a.id)}
                                                aria-current={a.id === selectedId ? 'true' : undefined}
                                                className={cn('hover:bg-muted/60 focus-visible:ring-ring/40 flex w-full flex-col gap-1 px-4 py-3 text-start outline-none focus-visible:ring-[3px] focus-visible:ring-inset', a.id === selectedId && 'bg-muted')}
                                            >
                                                <span className="flex w-full items-center justify-between gap-2">
                                                    <span className="truncate text-sm font-medium">{t(ACTION_TYPE_LABEL[a.type] ?? 'Proposed change')}</span>
                                                    <ToneBadge tone={st.tone}>{t(st.label)}</ToneBadge>
                                                </span>
                                                <span className="text-muted-foreground truncate text-xs">{a.resource.label ?? a.goal}</span>
                                                <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                                                    {a.source === 'copilot' ? <MessageSquare className="size-3" aria-hidden /> : <Sparkles className="size-3" aria-hidden />}
                                                    {a.source === 'copilot' ? t('From Ask Tijraa') : t('From Content Studio')} · {fmt.relative(a.created_at)}
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                            <Pager meta={actions} onPage={(p) => go({ page: p })} />
                        </Panel>

                        <div className="min-w-0 space-y-3">
                            {selected ? (
                                <>
                                    <ActionCard action={selected} onChange={update} />
                                    {selected.run && (
                                        <p className="text-muted-foreground text-xs">
                                            {t('Prepared in the conversation')}{' '}
                                            <Link href={route('copilot.show', selected.run.id)} className="text-foreground font-medium hover:underline">
                                                {selected.run.title ?? t('Conversation')}
                                            </Link>
                                            {selected.created_by ? ` · ${t('requested by {{name}}', { name: selected.created_by })}` : ''}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <Panel>
                                    <EmptyState compact title={t('Select a change to review')} />
                                </Panel>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </PageTemplate>
    );
}
