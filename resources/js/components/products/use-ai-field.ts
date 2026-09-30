import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import type { ProposalState } from '@/components/ds/ai';
import { AiError, composeDraft, type ComposeRequest } from '@/lib/commerce/ai';

export const clip = (s: string, n: number) => {
    const clean = s.replace(/\s+/g, ' ').trim();
    return clean.length > n ? `${clean.slice(0, n - 1).trimEnd()}…` : clean;
};

/** Remove stray markdown / wrapping quotes some models add despite instructions. */
export function cleanAiText(raw: string): string {
    return raw
        .replace(/^\s*["“]|["”]\s*$/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/**
 * One AI proposal lifecycle for one form field. Generating never touches the
 * field; the caller applies the value only when the merchant accepts.
 */
export function useAiField() {
    const [state, setState] = useState<ProposalState>({ status: 'idle' });
    const ctrl = useRef<AbortController | null>(null);

    useEffect(() => () => ctrl.current?.abort(), []);

    const run = useCallback(
        async (req: ComposeRequest | null) => {
            ctrl.current?.abort();
            if (!req) {
                setState({ status: 'error', code: 'validation' });
                return;
            }
            const c = new AbortController();
            ctrl.current = c;
            setState({ status: 'generating' });
            try {
                const res = await composeDraft(req, c.signal);
                const text = cleanAiText(res.fields.text ?? '');
                if (c.signal.aborted) return;
                setState(text ? { status: 'ready', value: text, knowledge: res.knowledge_used } : { status: 'error', code: 'empty_response' });
            } catch (e) {
                if (axios.isCancel(e) || c.signal.aborted) return;
                setState({ status: 'error', code: e instanceof AiError ? e.code : 'network' });
            }
        },
        [],
    );

    const reset = useCallback(() => {
        ctrl.current?.abort();
        setState({ status: 'idle' });
    }, []);

    const markApplied = useCallback(() => setState({ status: 'applied' }), []);

    return { state, run, reset, markApplied, busy: state.status === 'generating' };
}
