import { AlertTriangle, BookOpen, Check, Clock, ExternalLink, Loader2, Pencil, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ToneBadge } from '@/components/ds/status-badge';
import { DiffView } from '@/components/ds/ai';
import { SectionLabel } from '@/components/ds/layout';
import { Button } from '@/components/ui/button';
import { useCommerceFormat } from '@/hooks/use-commerce-format';
import { cn } from '@/lib/utils';
import { approveAction, DecisionError, rejectAction } from '@/lib/tijraa/api';
import type { AgentActionView, PreviewField } from '@/lib/tijraa/types';
import { ACTION_STATUS, ACTION_TYPE_LABEL, DECISION_ERROR } from './labels';

function useFieldFormat() {
    const fmt = useCommerceFormat();
    return (f: PreviewField, v: PreviewField['after']): string => {
        if (v === null || v === undefined || v === '') return '';
        switch (f.format) {
            case 'money':
                return fmt.money(v);
            case 'percent':
                return `${fmt.number(v)}%`;
            case 'number':
                return fmt.number(v);
            case 'date':
                return fmt.date(String(v));
            default:
                return String(v);
        }
    };
}

/** One field of a proposal: before → after, as a word diff for text. */
function FieldDiff({ field, value, editing, onEdit }: { field: PreviewField; value: string; editing: boolean; onEdit: (v: string) => void }) {
    const { t } = useTranslation();
    const format = useFieldFormat();
    const before = format(field, field.before);
    const after = format(field, value);
    const long = field.format === 'html' || (field.format === 'text' && Math.max(String(field.before ?? '').length, String(value ?? '').length) > 80);
    return (
        <div className="space-y-1.5">
            <div className="text-muted-foreground text-xs font-medium">{t(field.label)}</div>
            {editing && field.editable ? (
                long && String(value).length > 60 ? (
                    <textarea
                        value={value}
                        onChange={(e) => onEdit(e.target.value)}
                        rows={6}
                        aria-label={t('Edit {{field}}', { field: t(field.label) })}
                        className="border-input bg-background focus-visible:ring-ring/40 w-full rounded-lg border p-3 text-sm leading-6 outline-none focus-visible:ring-[3px]"
                    />
                ) : (
                    <input
                        value={value}
                        onChange={(e) => onEdit(e.target.value)}
                        aria-label={t('Edit {{field}}', { field: t(field.label) })}
                        className="border-input bg-background focus-visible:ring-ring/40 h-9 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-[3px]"
                    />
                )
            ) : before && long ? (
                <div className="bg-background max-h-72 overflow-auto rounded-lg border p-3">
                    <DiffView before={before} after={after} />
                </div>
            ) : before ? (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <del className="text-muted-foreground">{before}</del>
                    <span aria-hidden className="rtl:rotate-180">→</span>
                    <ins className="font-medium no-underline">{after}</ins>
                </div>
            ) : (
                <div className={cn('text-sm break-words', field.format === 'code' && 'font-mono font-semibold tracking-wide', long && 'bg-background rounded-lg border p-3 leading-6 whitespace-pre-wrap')}>
                    {after || <span className="text-muted-foreground">{t('Empty')}</span>}
                </div>
            )}
        </div>
    );
}

interface ActionCardProps {
    action: AgentActionView;
    onChange?: (a: AgentActionView) => void;
    compact?: boolean;
    className?: string;
}

/**
 * Review surface for a proposed change. Approving sends the payload hash the
 * merchant actually reviewed; the server re-checks permission, store, expiry
 * and whether the current content changed since the proposal.
 */
