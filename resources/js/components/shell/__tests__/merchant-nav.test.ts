import { activeNavId, buildMerchantNav } from '../merchant-nav';

const t = (s: string) => s;

// Real URL shapes (the shared Jest route() mock returns route names).
const PATHS: Record<string, string> = {
    dashboard: '/dashboard',
    'orders.index': '/orders',
    'products.index': '/products',
    'categories.index': '/categories',
    'tax.index': '/tax',
    'inventory.index': '/inventory',
    'customers.index': '/customers',
    'stores.index': '/stores',
    'stores.content.index': '/stores/content',
};
beforeAll(() => {
    (globalThis as unknown as { route: (n: string) => string }).route = (name: string) => PATHS[name] ?? `/${name.replace(/\.index$/, '').replace(/\./g, '/')}`;
});

describe('merchant navigation', () => {
    it('only exposes destinations the user may access', () => {
        const groups = buildMerchantNav({ t, can: (p) => ['manage-orders'].includes(p), isCompany: false, feature: () => true });
        const ids = groups.flatMap((g) => g.items.map((i) => i.id));
        expect(ids).toEqual(['orders']);
    });

    it('drops empty groups and gates plan features', () => {
        const groups = buildMerchantNav({ t, can: () => true, isCompany: true, feature: (f) => f !== 'blog' });
        expect(groups.every((g) => g.items.length > 0)).toBe(true);
        expect(groups.flatMap((g) => g.items).some((i) => i.id === 'blog')).toBe(false);
    });

    it('resolves the most specific active item', () => {
        const groups = buildMerchantNav({ t, can: () => true, isCompany: true, feature: () => true });
        expect(activeNavId(groups, '/stores/content')).toBe('content');
        expect(activeNavId(groups, '/stores/3/edit')).toBe('stores');
        expect(activeNavId(groups, '/orders/12')).toBe('orders');
        expect(activeNavId(groups, '/categories')).toBe('products');
    });
});
