import { BookOpen, Database, ExternalLink, Lightbulb, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ToneBadge } from '@/components/ds/status-badge';
import { SectionLabel } from '@/components/ds/layout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Answer, SourceKind } from '@/lib/tijraa/types';
import { SOURCE_LABEL } from './labels';

export function SourceBadge({ kind }: { kind: SourceKind }) {
    const { t } = useTranslation();
    const meta = SOURCE_LABEL[kind] ?? SOURCE_LABEL.ai_interpretation;
    const Icon = kind === 'store_data' ? Database : kind === 'knowledge' ? BookOpen : Sparkles;
    return (
        <ToneBadge tone={meta.tone} icon={<Icon aria-hidden />} className="h-5 text-[11px]">
            {t(meta.label)}
        </ToneBadge>
    );
}

const PRIORITY_TONE = { high: 'danger', medium: 'warning', low: 'neutral' } as const;

/**
 * Answer hierarchy: direct answer → key findings (each labelled by source) →
 * recommended actions → evidence. Citations come from the server (tools
 * actually used), never from the model's text.
 */
export function AnswerCard({ answer, onAsk, className }: { answer: Answer; onAsk?: (q: string) => void; className?: string }) {
    const { t } = useTranslation();
    const store = answer.sources?.store_data ?? [];
    const knowledge = answer.sources?.knowledge ?? [];
    return (
        <div className={cn('space-y-4', className)}>
            <p className="text-[15px] leading-7 whitespace-pre-line">{answer.executive_answer}</p>

            {answer.key_findings.length > 0 && (
                <div className="space-y-2">
                    <SectionLabel>{t('Key findings')}</SectionLabel>
                    <ul className="space-y-2">
                        {answer.key_findings.map((f, i) => (
                            <li key={i} className="flex flex-col gap-1 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                                <span className="text-sm leading-6">{f.text}</span>
                                <span className="shrink-0">
                                    <SourceBadge kind={f.source} />
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {answer.recommended_actions.length > 0 && (
                <div className="space-y-2">
                    <SectionLabel>{t('Recommended actions')}</SectionLabel>
                    <ul className="space-y-2">
                        {answer.recommended_actions.map((r, i) => (
                            <li key={i} className="flex gap-3 rounded-lg border p-3">
                                <Lightbulb className="text-warning-fg mt-0.5 size-4 shrink-0" aria-hidden />
                                <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-medium">{r.title}</span>
                                        {r.priority && (
                                            <ToneBadge tone={PRIORITY_TONE[r.priority]} className="h-5 text-[11px]">
                                                {t(r.priority === 'high' ? 'High priority' : r.priority === 'medium' ? 'Medium priority' : 'Low priority')}
                                            </ToneBadge>
                                        )}
                                    </div>
                                    <p className="text-muted-foreground text-sm">{r.why}</p>
                                    {r.can_prepare && onAsk && (
                                        <Button size="sm" variant="outline" className="mt-1" onClick={() => onAsk(t('Prepare this: {{title}}', { title: r.title }))}>
                                            <Sparkles /> {t('Prepare it for review')}
                                        </Button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {(store.length > 0 || knowledge.length > 0) && (
                <details className="group rounded-lg border">
                    <summary className="text-muted-foreground hover:text-foreground flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs font-medium">
                        <span>{t('Evidence used ({{count}})', { count: store.length + knowledge.length })}</span>
                        <span aria-hidden className="transition-transform group-open:rotate-90 rtl:rotate-180 rtl:group-open:rotate-90">›</span>
                    </summary>
                    <div className="space-y-3 border-t px-3 py-3">
                        {store.length > 0 && (
                            <div className="space-y-1.5">
                                <SourceBadge kind="store_data" />
                                <ul className="flex flex-wrap gap-1.5">
                                    {store.map((s, i) => (
                                        <li key={i}>
                                            {s.url ? (
                                                <a href={s.url} className="bg-muted hover:bg-muted/70 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs">
                                                    {s.label} <ExternalLink className="size-3 rtl:-scale-x-100" aria-hidden />
                                                </a>
                                            ) : (
                                                <span className="bg-muted inline-flex rounded-md px-2 py-1 text-xs">{s.label}</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {knowledge.length > 0 && (
                            <div className="space-y-1.5">
                                <SourceBadge kind="knowledge" />
                                <ul className="space-y-1.5">
                                    {knowledge.map((k, i) => (
                                        <li key={i} className="text-xs">
                                            <a href={k.url} className="font-medium hover:underline">
                                                {k.label}
                                            </a>
                                            {k.section && <span className="text-muted-foreground"> · {k.section}</span>}
                                            {k.excerpt && <p className="text-muted-foreground mt-0.5 line-clamp-2">{k.excerpt}</p>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </details>
            )}

            {answer.follow_up_questions.length > 0 && onAsk && (
                <div className="flex flex-wrap gap-2">
                    {answer.follow_up_questions.map((q, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => onAsk(q)}
                            className="hover:bg-muted focus-visible:ring-ring/40 rounded-full border px-3 py-1.5 text-start text-xs outline-none focus-visible:ring-[3px]"
                        >
                            {q}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
