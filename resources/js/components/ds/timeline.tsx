import { cn } from '@/lib/utils';
import type { Tone } from '@/lib/commerce/status';
import { toneDot } from './status-badge';

export interface TimelineEvent {
    id: string;
    title: React.ReactNode;
    time?: React.ReactNode;
    description?: React.ReactNode;
    actor?: React.ReactNode;
    tone?: Tone;
    /** Future/pending step – rendered hollow. */
    pending?: boolean;
}

export function Timeline({ events, className }: { events: TimelineEvent[]; className?: string }) {
    return (
        <ol className={cn('relative', className)}>
            {events.map((e, idx) => (
                <li key={e.id} className="relative flex gap-3 pb-5 last:pb-0">
                    {idx < events.length - 1 && <span className="bg-border absolute start-[5px] top-4 bottom-0 w-px" aria-hidden />}
                    <span
                        className={cn(
                            'relative mt-1.5 size-[11px] shrink-0 rounded-full ring-4 ring-card',
                            e.pending ? 'border-border border-2 bg-card' : toneDot[e.tone ?? 'neutral'],
                        )}
                        aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                            <p className={cn('text-sm font-medium', e.pending && 'text-muted-foreground')}>{e.title}</p>
                            {e.time && <p className="text-muted-foreground text-xs tabular-nums">{e.time}</p>}
                        </div>
                        {e.description && <div className="text-muted-foreground mt-0.5 text-sm break-words">{e.description}</div>}
                        {e.actor && <p className="text-muted-foreground mt-0.5 text-xs">{e.actor}</p>}
                    </div>
                </li>
            ))}
        </ol>
    );
}
