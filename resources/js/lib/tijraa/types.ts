export type RunStatus = 'queued' | 'running' | 'waiting_for_approval' | 'completed' | 'failed' | 'cancelled';
export type ActionStatus = 'pending' | 'executing' | 'executed' | 'rejected' | 'expired' | 'failed' | 'cancelled';
export type SourceKind = 'store_data' | 'knowledge' | 'ai_interpretation';

export interface Source {
    kind: 'store_data' | 'knowledge';
    label: string;
    url?: string;
    document?: string;
    version?: number;
    section?: string | null;
    excerpt?: string;
}

export interface Answer {
    executive_answer: string;
    key_findings: Array<{ text: string; source: SourceKind }>;
    recommended_actions: Array<{ title: string; why: string; priority?: 'high' | 'medium' | 'low'; can_prepare?: boolean }>;
    follow_up_questions: string[];
    sources?: { store_data: Source[]; knowledge: Source[] };
}

export interface RunMessage {
    id: number;
    role: 'user' | 'assistant' | 'platform';
    content: string | null;
    answer: Answer | null;
    note: 'approved' | 'rejected' | 'failed' | 'update' | null;
    created_at: string;
}

export interface PreviewField {
    key: string;
    label: string;
    before: string | number | null;
    after: string | number | null;
    format: 'text' | 'html' | 'code' | 'percent' | 'money' | 'number' | 'date' | string;
    editable: boolean;
}

export interface AgentActionView {
    id: string;
    type: string;
    source: 'copilot' | 'content_studio' | string;
    status: ActionStatus;
    risk: 'low' | 'medium' | 'high';
    resource: { type: string | null; id: number | null; label: string | null; url: string | null };
    goal: string | null;
    rationale: string | null;
    preview: { kind: string; fields: PreviewField[] };
    editable_fields: string[];
    knowledge_used: Array<{ document: string; version: number; section?: string | null }>;
    payload_hash: string;
    edited: boolean;
    run: { id: string; title: string | null } | null;
    created_by: string | null;
    decided_by: string | null;
    decided_at: string | null;
    decision_note: string | null;
    expires_at: string | null;
    executed_at: string | null;
    failure_reason: string | null;
    created_at: string;
    can_decide: boolean;
}

export interface RunSummary {
    id: string;
    title: string | null;
    profile: string;
    status: RunStatus;
    updated_at: string;
}

export interface RunView extends RunSummary {
    error_code: string | null;
    last_event_seq: number;
    messages: RunMessage[];
    actions: AgentActionView[];
    usage: { input_tokens: number; output_tokens: number; steps: number; tool_calls: number };
}

export interface RunEvent {
    seq: number;
    type: string;
    payload: Record<string, unknown>;
    at?: string;
}

export interface AiDescription {
    configured: boolean;
    provider: string | null;
    model: string | null;
    is_test_model: boolean;
}

export interface BudgetSummary {
    limit: number;
    used: number;
    remaining: number;
    percent: number;
    features: Record<string, { used: number; limit: number }>;
    resets_at: string;
}

export interface TijraaShared {
    unread_notifications: number;
    pending_actions: number;
    ai: AiDescription;
}
