import type { Tone } from '@/lib/commerce/status';

/**
 * Order helpers local to the Orders workstream.
 * Labels are English source strings; translate with t() at render time.
 */

type T = (key: string, opts?: Record<string, unknown>) => string;

/** Known methods map to translated labels; unknown keys are humanised as-is. */
export function paymentMethodLabel(key: string | null | undefined, t: T): string {
    const k = (key || '').toString().trim().toLowerCase();
    switch (k) {
        case '':
            return '';
        case 'cod':
        case 'cash':
        case 'cash_on_delivery':
            return t('Cash on Delivery');
        case 'credit_card':
            return t('Credit card');
        case 'debit_card':
            return t('Debit card');
        case 'card':
            return t('Card');
        case 'bank':
        case 'bank_transfer':
            return t('Bank transfer');
        case 'paypal':
            return 'PayPal';
        case 'stripe':
            return 'Stripe';
        case 'whatsapp':
            return 'WhatsApp';
        default: {
            const human = k.replace(/[_-]+/g, ' ');
            return human.charAt(0).toUpperCase() + human.slice(1);
        }
    }
}

export interface OrderIssue {
    /** Already translated. */
    label: string;
    tone: Tone;
}

const STALE_PENDING_HOURS = 48;

/**
 * Derive an attention flag from real order data only.
 * Returns null when nothing needs attention.
 */
export function orderIssue(
    order: { status: string; paymentStatus: string; createdAt?: string | null },
    t: T,
    now: number = Date.now(),
): OrderIssue | null {
    const status = (order.status || '').toLowerCase();
    const payment = (order.paymentStatus || '').toLowerCase();
    if (status === 'cancelled') return null;
    if (payment === 'failed') return { label: t('Payment failed'), tone: 'danger' };
    if (payment === 'pending' && (status === 'shipped' || status === 'delivered')) {
        return { label: status === 'delivered' ? t('Delivered but unpaid') : t('Shipped but unpaid'), tone: 'danger' };
    }
    if (status === 'pending' && order.createdAt) {
        const created = new Date(order.createdAt).getTime();
        if (Number.isFinite(created) && now - created > STALE_PENDING_HOURS * 3600 * 1000) {
            return { label: t('Pending over 48h'), tone: 'warning' };
        }
    }
    return null;
}

export const ORDER_STATUS_VALUES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
export const PAYMENT_STATUS_VALUES = ['pending', 'paid', 'failed', 'refunded'] as const;
