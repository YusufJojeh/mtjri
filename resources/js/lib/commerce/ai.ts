import axios from 'axios';

export type AiErrorCode = 'not_configured' | 'rate_limited' | 'budget_exhausted' | 'provider_error' | 'empty_response' | 'network' | 'validation';

export class AiError extends Error {
    constructor(
        public code: AiErrorCode,
        message: string,
    ) {
        super(message);
    }
}

export interface ComposeRequest {
    scope: 'product' | 'blog' | 'page';
    label: string;
    facts?: string;
    current?: string;
    field: 'description' | 'details' | 'specifications' | 'seo';
    instructions?: string;
}

export interface KnowledgeCitation {
    document_uuid: string;
    document: string;
    version: number;
    heading: string | null;
}

export interface ComposeResult {
    fields: { text?: string; title?: string; description?: string; keywords?: string };
    knowledge_used: KnowledgeCitation[];
}

/**
 * Drafts from unsaved editor content through Tijraa's content service
 * (same provider, budget, usage ledger and brand knowledge as Content Studio).
 * Returns a proposal only — callers decide whether to apply it.
 */
export async function composeDraft(req: ComposeRequest, signal?: AbortSignal): Promise<ComposeResult> {
    try {
        const res = await axios.post(route('ai.content.compose'), req, { signal });
        return res.data as ComposeResult;
    } catch (e) {
        if (axios.isCancel(e)) throw e;
        const r = (e as { response?: { status?: number; data?: { error?: string } } }).response;
        const code = r?.data?.error;
        if (code && code in AI_ERROR_COPY) throw new AiError(code as AiErrorCode, '');
        if (r?.status === 422) throw new AiError('validation', '');
        if (r?.status === 429) throw new AiError('rate_limited', '');
        if (r?.status === 402) throw new AiError('budget_exhausted', '');
        throw new AiError(r ? 'provider_error' : 'network', '');
    }
}

/** Merchant-language explanation for each failure mode. Source strings are translated by callers. */
export const AI_ERROR_COPY: Record<AiErrorCode, { title: string; body: string }> = {
    not_configured: {
        title: 'AI writing is not set up yet',
        body: 'An administrator needs to add an AI provider key in Settings before drafts can be generated',
    },
    rate_limited: { title: 'Too many requests', body: 'The AI service is busy right now. Wait a moment and try again' },
    budget_exhausted: { title: 'AI usage limit reached', body: 'Your monthly AI allowance is used up. It resets at the start of next month' },
    provider_error: { title: 'The AI service did not respond', body: 'Nothing was changed. Try again in a few seconds' },
    empty_response: { title: 'No draft was produced', body: 'Nothing was changed. Try regenerating' },
    network: { title: 'Connection problem', body: 'Check your connection and try again. Nothing was changed' },
    validation: { title: 'Not enough information', body: 'Add a product name first so the draft has something to work from' },
};
