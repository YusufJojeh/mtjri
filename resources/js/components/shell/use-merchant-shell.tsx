import { usePage } from '@inertiajs/react';
import { ExternalLink, Package, Percent, UserPlus } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { buildMerchantNav, type MerchantNavGroup } from './merchant-nav';

interface SharedAuth {
    user?: { type?: string; role?: string; current_store?: number | string; plan?: Record<string, unknown> | null; stores?: Array<{ id: number | string; name: string; slug?: string }> };
    permissions?: string[];
}

export function useMerchantShell() {
    const { t } = useTranslation();
    const page = usePage();
    const props = page.props as unknown as { auth?: SharedAuth; stores?: Array<{ id: number | string; name: string; slug?: string }> };
    const auth = props.auth ?? {};
    const permissions = useMemo(() => auth.permissions ?? [], [auth.permissions]);
    const role = auth.user?.type || auth.user?.role;
    const isSuperAdmin = role === 'superadmin' || role === 'super admin';
    const isCompany = role === 'company';
    const plan = auth.user?.plan ?? null;

    const stores = Array.isArray(props.stores) ? props.stores : [];
    const currentStore = stores.find((s) => String(s.id) === String(auth.user?.current_store)) ?? stores[0] ?? null;

    const can = (p: string) => permissions.includes(p);

    const groups: MerchantNavGroup[] = useMemo(() => {
        if (isSuperAdmin) return [];
        const featureMap = { blog: 'enable_blog', custom_pages: 'enable_custom_pages', shipping_method: 'enable_shipping_method' } as const;
        return buildMerchantNav({
            t,
            can: (p) => permissions.includes(p),
            isCompany,
            feature: (f) => !plan || plan[featureMap[f]] === 'on',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [t, permissions, isCompany, isSuperAdmin, plan]);

    const quickActions = useMemo(() => {
        const a: Array<{ id: string; label: string; href: string; icon: React.ReactNode; external?: boolean }> = [];
        if (isSuperAdmin) return a;
        if (permissions.includes('create-products')) a.push({ id: 'new-product', label: t('Add product'), href: route('products.create'), icon: <Package /> });
        if (permissions.includes('create-coupon-system')) a.push({ id: 'new-discount', label: t('Create discount'), href: route('coupon-system.create'), icon: <Percent /> });
        if (permissions.includes('create-customers')) a.push({ id: 'new-customer', label: t('Add customer'), href: route('customers.create'), icon: <UserPlus /> });
        if (currentStore?.slug) a.push({ id: 'visit-store', label: t('View storefront'), href: route('store.home', { storeSlug: currentStore.slug }), icon: <ExternalLink />, external: true });
        return a;
    }, [permissions, isSuperAdmin, currentStore?.slug, t]);

    return { groups, quickActions, isSuperAdmin, isCompany, stores, currentStore, can };
}
