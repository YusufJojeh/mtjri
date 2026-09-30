import { Link, usePage } from '@inertiajs/react';
import { ArrowUp, History, Loader2, MessageSquarePlus, RotateCcw, Sparkles, Square, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageTemplate } from '@/components/page-template';
import { EmptyState, Panel } from '@/components/ds/layout';
import { ToneBadge } from '@/components/ds/status-badge';
import { ActionCard } from '@/components/tijraa/action-card';
import { AnswerCard } from '@/components/tijraa/answer-card';
import { ProgressFeed, reduceProgress, type ProgressStep } from '@/components/tijraa/progress-feed';
import { AGENT_ERROR } from '@/components/tijraa/labels';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useCommerceFormat } from '@/hooks/use-commerce-format';
import { cn } from '@/lib/utils';
import { cancelRun, fetchRun, sendFollowUp, startRun } from '@/lib/tijraa/api';
import type { AiDescription, BudgetSummary, RunEvent, RunSummary, RunView } from '@/lib/tijraa/types';
import { useRunStream } from '@/lib/tijraa/use-run-stream';

interface PageProps {
    runs: RunSummary[];
    run: RunView | null;
    ai: AiDescription;
    budget: BudgetSummary;
    context: { resource_type: string; resource_id: number } | null;
    prefill: string;
    insights: Array<{ id: number; type: string; severity: string; title: string }>;
}

const LIVE = ['queued', 'running', 'waiting_for_approval'];

const STARTERS = [
    'How is my store doing this month?',
    'Which products need attention right now?',
    'Create a discount for products with falling sales',
    'Which blog posts are missing SEO, and can you fix one?',
];

