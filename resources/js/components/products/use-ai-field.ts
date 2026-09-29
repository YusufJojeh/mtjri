import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import type { ProposalState } from '@/components/ds/ai';
import { AiError, generateText } from '@/lib/commerce/ai';

/** Prompt budget: the endpoint rejects prompts over 1000 characters. */
export const AI_PROMPT_LIMIT = 1000;

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
export function useAiField(opts: { maxLength: number; creativity?: 'low' | 'medium' | 'high' }) {
    const { i18n } = useTranslation();
    const [state, setState] = useState<ProposalState>({ status: 'idle' });
    const ctrl = useRef<AbortController | null>(null);

    useEffect(() => () => ctrl.current?.abort(), []);

    const run = useCallback(
        async (prompt: string | null) => {
            ctrl.current?.abort();
            if (!prompt) {
                setState({ status: 'error', code: 'validation' });
                return;
            }
            const c = new AbortController();
            ctrl.current = c;
            setState({ status: 'generating' });
            try {
                const text = cleanAiText(
                    await generateText({
                        prompt: prompt.slice(0, AI_PROMPT_LIMIT),
                        language: i18n.language || 'en',
                        creativity: opts.creativity ?? 'medium',
                        maxLength: opts.maxLength,
                        signal: c.signal,
                    }),
                );
                if (c.signal.aborted) return;
                setState(text ? { status: 'ready', value: text } : { status: 'error', code: 'empty_response' });
            } catch (e) {
                if (axios.isCancel(e) || c.signal.aborted) return;
                setState({ status: 'error', code: e instanceof AiError ? e.code : 'network' });
            }
        },
        [i18n.language, opts.maxLength, opts.creativity],
    );

    const reset = useCallback(() => {
        ctrl.current?.abort();
        setState({ status: 'idle' });
    }, []);

    const markApplied = useCallback(() => setState({ status: 'applied' }), []);

    return { state, run, reset, markApplied, busy: state.status === 'generating' };
}