export function ActionCard({ action, onChange, compact, className }: ActionCardProps) {
    const { t } = useTranslation();
    const fmt = useCommerceFormat();
    const [editing, setEditing] = useState(false);
    const [edits, setEdits] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [stale, setStale] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [note, setNote] = useState('');
    const status = ACTION_STATUS[action.status] ?? ACTION_STATUS.pending;
    const pending = action.status === 'pending';
    const fields = action.preview?.fields ?? [];
    const editable = pending && action.can_decide && fields.some((f) => f.editable);

    const decide = async (kind: 'approve' | 'reject', acknowledgeStale = false) => {
        setBusy(kind);
        setError(null);
        try {
            const changed = Object.fromEntries(Object.entries(edits).filter(([k, v]) => String(fields.find((f) => f.key === k)?.after ?? '') !== v));
            const next = kind === 'approve' ? await approveAction(action, Object.keys(changed).length ? changed : undefined, acknowledgeStale) : await rejectAction(action, note || undefined);
            setEditing(false);
            setRejecting(false);
            setStale(false);
            onChange?.(next);
            if (next.status === 'executed') toast.success(t('Change applied'));
            else if (next.status === 'rejected') toast(t('Proposal rejected'));
            else if (next.status === 'failed') toast.error(t('The change could not be applied'));
        } catch (e) {
            const err = e as DecisionError;
            if (err.code === 'stale') setStale(true);
            setError(t(DECISION_ERROR[err.code] ?? (err.message || 'Something went wrong. Try again.')));
        } finally {
            setBusy(null);
        }
    };

    return (
        <article aria-label={t(ACTION_TYPE_LABEL[action.type] ?? 'Proposed change')} className={cn('bg-card rounded-xl border', pending && 'border-warning/40', className)}>
            <header className="flex flex-wrap items-start justify-between gap-2 border-b px-4 py-3">
                <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">{t(ACTION_TYPE_LABEL[action.type] ?? 'Proposed change')}</span>
                        <ToneBadge tone={status.tone}>{t(status.label)}</ToneBadge>
                        {action.risk !== 'low' && (
                            <ToneBadge tone={action.risk === 'high' ? 'danger' : 'warning'} icon={<AlertTriangle aria-hidden />}>
                                {t(action.risk === 'high' ? 'High impact' : 'Medium impact')}
                            </ToneBadge>
                        )}
                        {action.edited && <ToneBadge tone="neutral">{t('Edited before approval')}</ToneBadge>}
                    </div>
                    {action.resource.label && (
                        <div className="text-muted-foreground flex items-center gap-1 text-xs">
                            {action.resource.url ? (
                                <a href={action.resource.url} className="hover:text-foreground inline-flex items-center gap-1 hover:underline">
                                    {action.resource.label} <ExternalLink className="size-3 rtl:-scale-x-100" aria-hidden />
                                </a>
                            ) : (
                                action.resource.label
                            )}
                        </div>
                    )}
                </div>
                {pending && action.expires_at && (
                    <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                        <Clock className="size-3" aria-hidden />
                        {t('Expires {{when}}', { when: fmt.relative(action.expires_at) })}
                    </span>
                )}
            </header>

            <div className="space-y-4 px-4 py-4">
                {(action.goal || action.rationale) && !compact && (
                    <div className="space-y-1">
                        {action.goal && <p className="text-sm font-medium">{action.goal}</p>}
                        {action.rationale && <p className="text-muted-foreground text-sm">{action.rationale}</p>}
                    </div>
                )}

                <div className="space-y-3">
                    {fields.map((f) => (
                        <FieldDiff key={f.key} field={f} value={edits[f.key] ?? String(f.after ?? '')} editing={editing} onEdit={(v) => setEdits((e) => ({ ...e, [f.key]: v }))} />
                    ))}
                </div>

                {action.knowledge_used?.length > 0 && (
                    <div className="space-y-1">
                        <SectionLabel>{t('Knowledge used')}</SectionLabel>
                        <ul className="flex flex-wrap gap-1.5">
                            {action.knowledge_used.map((k, i) => (
                                <li key={i} className="bg-success-soft text-success-fg inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs">
                                    <BookOpen className="size-3" aria-hidden />
                                    {k.document} v{k.version}
                                    {k.section ? ` · ${k.section}` : ''}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {action.status === 'failed' && action.failure_reason && (
                    <p role="alert" className="bg-danger-soft text-danger-fg rounded-lg p-3 text-sm">
                        {action.failure_reason}
                    </p>
                )}
                {!pending && action.decided_by && (
                    <p className="text-muted-foreground text-xs">
                        {t('{{status}} by {{name}} · {{when}}', { status: t(status.label), name: action.decided_by, when: fmt.relative(action.decided_at) })}
                        {action.decision_note ? ` — “${action.decision_note}”` : ''}
                    </p>
                )}

                {error && (
                    <div role="alert" className="bg-warning-soft text-warning-fg space-y-2 rounded-lg p-3 text-sm">
                        <p>{error}</p>
                        {stale && (
                            <Button size="sm" variant="outline" onClick={() => decide('approve', true)} disabled={!!busy}>
                                {t('Apply anyway')}
                            </Button>
                        )}
                    </div>
                )}

                {pending && !action.can_decide && <p className="text-muted-foreground text-xs">{t('Someone with approval permission needs to review this change.')}</p>}

                {pending && action.can_decide && (
                    <div className="space-y-2">
                        {rejecting && (
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={2}
                                maxLength={500}
                                placeholder={t('Optional: tell Tijraa why (it will not propose this again)')}
                                aria-label={t('Reason for rejecting')}
                                className="border-input bg-background focus-visible:ring-ring/40 w-full rounded-lg border p-2 text-sm outline-none focus-visible:ring-[3px]"
                            />
                        )}
                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-muted-foreground text-xs">{t('Nothing changes in your store until you approve.')}</p>
                            <div className="flex flex-wrap gap-2">
                                {rejecting ? (
                                    <>
                                        <Button size="sm" variant="ghost" onClick={() => setRejecting(false)} disabled={!!busy}>
                                            {t('Cancel')}
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => decide('reject')} disabled={!!busy}>
                                            {busy === 'reject' ? <Loader2 className="animate-spin" /> : <X />} {t('Confirm reject')}
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button size="sm" variant="ghost" onClick={() => setRejecting(true)} disabled={!!busy}>
                                            <X /> {t('Reject')}
                                        </Button>
                                        {editable && (
                                            <Button size="sm" variant="outline" onClick={() => setEditing((v) => !v)} disabled={!!busy} aria-pressed={editing}>
                                                <Pencil /> {editing ? t('Done editing') : t('Edit')}
                                            </Button>
                                        )}
                                        <Button size="sm" onClick={() => decide('approve')} disabled={!!busy}>
                                            {busy === 'approve' ? <Loader2 className="animate-spin" /> : <Check />} {t('Approve and apply')}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </article>
    );
}
