import { useCallback, useEffect, useRef, useState } from 'react';
import type { RunEvent, RunStatus } from './types';

const TYPES = [
    'agent_started',
    'agent_resumed',
    'model_started',
    'tool_requested',
    'tool_started',
    'tool_completed',
    'tool_failed',
    'knowledge_search_started',
    'knowledge_search_completed',
    'action_proposed',
    'waiting_for_approval',
    'action_approved',
    'action_executing',
    'action_completed',
    'action_failed',
    'action_rejected',
    'action_expired',
    'agent_completed',
    'agent_failed',
    'agent_cancelled',
];

export type StreamState = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed';

/**
 * Subscribes to a run's SSE stream. Events carry monotonically increasing
 * `seq` ids; the hook dedupes by seq and resumes from the last seen id on
 * reconnect (the server replays anything missed), so events are neither lost
 * nor applied twice.
 */
export function useRunStream(runId: string | null, initialSeq: number, onEvent: (e: RunEvent) => void, opts: { active: boolean }) {
    const lastSeq = useRef(initialSeq);
    const handler = useRef(onEvent);
    handler.current = onEvent;
    const [state, setState] = useState<StreamState>('idle');
    const [nonce, setNonce] = useState(0);

    useEffect(() => {
        lastSeq.current = Math.max(lastSeq.current, initialSeq);
    }, [initialSeq]);

    const reconnect = useCallback(() => setNonce((n) => n + 1), []);

    useEffect(() => {
        if (!runId || !opts.active || typeof EventSource === 'undefined') {
            setState(runId ? 'closed' : 'idle');
            return;
        }
        let es: EventSource | null = null;
        let closed = false;
        let retry: ReturnType<typeof setTimeout> | null = null;
        let attempts = 0;

        const open = () => {
            setState(attempts === 0 ? 'connecting' : 'reconnecting');
            es = new EventSource(route('copilot.runs.stream', { run: runId, after: lastSeq.current }));
            const onMessage = (ev: MessageEvent) => {
                try {
                    const data = JSON.parse(ev.data) as RunEvent;
                    if (!data.seq || data.seq <= lastSeq.current) return; // dedupe
                    lastSeq.current = data.seq;
                    attempts = 0;
                    handler.current(data);
                } catch {
                    /* ignore malformed frames */
                }
            };
            TYPES.forEach((type) => es!.addEventListener(type, onMessage as EventListener));
            es.onopen = () => setState('open');
            es.addEventListener('stream_end', (ev) => {
                es?.close();
                let status: RunStatus | undefined;
                try {
                    status = JSON.parse((ev as MessageEvent).data).status;
                } catch {
                    status = undefined;
                }
                const terminal = status === 'completed' || status === 'failed' || status === 'cancelled';
                if (terminal || closed) {
                    setState('closed');
                    return;
                }
                // Window elapsed while waiting/running: reopen from the last seq.
                retry = setTimeout(open, status === 'waiting_for_approval' ? 5000 : 250);
            });
            es.onerror = () => {
                es?.close();
                if (closed) return;
                attempts += 1;
                setState('reconnecting');
                retry = setTimeout(open, Math.min(15000, 1000 * 2 ** Math.min(attempts, 4)));
            };
        };
        open();
        return () => {
            closed = true;
            if (retry) clearTimeout(retry);
            es?.close();
        };
    }, [runId, opts.active, nonce]);

    return { state, reconnect, lastSeq };
}