export default function Copilot() {
    const { t } = useTranslation();
    const fmt = useCommerceFormat();
    const props = usePage().props as unknown as PageProps;
    const [run, setRun] = useState<RunView | null>(props.run);
    const [runs, setRuns] = useState<RunSummary[]>(props.runs ?? []);
    const [input, setInput] = useState(props.prefill ?? '');
    const [steps, setSteps] = useState<ProgressStep[]>([]);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const bottom = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const live = !!run && LIVE.includes(run.status);
    const blocked = !props.ai.configured || props.budget.remaining <= 0;

    const refresh = useCallback(
        (id: string) => {
            if (refreshTimer.current) clearTimeout(refreshTimer.current);
            refreshTimer.current = setTimeout(async () => {
                try {
                    const next = await fetchRun(id);
                    setRun(next);
                    setRuns((list) => [next, ...list.filter((r) => r.id !== next.id)]);
                } catch {
                    /* stream will retry */
                }
            }, 120);
        },
        [],
    );

    const onEvent = useCallback(
        (e: RunEvent) => {
            setSteps((s) => reduceProgress(s, e));
            if (!run) return;
            if (['agent_completed', 'agent_failed', 'agent_cancelled', 'waiting_for_approval', 'action_completed', 'action_failed', 'action_rejected', 'action_expired', 'agent_resumed'].includes(e.type)) {
                refresh(run.id);
            }
        },
        [run, refresh],
    );

    const stream = useRunStream(run?.id ?? null, run?.last_event_seq ?? 0, onEvent, { active: live });

    useEffect(() => {
        bottom.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
    }, [run?.messages.length, steps.length, run?.status]);

    const submit = async (text?: string) => {
        const message = (text ?? input).trim();
        if (!message || sending || blocked) return;
        setSending(true);
        setError(null);
        setSteps([]);
        try {
            const next = run ? await sendFollowUp(run.id, message) : await startRun(message, run ? null : props.context);
            setRun(next);
            setRuns((list) => [next, ...list.filter((r) => r.id !== next.id)]);
            setInput('');
            window.history.replaceState(window.history.state, '', route('copilot.show', next.id));
        } catch (e) {
            const code = (e as { code?: string }).code;
            setError(code === 'waiting_for_approval' ? t('Review the pending change below before asking something new.') : code === 'busy' ? t('Tijraa is still working on your last message.') : t('Your message could not be sent. Try again.'));
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    const newConversation = () => {
        setRun(null);
        setSteps([]);
        setError(null);
        window.history.replaceState(window.history.state, '', route('copilot.index'));
        inputRef.current?.focus();
    };

    const onActionChange = (a: RunView['actions'][number]) => {
        setRun((r) => (r ? { ...r, actions: r.actions.map((x) => (x.id === a.id ? a : x)), status: a.status === 'pending' ? r.status : 'queued' } : r));
        if (run) refresh(run.id);
    };

    // One chronological thread: messages and the proposals made between them.
    const timeline = useMemo(() => {
        type Item = { kind: 'message'; at: string; m: RunView['messages'][number] } | { kind: 'action'; at: string; action: RunView['actions'][number] };
        const items: Item[] = [
            ...(run?.messages ?? []).map((m) => ({ kind: 'message' as const, at: m.created_at, m })),
            ...(run?.actions ?? []).map((a) => ({ kind: 'action' as const, at: a.created_at, action: a })),
        ];
        // Same-second ties: the question, then the proposal, then what followed it.
        const rank = (i: Item) => (i.kind === 'action' ? 1 : i.m.role === 'user' ? 0 : 2);
        return items.sort((a, b) => a.at.localeCompare(b.at) || rank(a) - rank(b));
    }, [run]);
    const errorCopy = run?.status === 'failed' ? (AGENT_ERROR[run.error_code ?? ''] ?? AGENT_ERROR.runtime_error) : null;

    const history = (
        <nav aria-label={t('Conversations')} className="space-y-1">
            <Button variant="outline" size="sm" className="mb-2 w-full justify-start" onClick={newConversation}>
                <MessageSquarePlus /> {t('New conversation')}
            </Button>
            {runs.length === 0 && <p className="text-muted-foreground px-2 py-3 text-xs">{t('Your conversations appear here.')}</p>}
            {runs.map((r) => (
                <Link
                    key={r.id}
                    href={route('copilot.show', r.id)}
                    className={cn('hover:bg-muted block rounded-lg px-2 py-2 text-sm', run?.id === r.id && 'bg-muted font-medium')}
                    aria-current={run?.id === r.id ? 'page' : undefined}
                >
                    <span className="line-clamp-1">{r.title ?? t('Conversation')}</span>
                    <span className="text-muted-foreground text-xs">{fmt.relative(r.updated_at)}</span>
                </Link>
            ))}
        </nav>
    );

    return (
        <PageTemplate
            title={t('Ask Tijraa')}
            url="/copilot"
            breadcrumbs={[{ title: t('Dashboard'), href: route('dashboard') }, { title: t('Ask Tijraa') }]}
            header={
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="space-y-1">
                        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                            <Sparkles className="text-ai size-5" aria-hidden /> {t('Ask Tijraa')}
                        </h1>
                        <p className="text-muted-foreground text-sm">{t('Answers from your store data and knowledge. Changes always wait for your approval.')}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {props.ai.is_test_model && (
                            <ToneBadge tone="warning" title={t('A deterministic test model is active. Answers are scripted, not AI-generated.')}>
                                {t('Test model')}
                            </ToneBadge>
                        )}
                        <ToneBadge tone={props.budget.percent >= 90 ? 'danger' : props.budget.percent >= 75 ? 'warning' : 'neutral'}>
                            {t('{{percent}}% of monthly AI used', { percent: props.budget.percent })}
                        </ToneBadge>
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="sm" className="lg:hidden">
                                    <History /> {t('History')}
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-80 overflow-y-auto p-4">
                                <SheetHeader className="p-0 pb-3">
                                    <SheetTitle>{t('Conversations')}</SheetTitle>
                                </SheetHeader>
                                {history}
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            }
        >
            <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
                <aside className="hidden lg:block">{history}</aside>

                <Panel as="div" flush className="flex min-h-[60vh] flex-col">
                    <div className="flex-1 space-y-6 px-4 pb-4 sm:px-6" aria-live="polite">
                        {!run && (
                            <div className="space-y-6 py-6">
                                {!props.ai.configured ? (
                                    <EmptyState icon={<WifiOff />} title={t(AGENT_ERROR.not_configured.title)} description={t(AGENT_ERROR.not_configured.body)} action={<Button asChild size="sm"><Link href={route('settings')}>{t('Open settings')}</Link></Button>} />
                                ) : props.budget.remaining <= 0 ? (
                                    <EmptyState icon={<WifiOff />} title={t(AGENT_ERROR.budget_exhausted.title)} description={t(AGENT_ERROR.budget_exhausted.body)} />
                                ) : (
                                    <>
                                        <div className="space-y-1 text-center">
                                            <p className="text-lg font-semibold">{t('What would you like to know?')}</p>
                                            <p className="text-muted-foreground text-sm">
                                                {props.context ? t('This conversation starts with the {{type}} you opened.', { type: t(props.context.resource_type) }) : t('Ask about sales, products, customers, discounts or content.')}
                                            </p>
                                        </div>
                                        <div className="mx-auto grid max-w-2xl gap-2 sm:grid-cols-2">
                                            {[...props.insights.slice(0, 2).map((i) => t('Explain: {{title}}', { title: i.title })), ...STARTERS.map((s) => t(s))].slice(0, 6).map((s) => (
                                                <button key={s} type="button" onClick={() => submit(s)} className="hover:bg-muted focus-visible:ring-ring/40 rounded-xl border p-3 text-start text-sm outline-none focus-visible:ring-[3px]">
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {timeline.map((item) =>
                            item.kind === 'action' ? (
                                <ActionCard key={item.action.id} action={item.action} onChange={onActionChange} />
                            ) : item.m.role === 'user' ? (
                                <div key={item.m.id} className="flex justify-end">
                                    <p className="bg-foreground text-background max-w-[85%] rounded-2xl rounded-ee-md px-4 py-2.5 text-sm whitespace-pre-line">{item.m.content}</p>
                                </div>
                            ) : item.m.role === 'platform' ? (
                                <p key={item.m.id} className="text-muted-foreground flex items-center justify-center gap-2 text-center text-xs">
                                    <span className="bg-border h-px flex-1" aria-hidden />
                                    {t(item.m.note === 'approved' ? 'You approved the change — Tijraa continued' : item.m.note === 'rejected' ? 'You rejected the change — Tijraa continued' : item.m.note === 'failed' ? 'The change could not be applied' : 'Tijraa continued')}
                                    <span className="bg-border h-px flex-1" aria-hidden />
                                </p>
                            ) : item.m.answer ? (
                                <div key={item.m.id} className="flex gap-3">
                                    <span className="bg-ai-soft text-ai mt-1 flex size-7 shrink-0 items-center justify-center rounded-full" aria-hidden>
                                        <Sparkles className="size-4" />
                                    </span>
                                    <AnswerCard answer={item.m.answer} onAsk={live ? undefined : (q) => submit(q)} className="min-w-0 flex-1" />
                                </div>
                            ) : null,
                        )}

                        {(live || steps.length > 0) && run?.status !== 'completed' && (
                            <div className="flex gap-3">
                                <span className="bg-ai-soft text-ai mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full" aria-hidden>
                                    <Sparkles className="size-4" />
                                </span>
                                <div className="min-w-0 flex-1 space-y-2">
                                    {run?.status === 'waiting_for_approval' ? (
                                        <p className="text-sm font-medium">{t('Waiting for your decision on the change above.')}</p>
                                    ) : (
                                        live && (
                                            <p className="flex items-center gap-2 text-sm font-medium">
                                                <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> {t('Working on it…')}
                                            </p>
                                        )
                                    )}
                                    <ProgressFeed steps={steps} />
                                    {stream.state === 'reconnecting' && <p className="text-muted-foreground text-xs">{t('Reconnecting…')}</p>}
                                </div>
                            </div>
                        )}

                        {errorCopy && (
                            <div role="alert" className="bg-danger-soft text-danger-fg space-y-1 rounded-xl p-4 text-sm">
                                <p className="font-semibold">{t(errorCopy.title)}</p>
                                <p>{t(errorCopy.body)}</p>
                            </div>
                        )}
                        <div ref={bottom} />
                    </div>

                    <form
                        className="bg-card sticky bottom-0 border-t p-3 sm:p-4"
                        onSubmit={(e) => {
                            e.preventDefault();
                            submit();
                        }}
                    >
                        {error && (
                            <p role="alert" className="text-danger-fg mb-2 text-xs">
                                {error}
                            </p>
                        )}
                        <div className="focus-within:ring-ring/40 flex items-end gap-2 rounded-xl border p-2 focus-within:ring-[3px]">
                            <label htmlFor="copilot-input" className="sr-only">
                                {t('Message Tijraa')}
                            </label>
                            <textarea
                                id="copilot-input"
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                                        e.preventDefault();
                                        submit();
                                    }
                                }}
                                rows={1}
                                maxLength={4000}
                                disabled={blocked}
                                placeholder={run?.status === 'waiting_for_approval' ? t('Approve or reject the change first') : t('Ask about your store…')}
                                className="max-h-40 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none [field-sizing:content]"
                            />
                            {live && run?.status !== 'waiting_for_approval' ? (
                                <Button type="button" size="icon" variant="outline" aria-label={t('Stop')} onClick={async () => run && setRun(await cancelRun(run.id))}>
                                    <Square />
                                </Button>
                            ) : (
                                <Button type="submit" size="icon" aria-label={t('Send')} disabled={!input.trim() || sending || blocked || run?.status === 'waiting_for_approval'}>
                                    {sending ? <Loader2 className="animate-spin" /> : <ArrowUp />}
                                </Button>
                            )}
                        </div>
                        <div className="text-muted-foreground mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                            <span>{t('Tijraa can make mistakes. Check important numbers in Analytics.')}</span>
                            {run && !live && (
                                <button type="button" onClick={newConversation} className="hover:text-foreground inline-flex items-center gap-1">
                                    <RotateCcw className="size-3" aria-hidden /> {t('New conversation')}
                                </button>
                            )}
                        </div>
                    </form>
                </Panel>
            </div>
        </PageTemplate>
    );
}
