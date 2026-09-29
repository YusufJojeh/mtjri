export type DiscountState = 'active' | 'scheduled' | 'expired' | 'paused';

export interface DiscountPerformance {
    orders: number;
    discount: number;
    revenue: number;
}

export interface Discount {
    id: number;
    name: string;
    code: string;
    description?: string | null;
    code_type?: string | null;
    type: 'percentage' | 'flat' | string;
    discount_amount: number | string;
    minimum_spend: number | string | null;
    maximum_spend: number | string | null;
    use_limit_per_coupon: number | null;
    use_limit_per_user: number | null;
    used_count: number | null;
    start_date: string | null;
    expiry_date: string | null;
    status: boolean | number;
    created_at?: string;
    updated_at?: string;
    /* Added by StoreCouponController@index */
    state?: DiscountState;
    days_left?: number | null;
    performance?: DiscountPerformance;
}

type Fmt = {
    money: (v: number | string | null | undefined) => string;
    percent: (v: number | null | undefined) => string;
    date: (v: string | number | Date | null | undefined, opts?: Intl.DateTimeFormatOptions) => string;
};
type T = (key: string, opts?: Record<string, unknown>) => string;

export const num = (v: unknown): number | null => {
    if (v === null || v === undefined || v === '') return null;
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n : null;
};

/** Calendar date only (YYYY-MM-DD), without timezone shifting. */
export const dayOnly = (v: string | null | undefined): string => (v ? String(v).slice(0, 10) : '');

/** Parse a YYYY-MM-DD date as local midnight so display never shifts a day. */
export const localDate = (v: string | null | undefined): Date | null => {
    const d = dayOnly(v);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
    const [y, m, dd] = d.split('-').map(Number);
    return new Date(y, m - 1, dd);
};

/** Client-side derivation mirroring StoreCouponController::couponState. */
export function deriveState(c: Pick<Discount, 'status' | 'start_date' | 'expiry_date'>, now = new Date()): DiscountState {
    if (!c.status) return 'paused';
    const exp = localDate(c.expiry_date);
    if (exp && exp.getTime() < now.getTime()) return 'expired';
    const start = localDate(c.start_date);
    if (start && start.getTime() > now.getTime()) return 'scheduled';
    return 'active';
}

export function daysUntil(v: string | null | undefined, now = new Date()): number | null {
    const d = localDate(v);
    if (!d) return null;
    return Math.floor((d.getTime() - now.getTime()) / 86_400_000);
}

/** "15% off" / "SAR 20.00 off". */
export function valueLabel(c: Pick<Discount, 'type' | 'discount_amount'>, f: Fmt, t: T): string {
    const v = num(c.discount_amount) ?? 0;
    return c.type === 'percentage' ? t('{{value}} off', { value: f.percent(v) }) : t('{{value}} off', { value: f.money(v) });
}

/** Checkout only honours discounts that have both a start and an end date. */
export function missingDates(c: Pick<Discount, 'start_date' | 'expiry_date'>): boolean {
    return !c.start_date || !c.expiry_date;
}

export interface PreviewInput {
    type: string;
    discount_amount: string | number;
    minimum_spend: string | number;
    maximum_spend: string | number;
    start_date: string;
    expiry_date: string;
    use_limit_per_coupon: string | number;
    use_limit_per_user: string | number;
}

/** One human sentence describing what the customer gets, built from form state. */
export function previewSentence(d: PreviewInput, f: Fmt, t: T): string {
    const amount = num(d.discount_amount);
    const parts: string[] = [];
    if (amount === null || amount <= 0) {
        parts.push(t('Set a discount value to see what customers get.'));
        return parts.join(' ');
    }
    const value = d.type === 'percentage' ? f.percent(amount) : f.money(amount);
    const min = num(d.minimum_spend);
    const cap = num(d.maximum_spend);

    let s = min && min > 0 ? t('Customers get {{value}} off orders of {{min}} or more', { value, min: f.money(min) }) : t('Customers get {{value}} off their order', { value });
    if (cap && cap > 0 && d.type === 'percentage') s += t(', up to {{cap}}', { cap: f.money(cap) });

    const from = d.start_date ? f.date(localDate(d.start_date)) : null;
    const to = d.expiry_date ? f.date(localDate(d.expiry_date)) : null;
    if (from && to) s += t(', from {{from}} to {{to}}', { from, to });
    else if (from) s += t(', starting {{from}}', { from });
    else if (to) s += t(', until {{to}}', { to });

    const total = num(d.use_limit_per_coupon);
    const perUser = num(d.use_limit_per_user);
    if (total && total > 0) s += t(', limited to {{count}} uses', { count: total });
    if (perUser && perUser > 0) s += t(' ({{count}} per customer)', { count: perUser });
    return `${s}.`;
}
