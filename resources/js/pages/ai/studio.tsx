import { Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import { BookOpen, Check, Loader2, PenLine, RefreshCw, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { PageTemplate } from '@/components/page-template';
import { EmptyState, Panel } from '@/components/ds/layout';
import { SegmentedTabs } from '@/components/ds/data-table';
import { ToneBadge } from '@/components/ds/status-badge';
import { AiBadge, DiffView } from '@/components/ds/ai';
import { AGENT_ERROR, DECISION_ERROR } from '@/components/tijraa/labels';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { AiDescription, BudgetSummary } from '@/lib/tijraa/types';

type Scope = 'product' | 'blog' | 'page';
type Field = 'description' | 'details' | 'seo';

interface Resource {
    id: number;
    label: string;
    thin: boolean;
}

interface PageProps {
    ai: AiDescription;
    budget: BudgetSummary;
    selected: { scope?: Scope; id?: string; field?: Field };
    resources: Record<Scope, Resource[]>;
}

interface Draft {
    fields: { text?: string; title?: string; description?: string; keywords?: string };
    current: string;
    knowledge_used: Array<{ document_uuid: string; document: string; version: number; heading: string | null; excerpt: string }>;
    provider: string;
    model: string;
}

const FIELDS: Record<Scope, Field[]> = { product: ['description', 'details'], blog: ['seo'], page: ['seo'] };
const FIELD_LABEL: Record<Field, string> = { description: 'Description', details: 'Additional details', seo: 'Search title and description' };

/** Current → Generate → Draft → Edit → Review → Save. Nothing is saved until Save. */
export default function ContentStudio() {
    const { t } = useTranslation();
    const { ai, budget, selected, resources } = usePage().props as unknown as PageProps;
    const [scope, setScope] = useState<Scope>(selected.scope ?? 'product');
    const [id, setId] = useState<string>(selected.id ?? '');
    const [field, setField] = useState<Field>(selected.field ?? FIELDS[selected.scope ?? 'product'][0]);
    const [instructions, setInstructions] = useState('');
    const [draft, setDraft] = useState<Draft | null>(null);
    const [edit, setEdit] = useState({ text: '', title: '', description: '' });
    const [stage, setStage] = useState<'idle' | 'generating' | 'review' | 'saving' | 'saved'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [stale, setStale] = useState(false);
    const list = resources[scope] ?? [];
    const isSeo = field === 'seo';

    useEffect(() => {
        if (!FIELDS[scope].includes(field)) setField(FIELDS[scope][0]);
    }, [scope, field]);

    const reset = () => {
        setDraft(null);
        setStage('idle');
        setError(null);
        setStale(false);
    };

    const generate = async () => {
        if (!id) return;
        setStage('generating');
        setError(null);
        try {
            const res = await axios.post(route('ai.content.draft'), { scope, id: Number(id), field, instructions });
            const d = res.data as Draft;
            setDraft(d);
            setEdit({ text: d.fields.text ?? '', title: d.fields.title ?? '', description: d.fields.description ?? '' });
            setStage('review');
        } catch (e) {
            const code = (e as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'provider_error';
            setError(t((AGENT_ERROR[code] ?? AGENT_ERROR.provider_error).title) + ' — ' + t((AGENT_ERROR[code] ?? AGENT_ERROR.provider_error).body));
            setStage(draft ? 'review' : 'idle');
        }
    };

    const save = async (acknowledgeStale = false) => {
        if (!draft) return;
        setStage('saving');
        setError(null);
        try {
            await axios.post(route('ai.content.apply'), {
                scope,
                id: Number(id),
                field,
                text: isSeo ? undefined : edit.text,
                meta_title: isSeo ? edit.title : undefined,
                meta_description: isSeo ? edit.description : undefined,
                knowledge_used: draft.knowledge_used.map((k) => ({ document: k.document, version: k.version, section: k.heading })),
                acknowledge_stale: acknowledgeStale,
            });
            setStage('saved');
            setStale(false);
            toast.success(t('Saved'));
        } catch (e) {
            const data = (e as { response?: { data?: { error?: string; message?: string } } }).response?.data;
            if (data?.error === 'stale') setStale(true);
            setError(t(DECISION_ERROR[data?.error ?? ''] ?? data?.message ?? 'Could not save. Try again.'));
            setStage('review');
        }
    };

    const current = draft?.current ?? '';
    const proposed = isSeo ? `Title: ${edit.title}\nDescription: ${edit.description}` : edit.text;
    const resource = useMemo(() => list.find((r) => String(r.id) === id), [list, id]);
    const openHref = resource ? (scope === 'product' ? route('products.edit', resource.id) : scope === 'blog' ? route('blog.edit', resource.id) : route('custom-pages.edit', resource.id)) : null;

    return (
        <PageTemplate
            title={t('Content Studio')}
            description={t('Draft product copy and search metadata with your brand knowledge. You review every word before it is saved.')}
            url="/ai/studio"
            breadcrumbs={[{ title: t('Dashboard'), href: route('dashboard') }, { title: t('Content Studio') }]}
        >
            <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
                <Panel title={t('What to write')}>
                    <div className="space-y-4">
                        <SegmentedTabs
                            segments={[
                                { value: 'product', label: t('Products') },
                                { value: 'blog', label: t('Blog posts') },
                                { value: 'page', label: t('Pages') },
                            ]}
                            value={scope}
                            onChange={(v) => {
                                setScope(v as Scope);
                                setId('');
                                reset();
                            }}
                            label={t('Content type')}
                        />
                        <div>
                            <span id="st-res" className="text-xs font-medium">
                                {scope === 'product' ? t('Product') : scope === 'blog' ? t('Blog post') : t('Page')}
                            </span>
                            <Select
                                value={id}
                                onValueChange={(v) => {
                                    setId(v);
                                    reset();
                                }}
                            >
                                <SelectTrigger className="mt-1 w-full" aria-labelledby="st-res">
                                    <SelectValue placeholder={t('Choose…')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {list.map((r) => (
                                        <SelectItem key={r.id} value={String(r.id)}>
                                            {r.label}
                                            {r.thin ? ` · ${t(scope === 'product' ? 'thin copy' : 'missing SEO')}` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {FIELDS[scope].length > 1 && (
                            <div>
                                <span id="st-field" className="text-xs font-medium">
                                    {t('Field')}
                                </span>
                                <Select
                                    value={field}
                                    onValueChange={(v) => {
                                        setField(v as Field);
                                        reset();
                                    }}
                                >
                                    <SelectTrigger className="mt-1 w-full" aria-labelledby="st-field">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FIELDS[scope].map((f) => (
                                            <SelectItem key={f} value={f}>
                                                {t(FIELD_LABEL[f])}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div>
                            <label htmlFor="st-ins" className="text-xs font-medium">
                                {t('Instructions (optional)')}
                            </label>
                            <textarea
                                id="st-ins"
                                rows={3}
                                maxLength={500}
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                placeholder={t('e.g. Mention it is handmade. Keep it under 80 words.')}
                                className="border-input bg-background mt-1 w-full rounded-lg border p-2.5 text-sm"
                            />
                        </div>
                        {ai.is_test_model && <ToneBadge tone="warning">{t('Test model — drafts are scripted')}</ToneBadge>}
                        <Button className="w-full" onClick={generate} disabled={!id || stage === 'generating' || stage === 'saving' || !ai.configured || budget.remaining <= 0}>
                            {stage === 'generating' ? <Loader2 className="animate-spin" /> : draft ? <RefreshCw /> : <Sparkles />}
                            {draft ? t('Regenerate') : t('Generate draft')}
                        </Button>
                        {!ai.configured && <p className="text-muted-foreground text-xs">{t(AGENT_ERROR.not_configured.body)}</p>}
                        {ai.configured && budget.remaining <= 0 && <p className="text-muted-foreground text-xs">{t(AGENT_ERROR.budget_exhausted.body)}</p>}
                    </div>
                </Panel>

                <div className="min-w-0 space-y-4">
                    {!draft && stage !== 'generating' ? (
                        <Panel>
                            <EmptyState icon={<PenLine />} title={t('Pick something to write')} description={t('Choose a product, post or page. Your current content stays unchanged until you save.')} />
                        </Panel>
                    ) : stage === 'generating' && !draft ? (
                        <Panel>
                            <p className="flex items-center gap-2 text-sm" aria-live="polite">
                                <Sparkles className="text-ai size-4 animate-pulse motion-reduce:animate-none" aria-hidden /> {t('Drafting with your brand knowledge…')}
                            </p>
                        </Panel>
                    ) : draft ? (
                        <>
                            <Panel title={t('Current')}>
                                <p className="text-muted-foreground max-h-48 overflow-auto text-sm leading-6 whitespace-pre-wrap">{current || t('Empty')}</p>
                            </Panel>
                            <Panel title={<span className="flex items-center gap-2">{t('Draft')} <AiBadge /></span>} description={t('Edit freely — this is what will be saved.')}>
                                {isSeo ? (
                                    <div className="space-y-3">
                                        <div>
                                            <label htmlFor="st-t" className="flex justify-between text-xs font-medium">
                                                <span>{t('Search title')}</span>
                                                <span className={cn('tabular-nums', edit.title.length > 60 ? 'text-danger-fg' : 'text-muted-foreground')}>{edit.title.length}/60</span>
                                            </label>
                                            <input id="st-t" maxLength={70} value={edit.title} onChange={(e) => setEdit((x) => ({ ...x, title: e.target.value }))} className="border-input bg-background mt-1 h-9 w-full rounded-lg border px-3 text-sm" />
                                        </div>
                                        <div>
                                            <label htmlFor="st-d" className="flex justify-between text-xs font-medium">
                                                <span>{t('Search description')}</span>
                                                <span className={cn('tabular-nums', edit.description.length > 155 ? 'text-danger-fg' : 'text-muted-foreground')}>{edit.description.length}/155</span>
                                            </label>
                                            <textarea id="st-d" rows={3} maxLength={170} value={edit.description} onChange={(e) => setEdit((x) => ({ ...x, description: e.target.value }))} className="border-input bg-background mt-1 w-full rounded-lg border p-2.5 text-sm" />
                                        </div>
                                    </div>
                                ) : (
                                    <textarea
                                        aria-label={t('Draft')}
                                        rows={9}
                                        maxLength={5000}
                                        value={edit.text}
                                        onChange={(e) => setEdit((x) => ({ ...x, text: e.target.value }))}
                                        className="border-input bg-background w-full rounded-lg border p-3 text-sm leading-6"
                                    />
                                )}
                            </Panel>
                            {current && (
                                <Panel title={t('Review changes')}>
                                    <div className="bg-background max-h-72 overflow-auto rounded-lg border p-3">
                                        <DiffView before={current} after={proposed} />
                                    </div>
                                </Panel>
                            )}
                            <Panel title={t('Knowledge used')}>
                                {draft.knowledge_used.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">
                                        {t('No knowledge document was used for this draft.')}{' '}
                                        <Link href={route('knowledge.index')} className="text-foreground underline">
                                            {t('Add a brand guide')}
                                        </Link>
                                    </p>
                                ) : (
                                    <ul className="space-y-2">
                                        {draft.knowledge_used.map((k, i) => (
                                            <li key={i} className="text-sm">
                                                <Link href={route('knowledge.show', k.document_uuid)} className="inline-flex items-center gap-1 font-medium hover:underline">
                                                    <BookOpen className="text-success-fg size-3.5" aria-hidden /> {k.document} v{k.version}
                                                    {k.heading ? ` · ${k.heading}` : ''}
                                                </Link>
                                                <p className="text-muted-foreground line-clamp-2 text-xs">{k.excerpt}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </Panel>
                            {error && (
                                <div role="alert" className="bg-warning-soft text-warning-fg space-y-2 rounded-lg p-3 text-sm">
                                    <p>{error}</p>
                                    {stale && (
                                        <Button size="sm" variant="outline" onClick={() => save(true)}>
                                            {t('Save anyway')}
                                        </Button>
                                    )}
                                </div>
                            )}
                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-muted-foreground text-xs">
                                    {stage === 'saved' ? t('Saved and recorded in AI Actions.') : t('Saving applies this text now and records it in AI Actions.')}
                                </p>
                                <div className="flex gap-2">
                                    {openHref && (
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={openHref}>{t('Open editor')}</Link>
                                        </Button>
                                    )}
                                    <Button size="sm" onClick={() => save()} disabled={stage === 'saving' || stage === 'saved' || (isSeo ? !edit.title.trim() && !edit.description.trim() : edit.text.trim().length < 20)}>
                                        {stage === 'saving' ? <Loader2 className="animate-spin" /> : <Check />} {stage === 'saved' ? t('Saved') : t('Save')}
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : null}
                    {error && !draft && (
                        <p role="alert" className="text-danger-fg text-sm">
                            {error}
                        </p>
                    )}
                </div>
            </div>
        </PageTemplate>
    );
}
