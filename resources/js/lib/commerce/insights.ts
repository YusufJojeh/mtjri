/**
 * Deterministic store insights computed from real dashboard data.
 * These are rules, not AI output, and are labelled as such in the UI.
 * Every insight states what happened, why it matters, the evidence and a
 * next step. Nothing is emitted without enough data to support it.
 */
import type { Tone } from './status';

export interface CommandCenterData {
    periodDays: number;
    kpis: Record<'sales' | 'orders' | 'aov' | 'newCustomers', { current: number; previous: number }>;
    topProducts: Array<{ id: number; name: string; units: number; revenue: number; stock: number | null }>;
    buyers: { total: number; repeat: number };
    catalog: { products: number; active: number; lowStockThreshold: number };
}

export interface Insight {
    id: string;
    tone: Tone;
    title: string;
    why: string;
    evidence: string;
    action?: { label: string; href: string };
}

type T = (key: string, opts?: Record<string, unknown>) => string;

interface Fmt {
    money: (v: number) => string;
    percent: (v: number, opts?: { signed?: boolean }) => string;
    number: (v: number) => string;
}

interface Links {
    product: (id: number) => string;
    productEdit?: (id: number) => string;
    createDiscount?: string;
    analytics?: string;
}

const MIN_ORDERS = 5;

export function computeInsights(d: CommandCenterData, t: T, fmt: Fmt, links: Links): Insight[] {
    const out: Insight[] = [];
    const { sales, orders, aov } = d.kpis;

    // 1. Sales momentum vs the previous period.
    if (sales.previous > 0 && orders.current + orders.previous >= MIN_ORDERS) {
        const change = ((sales.current - sales.previous) / sales.previous) * 100;
        if (Math.abs(change) >= 10) {
            const up = change > 0;
            out.push({
                id: 'sales-momentum',
                tone: up ? 'success' : 'warning',
                title: up
                    ? t('Sales are up {{pct}} on the previous {{days}} days', { pct: fmt.percent(Math.abs(change)), days: d.periodDays })
                    : t('Sales are down {{pct}} on the previous {{days}} days', { pct: fmt.percent(Math.abs(change)), days: d.periodDays }),
                why: up
                    ? t('Momentum is a good moment to make sure best sellers stay in stock')
                    : t('A sustained drop usually shows up in traffic, pricing or stock before it shows up in revenue'),
                evidence: t('{{current}} vs {{previous}}', { current: fmt.money(sales.current), previous: fmt.money(sales.previous) }),
                action: links.analytics ? { label: t('Open analytics'), href: links.analytics } : undefined,
            });
        }
    }

    // 2. Best seller running low.
    const riskyTop = d.topProducts.find((p) => p.stock !== null && p.stock <= d.catalog.lowStockThreshold);
    if (riskyTop) {
        out.push({
            id: 'top-seller-stock',
            tone: riskyTop.stock === 0 ? 'danger' : 'warning',
            title:
                riskyTop.stock === 0
                    ? t('{{name}} is a top seller and is out of stock', { name: riskyTop.name })
                    : t('{{name}} is a top seller with only {{count}} left', { name: riskyTop.name, count: riskyTop.stock }),
            why: t('Stock-outs on best sellers lose the sales that are easiest to win'),
            evidence: t('{{units}} sold for {{revenue}} in the last {{days}} days', {
                units: fmt.number(riskyTop.units),
                revenue: fmt.money(riskyTop.revenue),
                days: d.periodDays,
            }),
            action: { label: t('Restock'), href: (links.productEdit ?? links.product)(riskyTop.id) },
        });
    }

    // 3. Revenue concentration.
    if (sales.current > 0 && d.topProducts.length >= 2 && orders.current >= MIN_ORDERS) {
        const top = d.topProducts[0];
        const share = (top.revenue / sales.current) * 100;
        if (share >= 35) {
            out.push({
                id: 'concentration',
                tone: 'info',
                title: t('{{name}} brings in {{pct}} of sales', { name: top.name, pct: fmt.percent(share) }),
                why: t('Relying on one product makes revenue sensitive to its stock and pricing'),
                evidence: t('{{revenue}} of {{total}}', { revenue: fmt.money(top.revenue), total: fmt.money(sales.current) }),
                action: { label: t('View product'), href: links.product(top.id) },
            });
        }
    }

    // 4. Repeat purchase rate.
    if (d.buyers.total >= 5) {
        const rate = (d.buyers.repeat / d.buyers.total) * 100;
        if (rate < 20) {
            out.push({
                id: 'repeat-rate',
                tone: 'info',
                title: t('Only {{pct}} of buyers ordered more than once', { pct: fmt.percent(rate) }),
                why: t('Returning customers are usually cheaper to win than new ones'),
                evidence: t('{{repeat}} of {{total}} buyers in the last {{days}} days', {
                    repeat: fmt.number(d.buyers.repeat),
                    total: fmt.number(d.buyers.total),
                    days: d.periodDays,
                }),
                action: links.createDiscount ? { label: t('Create a returning-customer discount'), href: links.createDiscount } : undefined,
            });
        }
    }

    // 5. Basket size shift.
    if (aov.previous > 0 && orders.current >= MIN_ORDERS && orders.previous >= MIN_ORDERS) {
        const change = ((aov.current - aov.previous) / aov.previous) * 100;
        if (Math.abs(change) >= 15) {
            out.push({
                id: 'aov-shift',
                tone: change > 0 ? 'success' : 'warning',
                title:
                    change > 0
                        ? t('Average order value rose {{pct}}', { pct: fmt.percent(Math.abs(change)) })
                        : t('Average order value fell {{pct}}', { pct: fmt.percent(Math.abs(change)) }),
                why: t('Basket size moves revenue even when order count stays flat'),
                evidence: t('{{current}} vs {{previous}}', { current: fmt.money(aov.current), previous: fmt.money(aov.previous) }),
            });
        }
    }

    const rank: Record<Tone, number> = { danger: 0, warning: 1, success: 2, info: 3, ai: 4, neutral: 5 };
    return out.sort((a, b) => rank[a.tone] - rank[b.tone]);
}
