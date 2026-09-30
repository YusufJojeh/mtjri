import type { Tone } from '@/lib/commerce/status';

export type DocStatus = 'uploading' | 'processing' | 'ready' | 'failed' | 'inactive';

export interface KnowledgeDoc {
    id: string;
    title: string;
    type: string;
    visibility: string;
    status: DocStatus;
    filename: string | null;
    size_bytes: number;
    version: number;
    chunks: number;
    error: string | null;
    usage_count: number;
    last_used_at: string | null;
    updated_at: string;
    created_at: string;
}

export const DOC_STATUS: Record<DocStatus, { label: string; tone: Tone }> = {
    uploading: { label: 'Uploading', tone: 'info' },
    processing: { label: 'Processing', tone: 'info' },
    ready: { label: 'Ready', tone: 'success' },
    failed: { label: 'Failed', tone: 'danger' },
    inactive: { label: 'Inactive', tone: 'neutral' },
};

export const DOC_TYPE_LABEL: Record<string, string> = {
    brand_guide: 'Brand guide',
    product_info: 'Product information',
    faq: 'FAQ',
    returns_policy: 'Returns policy',
    shipping_policy: 'Shipping policy',
    sales_script: 'Sales script',
    marketing_playbook: 'Marketing playbook',
    campaign_notes: 'Campaign notes',
    brand_voice: 'Brand voice',
    supplier_notes: 'Supplier notes',
    internal_procedure: 'Internal procedure',
    other: 'Other',
};
