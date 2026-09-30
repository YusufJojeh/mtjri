import { BookOpen, Check, CircleAlert, Loader2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { RunEvent } from '@/lib/tijraa/types';

export interface ProgressStep {
    id: string;
    label: string;
    state: 'active' | 'done' | 'failed';
    kind: 'model' | 'tool' | 'knowledge' | 'action';
    detail?: string;
}

/**
 * Folds run events into merchant-facing progress steps. Uses the server's
 * progress labels only — never tool names, arguments or model reasoning.
 */
/** Merchant-facing step labels (English source strings, translated at render). */
const LABEL = {
    understanding: 'Understanding your question',
    deciding: 'Deciding the next step',
    resumed: 'Continuing after your decision',
    stepFailed: 'A step could not be completed',
    knowledgeFound: 'Found relevant knowledge',
    knowledgeNone: 'No matching knowledge',
    proposed: 'Prepared a change for your review',
};

const withoutModel = (steps: ProgressStep[]) => steps.filter((s) => s.kind !== 'model');

export function reduceProgress(steps: ProgressStep[], e: RunEvent): ProgressStep[] {
    const p = e.payload as Record<string, unknown>;
    const label = typeof p.label === 'string' ? p.label : '';
    const closeActive = (list: ProgressStep[], kind: ProgressStep['kind'], state: 'done' | 'failed') => {
        const idx = [...list].reverse().findIndex((s) => s.kind === kind && s.state === 'active');
        if (idx === -1) return list;
        const i = list.length - 1 - idx;
        return list.map((s, j) => (j === i ? { ...s, state } : s));
    };
    switch (e.type) {
        case 'agent_started':
            return [];
        case 'agent_resumed':
            return [...withoutModel(steps), { id: `r${e.seq}`, label: LABEL.resumed, state: 'done', kind: 'action' }];
        case 'model_started':
            // Transient: shown only until the next concrete step begins.
            return [...withoutModel(steps), { id: `m${e.seq}`, label: steps.length ? LABEL.deciding : LABEL.understanding, state: 'active', kind: 'model' }];
        case 'tool_started':
            return [...withoutModel(steps), { id: `t${e.seq}`, label, state: 'active', kind: 'tool' }];
        case 'tool_completed':
            return closeActive(steps, 'tool', 'done');
        case 'tool_failed':
            return steps.some((s) => s.kind === 'tool' && s.state === 'active')
                ? closeActive(steps, 'tool', 'failed')
                : [...steps, { id: `f${e.seq}`, label: label || LABEL.stepFailed, state: 'failed', kind: 'tool' }];
        case 'knowledge_search_completed': {
            const docs = Array.isArray(p.documents) ? (p.documents as string[]) : [];
            return [...steps, { id: `k${e.seq}`, label: docs.length ? LABEL.knowledgeFound : LABEL.knowledgeNone, state: 'done', kind: 'knowledge', detail: docs.join(', ') }];
        }
        case 'action_proposed':
            return [...withoutModel(steps), { id: `a${e.seq}`, label: LABEL.proposed, state: 'done', kind: 'action', detail: typeof p.resource === 'string' ? p.resource : undefined }];
        case 'agent_completed':
        case 'waiting_for_approval':
        case 'agent_failed':
        case 'agent_cancelled':
            return withoutModel(steps).map((s) => (s.state === 'active' ? { ...s, state: e.type === 'agent_failed' ? 'failed' : 'done' } : s));
        default:
            return steps;
    }
}

export function ProgressFeed({ steps, className }: { steps: ProgressStep[]; className?: string }) {
    const { t } = useTranslation();
    if (!steps.length) return null;
    return (
        <ol aria-label={t('Progress')} aria-live="polite" className={cn('space-y-1.5', className)}>
            {steps.map((s) => (
                <li key={s.id} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 shrink-0" aria-hidden>
                        {s.state === 'active' ? (
                            <Loader2 className="text-ai size-4 animate-spin motion-reduce:animate-none" />
                        ) : s.state === 'failed' ? (
                            <CircleAlert className="text-warning-fg size-4" />
                        ) : s.kind === 'knowledge' ? (
                            <BookOpen className="text-success-fg size-4" />
                        ) : s.kind === 'action' ? (
                            <Sparkles className="text-ai size-4" />
                        ) : (
                            <Check className="text-success-fg size-4" />
                        )}
                    </span>
                    <span className={cn('min-w-0', s.state === 'active' ? 'text-foreground' : 'text-muted-foreground')}>
                        {t(s.label)}
                        {s.detail && <span className="text-muted-foreground"> — {s.detail}</span>}
                        <span className="sr-only">{s.state === 'active' ? t('in progress') : s.state === 'failed' ? t('could not complete') : t('done')}</span>
                    </span>
                </li>
            ))}
        </ol>
    );
}
