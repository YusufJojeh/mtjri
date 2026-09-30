import { Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { BookOpen, FileText, Loader2, RefreshCw, Search, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageTemplate } from '@/components/page-template';
import { EmptyState, MetricCard, Panel } from '@/components/ds/layout';
import { ToneBadge } from '@/components/ds/status-badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCommerceFormat } from '@/hooks/use-commerce-format';
import { usePermissions } from '@/hooks/usePermissions';
import { DOC_STATUS, DOC_TYPE_LABEL, type KnowledgeDoc } from '@/components/tijraa/knowledge-labels';

interface PageProps {
    documents: KnowledgeDoc[];
    types: string[];
    stats: { ready: number; processing: number; failed: number; inactive: number; chunks: number };
    limits: { max_kb: number; extensions: string[] };
    embedder: string;
}

interface Hit {
    document: string;
    document_id: string;
    version: number;
    type: string;
    section: string | null;
    excerpt: string;
    score: number;
}

export default function KnowledgeIndex() {
    const { t } = useTranslation();
    const fmt = useCommerceFormat();
    const { hasPermission } = usePermissions();
    const canManage = hasPermission('manage-knowledge');
    const { documents, types, stats, limits } = usePage().props as unknown as PageProps;
    const [docs, setDocs] = useState(documents);
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [type, setType] = useState('brand_guide');
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [hits, setHits] = useState<Hit[] | null>(null);
    const [latency, setLatency] = useState<number | null>(null);
    const [searching, setSearching] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => setDocs(documents), [documents]);

    // Poll documents that are still being processed.
    useEffect(() => {
        const busy = docs.filter((d) => d.status === 'uploading' || d.status === 'processing');
        if (!busy.length) return;
        const timer = setTimeout(async () => {
            const updates = await Promise.all(busy.map((d) => axios.get(route('knowledge.status', d.id)).then((r) => r.data.document as KnowledgeDoc).catch(() => d)));
            setDocs((list) => list.map((d) => updates.find((u) => u.id === d.id) ?? d));
            if (updates.some((u) => u.status === 'ready' || u.status === 'failed')) router.reload({ only: ['stats', 'tijraa'] });
        }, 1500);
        return () => clearTimeout(timer);
    }, [docs]);

    const upload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;
        setUploading(true);
        setUploadError(null);
        const form = new FormData();
        form.append('file', file);
        form.append('type', type);
        if (title.trim()) form.append('title', title.trim());
        try {
            const res = await axios.post(route('knowledge.store'), form, { headers: { Accept: 'application/json' } });
            setDocs((list) => [res.data.document, ...list]);
            setFile(null);
            setTitle('');
            if (fileRef.current) fileRef.current.value = '';
        } catch (err) {
            const data = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data;
            setUploadError(Object.values(data?.errors ?? {})[0]?.[0] ?? data?.message ?? t('Upload failed. Try again.'));
        } finally {
            setUploading(false);
        }
    };

    const search = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        setSearching(true);
        try {
            const res = await axios.post(route('knowledge.search'), { query });
            setHits(res.data.results);
            setLatency(res.data.latency_ms);
        } finally {
            setSearching(false);
        }
    };

    return (
        <PageTemplate
            title={t('Knowledge')}
            description={t('Documents Tijraa can cite: brand voice, policies, FAQs and playbooks. Only this store can use them.')}
            url="/knowledge"
            breadcrumbs={[{ title: t('Dashboard'), href: route('dashboard') }, { title: t('Knowledge') }]}
        >
            <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <MetricCard label={t('Ready')} value={fmt.number(stats.ready)} hint={t('{{count}} searchable passages', { count: stats.chunks })} />
                    <MetricCard label={t('Processing')} value={fmt.number(stats.processing)} />
                    <MetricCard label={t('Failed')} value={fmt.number(stats.failed)} emphasis={stats.failed ? 'danger' : 'default'} />
                    <MetricCard label={t('Inactive')} value={fmt.number(stats.inactive)} hint={t('Not used by Tijraa')} />
                </div>

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
                    <Panel title={t('Documents')} flush>
                        {docs.length === 0 ? (
                            <EmptyState icon={<BookOpen />} title={t('No documents yet')} description={t('Upload a brand guide or returns policy so Tijraa writes and answers the way your store does.')} />
                        ) : (
                            <ul className="divide-y border-t">
                                {docs.map((d) => {
                                    const st = DOC_STATUS[d.status];
                                    return (
                                        <li key={d.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                                            <FileText className="text-muted-foreground size-5 shrink-0" aria-hidden />
                                            <div className="min-w-0 flex-1">
                                                <Link href={route('knowledge.show', d.id)} className="block truncate text-sm font-medium hover:underline">
                                                    {d.title}
                                                </Link>
                                                <p className="text-muted-foreground truncate text-xs">
                                                    {t(DOC_TYPE_LABEL[d.type] ?? d.type)} · v{d.version || 1}
                                                    {d.status === 'ready' ? ` · ${t('{{count}} passages', { count: d.chunks })}` : ''}
                                                    {d.usage_count ? ` · ${t('used {{count}} times', { count: d.usage_count })}` : ''}
                                                </p>
                                                {d.status === 'failed' && d.error && <p className="text-danger-fg mt-0.5 text-xs">{d.error}</p>}
                                            </div>
                                            <ToneBadge tone={st.tone} icon={d.status === 'processing' || d.status === 'uploading' ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden /> : undefined}>
                                                {t(st.label)}
                                            </ToneBadge>
                                            {d.status === 'failed' && canManage && (
                                                <Button size="sm" variant="ghost" aria-label={t('Retry processing')} onClick={() => axios.post(route('knowledge.retry', d.id), {}, { headers: { Accept: 'application/json' } }).then((r) => setDocs((l) => l.map((x) => (x.id === d.id ? r.data.document : x))))}>
                                                    <RefreshCw />
                                                </Button>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </Panel>

                    <div className="space-y-5">
                        {canManage && (
                            <Panel title={t('Add a document')} description={t('{{types}} · up to {{size}} MB', { types: limits.extensions.join(', '), size: Math.round(limits.max_kb / 1024) })}>
                                <form onSubmit={upload} className="space-y-3">
                                    <div>
                                        <label htmlFor="kn-file" className="text-xs font-medium">
                                            {t('File')}
                                        </label>
                                        <input
                                            id="kn-file"
                                            ref={fileRef}
                                            type="file"
                                            accept={limits.extensions.map((x) => '.' + x).join(',')}
                                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                            className="file:bg-muted mt-1 block w-full text-sm file:me-3 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="kn-title" className="text-xs font-medium">
                                            {t('Title (optional)')}
                                        </label>
                                        <input id="kn-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} className="border-input bg-background mt-1 h-9 w-full rounded-lg border px-3 text-sm" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-medium" id="kn-type-label">
                                            {t('Type')}
                                        </span>
                                        <Select value={type} onValueChange={setType}>
                                            <SelectTrigger className="mt-1 w-full" aria-labelledby="kn-type-label">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {types.map((ty) => (
                                                    <SelectItem key={ty} value={ty}>
                                                        {t(DOC_TYPE_LABEL[ty] ?? ty)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {uploadError && (
                                        <p role="alert" className="text-danger-fg text-xs">
                                            {uploadError}
                                        </p>
                                    )}
                                    <p className="text-muted-foreground text-xs">{t('Documents are reference material. Instructions inside them are never followed.')}</p>
                                    <Button type="submit" size="sm" disabled={!file || uploading} className="w-full">
                                        {uploading ? <Loader2 className="animate-spin" /> : <Upload />} {t('Upload')}
                                    </Button>
                                </form>
                            </Panel>
                        )}

                        <Panel title={t('Test retrieval')} description={t('See exactly which passages Tijraa would use for a question.')}>
                            <form onSubmit={search} className="flex gap-2">
                                <label htmlFor="kn-q" className="sr-only">
                                    {t('Question')}
                                </label>
                                <input id="kn-q" value={query} onChange={(e) => setQuery(e.target.value)} maxLength={300} placeholder={t('e.g. What is our return window?')} className="border-input bg-background h-9 min-w-0 flex-1 rounded-lg border px-3 text-sm" />
                                <Button type="submit" size="sm" variant="outline" disabled={searching || !query.trim()} aria-label={t('Search')}>
                                    {searching ? <Loader2 className="animate-spin" /> : <Search />}
                                </Button>
                            </form>
                            {hits && (
                                <div className="mt-3 space-y-2" aria-live="polite">
                                    <p className="text-muted-foreground text-xs">{t('{{count}} results in {{ms}} ms', { count: hits.length, ms: latency ?? 0 })}</p>
                                    {hits.length === 0 && <p className="text-sm">{t('No active document matches this question.')}</p>}
                                    {hits.map((h, i) => (
                                        <div key={i} className="rounded-lg border p-2.5 text-xs">
                                            <div className="flex items-center justify-between gap-2">
                                                <Link href={route('knowledge.show', h.document_id)} className="truncate font-medium hover:underline">
                                                    {h.document} v{h.version}
                                                    {h.section ? ` · ${h.section}` : ''}
                                                </Link>
                                                <span className="text-muted-foreground tabular-nums">{h.score.toFixed(2)}</span>
                                            </div>
                                            <p className="text-muted-foreground mt-1 line-clamp-3">{h.excerpt}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Panel>
                    </div>
                </div>
            </div>
        </PageTemplate>
    );
}
