import type { LucideIcon } from 'lucide-react';
import {
    BarChart3,
    Boxes,
    CreditCard,
    FileText,
    Gift,
    Home,
    Image,
    LayoutTemplate,
    Megaphone,
    Newspaper,
    Package,
    Percent,
    Settings,
    ShoppingCart,
    Smartphone,
    Star,
    Store,
    Truck,
    Users,
    UsersRound,
    Zap,
} from 'lucide-react';

export interface MerchantNavItem {
    id: string;
    title: string;
    href: string;
    icon: LucideIcon;
    /** Extra URL prefixes that should mark this item active. */
    match?: string[];
    children?: Array<{ id: string; title: string; href: string }>;
}

export interface MerchantNavGroup {
    id: string;
    label?: string;
    items: MerchantNavItem[];
}

interface Ctx {
    t: (s: string) => string;
    can: (permission: string) => boolean;
    isCompany: boolean;
    feature: (f: 'blog' | 'custom_pages' | 'shipping_method') => boolean;
}

/**
 * Merchant information architecture. Only routes that exist and that the
 * current user may access are returned; empty groups are dropped.
 */
export function buildMerchantNav({ t, can, isCompany, feature }: Ctx): MerchantNavGroup[] {
    const any = (...p: string[]) => p.some(can);
    const groups: MerchantNavGroup[] = [];

    const home: MerchantNavItem[] = [];
    if (isCompany || can('manage-dashboard')) home.push({ id: 'home', title: t('Home'), href: route('dashboard'), icon: Home });
    groups.push({ id: 'home', items: home });

    const commerce: MerchantNavItem[] = [];
    if (can('manage-orders')) commerce.push({ id: 'orders', title: t('Orders'), href: route('orders.index'), icon: ShoppingCart });
    if (can('manage-products')) {
        const children = [{ id: 'products-all', title: t('All products'), href: route('products.index') }];
        if (can('manage-categories')) children.push({ id: 'categories', title: t('Categories'), href: route('categories.index') });
        if (can('manage-tax')) children.push({ id: 'tax', title: t('Tax'), href: route('tax.index') });
        commerce.push({ id: 'products', title: t('Products'), href: route('products.index'), icon: Package, match: ['/categories', '/tax'], children: children.length > 1 ? children : undefined });
        commerce.push({ id: 'inventory', title: t('Inventory'), href: route('inventory.index'), icon: Boxes });
    } else if (can('manage-categories')) {
        commerce.push({ id: 'categories', title: t('Categories'), href: route('categories.index'), icon: Package });
    }
    if (can('manage-customers')) commerce.push({ id: 'customers', title: t('Customers'), href: route('customers.index'), icon: UsersRound });
    if (can('manage-pos')) commerce.push({ id: 'pos', title: t('Point of sale'), href: route('pos.index'), icon: Smartphone });
    groups.push({ id: 'commerce', label: t('Commerce'), items: commerce });

    const growth: MerchantNavItem[] = [];
    if (can('manage-coupon-system')) growth.push({ id: 'discounts', title: t('Discounts'), href: route('coupon-system.index'), icon: Percent });
    if (can('manage-reviews')) growth.push({ id: 'reviews', title: t('Reviews'), href: route('reviews.index'), icon: Star });
    if (can('manage-newsletter-subscribers')) growth.push({ id: 'newsletter', title: t('Subscribers'), href: route('newsletter-subscribers.index'), icon: Megaphone });
    if (can('manage-blog') && feature('blog')) growth.push({ id: 'blog', title: t('Blog'), href: route('blog.index'), icon: Newspaper });
    if (any('view-express-checkout', 'manage-express-checkout')) growth.push({ id: 'express', title: t('Express checkout'), href: route('express-checkout.index'), icon: Zap });
    groups.push({ id: 'growth', label: t('Growth'), items: growth });

    const intel: MerchantNavItem[] = [];
    if (any('view-analytics', 'manage-analytics')) intel.push({ id: 'analytics', title: t('Analytics'), href: route('analytics.index'), icon: BarChart3 });
    groups.push({ id: 'intelligence', label: t('Intelligence'), items: intel });

    const store: MerchantNavItem[] = [];
    if (isCompany || any('manage-stores', 'view-stores')) store.push({ id: 'stores', title: t('Stores'), href: route('stores.index'), icon: Store, match: ['/stores/'] });
    if (isCompany || can('view-store-content')) store.push({ id: 'content', title: t('Storefront content'), href: route('stores.content.index'), icon: LayoutTemplate });
    if (can('manage-custom-pages') && feature('custom_pages')) store.push({ id: 'pages', title: t('Pages'), href: route('custom-pages.index'), icon: FileText });
    if (can('manage-shipping') && feature('shipping_method')) store.push({ id: 'shipping', title: t('Shipping'), href: route('shipping.index'), icon: Truck });
    if (any('manage-media', 'view-media')) store.push({ id: 'media', title: t('Media'), href: route('media-library'), icon: Image });
    groups.push({ id: 'store', label: t('Store'), items: store });

    const admin: MerchantNavItem[] = [];
    if (any('manage-users', 'manage-roles')) {
        const children: Array<{ id: string; title: string; href: string }> = [];
        if (can('manage-users')) children.push({ id: 'users', title: t('Users'), href: route('users.index') });
        if (can('manage-roles')) children.push({ id: 'roles', title: t('Roles'), href: route('roles.index') });
        admin.push({ id: 'staff', title: t('Staff'), href: children[0].href, icon: Users, match: ['/users', '/roles'], children: children.length > 1 ? children : undefined });
    }
    if (any('view-plans', 'manage-plans', 'manage-plan-requests', 'view-plan-requests', 'manage-plan-orders', 'view-plan-orders')) {
        const children: Array<{ id: string; title: string; href: string }> = [];
        if (any('view-plans', 'manage-plans')) children.push({ id: 'plans', title: t('Plan'), href: route('plans.index') });
        if (any('manage-plan-requests', 'view-plan-requests')) children.push({ id: 'plan-requests', title: t('Plan requests'), href: route('plan-requests.index') });
        if (any('manage-plan-orders', 'view-plan-orders')) children.push({ id: 'plan-orders', title: t('Billing history'), href: route('plan-orders.index') });
        admin.push({ id: 'billing', title: t('Plan & billing'), href: children[0].href, icon: CreditCard, match: ['/plan'], children: children.length > 1 ? children : undefined });
    }
    if (can('manage-referral')) admin.push({ id: 'referral', title: t('Referrals'), href: route('referral.index'), icon: Gift });
    if (
        any(
            'manage-settings',
            'manage-system-settings',
            'manage-email-settings',
            'manage-brand-settings',
            'manage-company-settings',
            'manage-storage-settings',
            'manage-payment-settings',
            'manage-currency-settings',
            'manage-recaptcha-settings',
            'manage-chatgpt-settings',
            'manage-cookie-settings',
            'manage-seo-settings',
            'manage-cache-settings',
            'manage-account-settings',
            'manage-webhook-settings',
        )
    ) {
        admin.push({ id: 'settings', title: t('Settings'), href: route('settings'), icon: Settings, match: ['/settings', '/email-templates'] });
    }
    groups.push({ id: 'admin', label: t('Account'), items: admin });

    return groups.filter((g) => g.items.length > 0);
}

/** Pathname of an absolute or relative href. */
export function pathOf(href: string): string {
    try {
        return new URL(href, 'http://x').pathname.replace(/\/+$/, '') || '/';
    } catch {
        return href;
    }
}

/** The single most specific active item (longest matching prefix wins). */
export function activeNavId(groups: MerchantNavGroup[], currentPath: string): string | null {
    const cur = currentPath.split('?')[0].replace(/\/+$/, '') || '/';
    let best: { id: string; len: number } | null = null;
    for (const g of groups) {
        for (const item of g.items) {
            const prefixes = [pathOf(item.href), ...(item.match ?? []), ...(item.children ?? []).map((c) => pathOf(c.href))];
            for (const p of prefixes) {
                if (!p) continue;
                const hit = cur === p || cur.startsWith(p.endsWith('/') ? p : p + '/');
                if (hit && (!best || p.length > best.len)) best = { id: item.id, len: p.length };
            }
        }
    }
    return best?.id ?? null;
}
