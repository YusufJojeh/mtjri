/**
 * Single source of truth for how commerce states are presented.
 * Values mirror backend enums (see OrderController@update validation).
 */

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'ai';

export interface StatusMeta {
    tone: Tone;
    /** English source label; translated at render time via t(). */
    label: string;
    icon: 'clock' | 'loader' | 'truck' | 'check' | 'x' | 'alert' | 'undo' | 'package' | 'pause' | 'dot';
}

export const ORDER_STATUS: Record<string, StatusMeta> = {
    pending: { tone: 'warning', label: 'Pending', icon: 'clock' },
    processing: { tone: 'info', label: 'Processing', icon: 'loader' },
    shipped: { tone: 'info', label: 'Shipped', icon: 'truck' },
    delivered: { tone: 'success', label: 'Delivered', icon: 'check' },
    completed: { tone: 'success', label: 'Completed', icon: 'check' },
    cancelled: { tone: 'neutral', label: 'Cancelled', icon: 'x' },
};

export const PAYMENT_STATUS: Record<string, StatusMeta> = {
    pending: { tone: 'warning', label: 'Unpaid', icon: 'clock' },
    paid: { tone: 'success', label: 'Paid', icon: 'check' },
    failed: { tone: 'danger', label: 'Payment failed', icon: 'alert' },
    refunded: { tone: 'neutral', label: 'Refunded', icon: 'undo' },
};

export type StockState = 'in_stock' | 'low_stock' | 'out_of_stock';

export const STOCK_STATUS: Record<StockState, StatusMeta> = {
    in_stock: { tone: 'success', label: 'In stock', icon: 'check' },
    low_stock: { tone: 'warning', label: 'Low stock', icon: 'alert' },
    out_of_stock: { tone: 'danger', label: 'Out of stock', icon: 'x' },
};

export const ACTIVE_STATUS: Record<'active' | 'inactive', StatusMeta> = {
    active: { tone: 'success', label: 'Active', icon: 'dot' },
    inactive: { tone: 'neutral', label: 'Draft', icon: 'pause' },
};

export function normalizeStatus(value: string | null | undefined): string {
    return (value || '').toString().trim().toLowerCase().replace(/\s+/g, '_');
}

export function orderStatusMeta(value: string | null | undefined): StatusMeta {
    const key = normalizeStatus(value);
    return ORDER_STATUS[key] ?? { tone: 'neutral', label: value ? String(value) : 'Unknown', icon: 'dot' };
}

export function paymentStatusMeta(value: string | null | undefined): StatusMeta {
    const key = normalizeStatus(value);
    return PAYMENT_STATUS[key] ?? { tone: 'neutral', label: value ? String(value) : 'Unknown', icon: 'dot' };
}

export function stockState(stock: number | null | undefined, lowThreshold: number): StockState {
    const s = Number(stock ?? 0);
    if (s <= 0) return 'out_of_stock';
    if (s <= lowThreshold) return 'low_stock';
    return 'in_stock';
}
