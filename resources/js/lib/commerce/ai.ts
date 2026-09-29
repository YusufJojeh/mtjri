import axios from 'axios';

/**
 * Thin client over the existing `chatgpt.generate` endpoint.
 * Returns a proposal only — callers decide whether to apply it.
 */
export type AiErrorCode = 'not_configured' | 'rate_limited' | 'budget_exhausted' | 'provider_error' | 'empty_response' | 'network' | 'validation';

export class AiError extends Error {
    constructor(
        public code: AiErrorCode,
        message: string,
    ) {
        super(message);
    }
}

export interface GenerateOptions {
    prompt: string;
    language?: string;
    creativity?: 'low' | 'medium' | 'high';
    maxLength?: number;
    signal?: AbortSignal;
}

const SUPPORTED = ['en', 'es', 'ar', 'da', 'de', 'fr', 'he', 'it', 'ja', 'nl', 'pl', 'pt', 'pt-BR', 'ru', 'tr', 'zh'];

export async function generateText({ prompt, language = 'en', creativity = 'medium', maxLength = 400, signal }: GenerateOptions): Promise<string> {
    const lang = SUPPORTED.includes(language) ? language : SUPPORTED.includes(language.split('-')[0]) ? language.split('-')[0] : 'en';
    try {
        const res = await axios.post(
            route('chatgpt.generate'),
            {
                // Endpoint caps prompts at 1000 chars.
                prompt: prompt.slice(0, 1000),
                language: lang,
                creativity,
                num_results: 1,
                max_length: Math.min(500, maxLength),
            },
            { signal },
        );
        const data = res.data as { success: boolean; content?: string; code?: AiErrorCode; message?: string };
        if (!data.success || !data.content) {
            throw new AiError(data.code ?? 'provider_error', data.message ?? '');
        }
        return data.content.trim();
    } catch (e) {
        if (e instanceof AiError) throw e;
        if (axios.isCancel(e)) throw e;
        const status = (e as { response?: { status?: number } }).response?.status;
        if (status === 422) throw new AiError('validation', '');
        if (status === 429) throw new AiError('rate_limited', '');
        throw new AiError('network', '');
    }
}

/** Merchant-language explanation for each failure mode. Source strings are translated by callers. */
export const AI_ERROR_COPY: Record<AiErrorCode, { title: string; body: string }> = {
    not_configured: {
        title: 'AI writing is not set up yet',
        body: 'An administrator needs to add an AI provider key in Settings before drafts can be generated',
    },
    rate_limited: { title: 'Too many requests', body: 'The AI service is busy right now. Wait a moment and try again' },
    budget_exhausted: { title: 'AI usage limit reached', body: 'Your AI provider reports that the usage budget is exhausted' },
    provider_error: { title: 'The AI service did not respond', body: 'Nothing was changed. Try again in a few seconds' },
    empty_response: { title: 'No draft was produced', body: 'Nothing was changed. Try regenerating' },
    network: { title: 'Connection problem', body: 'Check your connection and try again. Nothing was changed' },
    validation: { title: 'Not enough information', body: 'Add a product name first so the draft has something to work from' },
};

/** Parse "Title: … / Description: … / Keywords: …" style SEO output. */
export function parseSeoProposal(raw: string): { title: string; description: string; keywords: string } {
    const grab = (label: string) => {
        const re = new RegExp(`${label}\\s*[:：]\\s*([\\s\\S]*?)(?=\\n\\s*(?:title|meta title|description|meta description|keywords)\\s*[:：]|$)`, 'i');
        return (raw.match(re)?.[1] ?? '').replace(/^["'\s]+|["'\s]+$/g, '').trim();
    };
    return {
        title: grab('(?:meta )?title'),
        description: grab('(?:meta )?description'),
        keywords: grab('keywords'),
    };
}
