import type { ActionStatus, SourceKind } from '@/lib/tijraa/types';
import type { Tone } from '@/lib/commerce/status';

/** English source strings; callers pass them through t(). */
export const ACTION_TYPE_LABEL: Record<string, string> = {
    product_copy: 'Product copy',
    discount_create: 'New discount',
    blog_seo: 'Blog post SEO',
    page_seo: 'Page SEO',
};

export const ACTION_STATUS: Record<ActionStatus, { label: string; tone: Tone }> = {
    pending: { label: 'Needs review', tone: 'warning' },
    executing: { label: 'Applying', tone: 'info' },
    executed: { label: 'Applied', tone: 'success' },
    rejected: { label: 'Rejected', tone: 'neutral' },
    expired: { label: 'Expired', tone: 'neutral' },
    failed: { label: 'Failed', tone: 'danger' },
    cancelled: { label: 'Cancelled', tone: 'neutral' },
};

export const SOURCE_LABEL: Record<SourceKind, { label: string; tone: Tone }> = {
    store_data: { label: 'Store data', tone: 'info' },
    knowledge: { label: 'Knowledge', tone: 'success' },
    ai_interpretation: { label: 'AI interpretation', tone: 'ai' },
};

export const AGENT_ERROR: Record<string, { title: string; body: string }> = {
    not_configured: { title: 'AI is not connected', body: 'Add an AI provider key in Settings to use Tijraa Copilot.' },
    budget_exhausted: { title: 'Monthly AI allowance used up', body: 'Your AI allowance resets at the start of next month. Store data and reports keep working.' },
    rate_limited: { title: 'The AI provider is busy', body: 'Wait a minute and try again.' },
    timeout: { title: 'The AI provider took too long', body: 'Try again, or ask a narrower question.' },
    runtime_error: { title: 'Something went wrong', body: 'Tijraa could not finish this request. Try again.' },
    provider_error: { title: 'The AI provider returned an error', body: 'Try again in a moment.' },
    empty_response: { title: 'No answer was returned', body: 'Try rephrasing your question.' },
};

export const DECISION_ERROR: Record<string, string> = {
    payload_mismatch: 'This proposal changed after you opened it. Review it again.',
    stale: 'The current content changed since this was proposed.',
    already_decided: 'This proposal was already handled.',
    expired: 'This proposal expired. Ask Tijraa to prepare it again.',
    forbidden: 'You do not have permission to approve this change.',
    invalid_edit: 'Your edit is not valid.',
    network: 'Connection problem. Try again.',
};
