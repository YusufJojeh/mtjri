import { router, usePage } from '@inertiajs/react';
import { Power, PowerOff, RefreshCw, Trash2, Upload } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PageTemplate } from '@/components/page-template';
import { DescriptionList, EmptyState, Panel } from '@/components/ds/layout';
import { ToneBadge } from '@/components/ds/status-badge';
import { Button } from '@/components/ui/button';
import { useCommerceFormat } from '@/hooks/use-commerce-format';
import { usePermissions } from '@/hooks/usePermissions';
import { DOC_STATUS, DOC_TYPE_LABEL, type KnowledgeDoc } from '@/components/tijraa/knowledge-labels';

interface PageProps {
    document: KnowledgeDoc;
    versions: Array<{ version: number; chars: number; created_at: string }>;
    ingestions: Array<{ status: string; stage: string | null; error: string | null; metrics: Record<string, number> | null; started_at: string | null; finished_at: string | null }>;
    chunks: Array<{ index: number; heading: string | null; preview: string; tokens: number }>;
}

const STAGES: Record<string, string> = { validation: 'Checking file', extraction: 'Reading text', chunking: 'Splitting into passages', embedding: 'Indexing meaning', indexing: 'Saving index' };

export default function KnowledgeShow() {
    const { t } = useTranslation();
    const fmt = useCommerceFormat();
    const { hasPermission } = usePermissions();
    const canManage = hasPermission('manage-knowledge');
    const { document: d, versions, ingestions, chunks } = usePage().props as unknown as PageProps;
    const fileRef = useRef<HTMLInputElement>(null);
    const st = DOC_STATUS[d.status];
    const post = (name: string) => router.post(route(name, d.id), {}, { preserveScroll: true });

    return (
        <PageTemplate
            title={d.title}
            url={`/knowledge/${d.id}`}
            breadcrumbs={[{ title: t('Dashboard'), href: route('dashboard') }, { title: t('Knowledge'), href: route('knowledge.index') }, { title: d.title }]}
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="truncate text-xl font-semibold tracking-tight">{d.title}</h1>
                            <ToneBadge tone={st.tone}>{t(st.label)}</ToneBadge>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            {t(DOC_TYPE_LABEL[d.type] ?? d.type)} · v{d.version}
                        </p>
                    </div>
                    {canManage && (
                        <div className="flex flex-wrap gap-2">
                            {d.status === 'inactive' ? (
                                <Button size="sm" variant="outline" onClick={() => post('knowledge.activate')}>
                                    <Power /> {t('Activate')}
                                </Button>
                            ) : d.status === 'ready' ? (
                                <Button size="sm" variant="outline" onClick={() => post('knowledge.deactivate')}>
                                    <PowerOff /> {t('Deactivate')}
                                </Button>
                            ) : null}
                            {d.status === 'failed' && (
                                <Button size="sm" variant="outline" onClick={() => post('knowledge.retry')}>
                                    <RefreshCw /> {t('Retry')}
                                </Button>
                            )}
                            <input
                                ref={fileRef}
                                type="file"
                                className="hidden"
                                aria-label={t('Upload new version')}
                                onChange={(e) => e.target.files?.[0] && router.post(route('knowledge.versions.store', d.id), { file: e.target.files[0] }, { forceFormData: true, preserveScroll: true })}
                            />
                            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                                <Upload /> {t('New version')}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-danger-fg"
                                onClick={() => window.confirm(t('Delete this document? Tijraa will stop using it immediately.')) && router.delete(route('knowledge.destroy', d.id))}
                            >
                                <Trash2 /> {t('Delete')}
                            </Button>
                        </div>
                    )}
                </div>
            }
        >
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
                <Panel title={t('Passages Tijraa can cite')} description={d.status === 'inactive' ? t('This document is inactive, so these passages are not used.') : undefined}>
                    {chunks.length === 0 ? (
                        <EmptyState compact title={d.status === 'failed' ? t('Processing failed') : t('No passages yet')} description={d.error ?? undefined} />
                    ) : (
                        <ol className="space-y-2">
                            {chunks.map((c) => (
                                <li key={c.index} className="rounded-lg border p-3">
                                    <p className="text-muted-foreground mb-1 text-[11px] font-semibold uppercase">
                                        #{c.index + 1}
                                        {c.heading ? ` · ${c.heading}` : ''}
                                    </p>
                                    <p className="text-sm leading-6 whitespace-pre-line">{c.preview}</p>
                                </li>
                            ))}
                        </ol>
                    )}
                </Panel>
                <div className="space-y-5">
                    <Panel title={t('Details')}>
                        <DescriptionList
                            items={[
                                { label: t('File'), value: d.filename },
                                { label: t('Size'), value: `${fmt.number(Math.max(1, Math.round(d.size_bytes / 1024)))} KB` },
                                { label: t('Passages'), value: fmt.number(d.chunks) },
                                { label: t('Times used'), value: fmt.number(d.usage_count) },
                                { label: t('Last used'), value: d.last_used_at ? fmt.relative(d.last_used_at) : t('Never') },
                                { label: t('Updated'), value: fmt.dateTime(d.updated_at) },
                            ]}
                        />
                    </Panel>
                    <Panel title={t('Processing history')}>
                        <ul className="space-y-2 text-sm">
                            {ingestions.map((r, i) => (
                                <li key={i} className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="font-medium">{r.status === 'completed' ? t('Processed') : r.status === 'failed' ? t('Failed at: {{stage}}', { stage: t(STAGES[r.stage ?? ''] ?? r.stage ?? '') }) : t(STAGES[r.stage ?? ''] ?? 'Processing')}</p>
                                        {r.error && <p className="text-danger-fg text-xs">{r.error}</p>}
                                        {r.metrics?.chunks !== undefined && <p className="text-muted-foreground text-xs">{t('{{count}} passages', { count: r.metrics.chunks })}</p>}
                                    </div>
                                    <span className="text-muted-foreground shrink-0 text-xs">{fmt.relative(r.finished_at ?? r.started_at)}</span>
                                </li>
                            ))}
                        </ul>
                    </Panel>
                    <Panel title={t('Versions')}>
                        <ul className="space-y-1 text-sm">
                            {versions.map((v) => (
                                <li key={v.version} className="flex justify-between gap-2">
                                    <span>
                                        v{v.version}
                                        {v.version === d.version && <span className="text-muted-foreground"> · {t('current')}</span>}
                                    </span>
                                    <span className="text-muted-foreground text-xs">{fmt.date(v.created_at)}</span>
                                </li>
                            ))}
                        </ul>
                    </Panel>
                </div>
            </div>
        </PageTemplate>
    );
}
