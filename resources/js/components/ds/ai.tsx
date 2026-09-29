import { Check, Pencil, RefreshCw, Sparkles, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { diffWords } from '@/lib/commerce/diff';
import { AI_ERROR_COPY, type AiErrorCode } from '@/lib/commerce/ai';

/** Marks content as AI-generated. Always text + icon, never color alone. */
export function AiBadge({ children, className }: { children?: React.ReactNode; className?: string }) {
    const { t } = useTranslation();
    return (
        <span className={cn('bg-ai-soft text-ai-fg inline-flex h-5 items-center gap-1 rounded-full px-1.5 text-[11px] font-semibold', className)}>
            <Sparkles className="size-3" aria-hidden />
            {children ?? t('AI draft')}
        </span>
    );
}

export function DiffView({ before, after, className }: { before: string; after: string; className?: string }) {
    const { t } = useTranslation();
    const parts = useMemo(() => diffWords(before, after), [before, after]);
    return (
        <p className={cn('text-sm leading-6 whitespace-pre-wrap break-words', className)} aria-label={t('Changes')}>
            {parts.map((p, i) =>
                p.type === 'same' ? (
                    <span key={i}>{p.text}</span>
                ) : p.type === 'added' ? (
                    <ins key={i} className="bg-success-soft text-success-fg rounded-sm no-underline decoration-transparent">
                        <span className="sr-only">{t('Added')}: </span>
                        {p.text}
                    </ins>
                ) : (
                    <del key={i} className="bg-danger-soft text-danger-fg rounded-sm line-through decoration-1">
                        <span className="sr-only">{t('Removed')}: </span>
                        {p.text}
                    </del>
                ),
            )}
        </p>
    );
}

export type ProposalState =
    | { status: 'idle' }
    | { status: 'generating' }
    | { status: 'ready'; value: string }
    | { status: 'error'; code: AiErrorCode }
    | { status: 'applied' };

interface AiProposalProps {
    /** Human label for the field, e.g. "Description". */
    field: string;
    current: string;
    state: ProposalState;
    onAccept: (value: string) => void;
    onReject: () => void;
    onRegenerate?: () => void;
    /** Explain what "accept" does so merchants know nothing is saved yet. */
    acceptHint?: string;
    multiline?: boolean;
    className?: string;
}

/**
 * Current-vs-proposal review. Accepting only hands the value back to the
 * caller (usually a form field); nothing is persisted until the merchant saves.
 */
export function AiProposal({ field, current, state, onAccept, onReject, onRegenerate, acceptHint, multiline = true, className }: AiProposalProps) {
    const { t } = useTranslation();
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const [view, setView] = useState<'changes' | 'side'>('changes');

    if (state.status === 'idle' || state.status === 'applied') return null;

    const wrap = (children: React.ReactNode) => (
        <div role="region" aria-label={t('AI proposal for {{field}}', { field })} className={cn('border-ai/30 bg-ai-soft/40 rounded-xl border', className)} aria-live="polite">
            {children}
        </div>
    );

    if (state.status === 'generating') {
        return wrap(
            <div className="flex items-center gap-3 p-4">
                <Sparkles className="text-ai size-4 animate-pulse motion-reduce:animate-none" aria-hidden />
                <div>
                    <p className="text-sm font-medium">{t('Drafting {{field}}', { field: field.toLowerCase() })}</p>
                    <p className="text-muted-foreground text-xs">{t('Your current content stays unchanged until you accept')}</p>
                </div>
            </div>,
        );
    }

    if (state.status === 'error') {
        const copy = AI_ERROR_COPY[state.code];
        return wrap(
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-medium">{t(copy.title)}</p>
                    <p className="text-muted-foreground text-xs">{t(copy.body)}</p>
                </div>
                <div className="flex gap-2">
                    {onRegenerate && state.code !== 'not_configured' && (
                        <Button size="sm" variant="outline" onClick={onRegenerate}>
                            <RefreshCw /> {t('Try again')}
                        </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={onReject}>
                        {t('Dismiss')}
                    </Button>
                </div>
            </div>,
        );
    }

    const proposal = state.value;
    return wrap(
        <div className="p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <AiBadge>{t('AI proposal')}</AiBadge>
                    <span className="text-sm font-medium">{field}</span>
                </div>
                {!editing && current && (
                    <div className="bg-background inline-flex rounded-lg border p-0.5 text-xs" role="group" aria-label={t('Comparison view')}>
                        {(['changes', 'side'] as const).map((v) => (
                            <button
                                key={v}
                                type="button"
                                aria-pressed={view === v}
                                onClick={() => setView(v)}
                                className={cn('rounded-md px-2 py-1 font-medium', view === v ? 'bg-muted text-foreground' : 'text-muted-foreground')}
                            >
                                {v === 'changes' ? t('Changes') : t('Side by side')}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {editing ? (
                <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={multiline ? 8 : 2}
                    aria-label={t('Edit proposal')}
                    className="border-input bg-background focus-visible:ring-ring/40 w-full rounded-lg border p-3 text-sm leading-6 outline-none focus-visible:ring-[3px]"
                />
            ) : !current ? (
                <div className="bg-background rounded-lg border p-3">
                    <p className="text-sm leading-6 whitespace-pre-wrap">{proposal}</p>
                </div>
            ) : view === 'changes' ? (
                <div className="bg-background max-h-80 overflow-auto rounded-lg border p-3">
                    <DiffView before={current} after={proposal} />
                </div>
            ) : (
                <div className="grid gap-2 md:grid-cols-2">
                    <div className="bg-background rounded-lg border p-3">
                        <p className="text-muted-foreground mb-1 text-[11px] font-semibold uppercase">{t('Current')}</p>
                        <p className="max-h-72 overflow-auto text-sm leading-6 whitespace-pre-wrap">{current}</p>
                    </div>
                    <div className="bg-background border-ai/40 rounded-lg border p-3">
                        <p className="text-ai-fg mb-1 text-[11px] font-semibold uppercase">{t('Proposed')}</p>
                        <p className="max-h-72 overflow-auto text-sm leading-6 whitespace-pre-wrap">{proposal}</p>
                    </div>
                </div>
            )}

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground text-xs">{acceptHint ?? t('Accepting fills the field — nothing is saved until you save the product')}</p>
                <div className="flex flex-wrap gap-2">
                    {editing ? (
                        <>
                            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                                {t('Cancel')}
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => {
                                    onAccept(draft);
                                    setEditing(false);
                                }}
                                disabled={!draft.trim()}
                            >
                                <Check /> {t('Use edited version')}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button size="sm" variant="ghost" onClick={onReject}>
                                <X /> {t('Reject')}
                            </Button>
                            {onRegenerate && (
                                <Button size="sm" variant="outline" onClick={onRegenerate}>
                                    <RefreshCw /> {t('Regenerate')}
                                </Button>
                            )}
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    setDraft(proposal);
                                    setEditing(true);
                                }}
                            >
                                <Pencil /> {t('Edit')}
                            </Button>
                            <Button size="sm" onClick={() => onAccept(proposal)}>
                                <Check /> {t('Accept')}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>,
    );
}
