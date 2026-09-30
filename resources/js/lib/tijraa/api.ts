import axios from 'axios';
import type { AgentActionView, RunView } from './types';

export class DecisionError extends Error {
    constructor(
        public code: string,
        message: string,
        public status: number,
    ) {
        super(message);
    }
}

function asDecisionError(e: unknown): DecisionError {
    const r = (e as { response?: { status?: number; data?: { error?: string; message?: string } } }).response;
    return new DecisionError(r?.data?.error ?? (r ? 'error' : 'network'), r?.data?.message ?? '', r?.status ?? 0);
}

export async function startRun(message: string, context?: Record<string, unknown> | null, profile?: string): Promise<RunView> {
    const res = await axios.post(route('copilot.runs.store'), { message, context: context ?? undefined, profile });
    return res.data.run;
}

export async function sendFollowUp(runId: string, message: string): Promise<RunView> {
    try {
        const res = await axios.post(route('copilot.runs.message', runId), { message });
        return res.data.run;
    } catch (e) {
        throw asDecisionError(e);
    }
}

export async function fetchRun(runId: string): Promise<RunView> {
    const res = await axios.get(route('copilot.runs.state', runId));
    return res.data.run;
}

export async function cancelRun(runId: string): Promise<RunView> {
    const res = await axios.post(route('copilot.runs.cancel', runId));
    return res.data.run;
}

export async function approveAction(action: AgentActionView, edits?: Record<string, unknown>, acknowledgeStale = false): Promise<AgentActionView> {
    try {
        const res = await axios.post(route('ai-actions.approve', action.id), { payload_hash: action.payload_hash, edits, acknowledge_stale: acknowledgeStale });
        return res.data.action;
    } catch (e) {
        throw asDecisionError(e);
    }
}

export async function rejectAction(action: AgentActionView, note?: string): Promise<AgentActionView> {
    try {
        const res = await axios.post(route('ai-actions.reject', action.id), { note });
        return res.data.action;
    } catch (e) {
        throw asDecisionError(e);
    }
}
