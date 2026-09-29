import { usePage } from '@inertiajs/react';

interface PlanLike {
    enable_chatgpt?: string;
}
interface UserLike {
    type?: string;
    plan?: PlanLike | null;
    plan_is_active?: number | boolean;
    creator?: UserLike | null;
}

/**
 * Whether AI writing tools may be shown. Mirrors plan gating: the company's
 * active plan must enable ChatGPT (staff inherit their company's plan).
 * Provider configuration is checked server-side; a missing key surfaces as a
 * `not_configured` error state rather than being hidden.
 */
export function useAiAccess(): boolean {
    const { auth } = usePage().props as unknown as { auth?: { user?: UserLike; roles?: string[] } };
    const user = auth?.user;
    if (!user) return false;
    if (user.type === 'superadmin' || user.type === 'super admin') return true;
    const owner = user.type === 'company' ? user : user.creator;
    return !!owner && !!owner.plan && Number(owner.plan_is_active) === 1 && owner.plan.enable_chatgpt === 'on';
}
