import { computeInsights, type CommandCenterData } from '../insights';

const t = (k: string, o?: Record<string, unknown>) => k.replace(/\{\{(\w+)\}\}/g, (_, n) => String(o?.[n] ?? ''));
const fmt = { money: (v: number) => `$${v}`, percent: (v: number) => `${Math.round(v)}%`, number: (v: number) => String(v) };
const links = { product: (id: number) => `/products/${id}`, createDiscount: '/coupon-system/create', analytics: '/analytics' };

function data(over: Partial<CommandCenterData> = {}): CommandCenterData {
    return {
        periodDays: 30,
        kpis: { sales: { current: 1000, previous: 1000 }, orders: { current: 10, previous: 10 }, aov: { current: 100, previous: 100 }, newCustomers: { current: 1, previous: 1 } },
        topProducts: [],
        buyers: { total: 0, repeat: 0 },
        catalog: { products: 10, active: 10, lowStockThreshold: 20 },
        ...over,
    };
}

describe('computeInsights', () => {
    it('stays silent when nothing meaningful changed', () => {
        expect(computeInsights(data(), t, fmt, links)).toEqual([]);
    });

    it('flags a sales drop with evidence and a next step', () => {
        const [i] = computeInsights(data({ kpis: { ...data().kpis, sales: { current: 700, previous: 1000 } } }), t, fmt, links);
        expect(i.id).toBe('sales-momentum');
        expect(i.tone).toBe('warning');
        expect(i.evidence).toBe('$700 vs $1000');
        expect(i.action?.href).toBe('/analytics');
    });

    it('prioritises a best seller that is out of stock', () => {
        const out = computeInsights(
            data({ kpis: { ...data().kpis, sales: { current: 1500, previous: 1000 } }, topProducts: [{ id: 7, name: 'Lamp', units: 30, revenue: 900, stock: 0 }, { id: 8, name: 'Rug', units: 3, revenue: 100, stock: 50 }] }),
            t,
            fmt,
            links,
        );
        expect(out[0]).toMatchObject({ id: 'top-seller-stock', tone: 'danger' });
        expect(out.map((i) => i.id)).toContain('concentration');
    });

    it('does not invent a comparison without a previous period', () => {
        const out = computeInsights(data({ kpis: { ...data().kpis, sales: { current: 5000, previous: 0 } } }), t, fmt, links);
        expect(out.find((i) => i.id === 'sales-momentum')).toBeUndefined();
    });

    it('suggests a returning-customer discount when repeat rate is low', () => {
        const out = computeInsights(data({ buyers: { total: 20, repeat: 2 } }), t, fmt, links);
        expect(out.find((i) => i.id === 'repeat-rate')?.action?.href).toBe('/coupon-system/create');
    });
});
