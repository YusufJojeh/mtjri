import { Link, usePage } from '@inertiajs/react';
import { Home, Menu, Package, ShoppingCart, UsersRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { activeNavId, type MerchantNavGroup } from './merchant-nav';

/**
 * Phone navigation: the four most-used destinations one thumb away,
 * everything else behind "More" (the sidebar sheet).
 */
export function MobileTabBar({ groups }: { groups: MerchantNavGroup[] }) {
    const { t } = useTranslation();
    const page = usePage();
    const { setOpenMobile, openMobile } = useSidebar();
    const all = groups.flatMap((g) => g.items);
    const pick = ['home', 'orders', 'products', 'customers'];
    const icons: Record<string, typeof Home> = { home: Home, orders: ShoppingCart, products: Package, customers: UsersRound };
    const tabs = pick.map((id) => all.find((i) => i.id === id)).filter(Boolean) as typeof all;
    const active = activeNavId(groups, page.url.split('?')[0]);
    const inTabs = tabs.some((tab) => tab.id === active);

    if (!tabs.length) return null;

    return (
        <nav
            aria-label={t('Primary')}
            className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        >
            <ul className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length + 1}, minmax(0, 1fr))` }}>
                {tabs.map((tab) => {
                    const Icon = icons[tab.id] ?? tab.icon;
                    const on = tab.id === active;
                    return (
                        <li key={tab.id}>
                            <Link
                                href={tab.href}
                                aria-current={on ? 'page' : undefined}
                                className={cn('flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium', on ? 'text-foreground' : 'text-muted-foreground')}
                            >
                                <Icon className={cn('size-5', on && 'stroke-[2.25]')} aria-hidden />
                                <span className="max-w-full truncate px-1">{tab.title}</span>
                            </Link>
                        </li>
                    );
                })}
                <li>
                    <button
                        type="button"
                        onClick={() => setOpenMobile(true)}
                        aria-expanded={openMobile}
                        className={cn('flex h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium', !inTabs && active ? 'text-foreground' : 'text-muted-foreground')}
                    >
                        <Menu className="size-5" aria-hidden />
                        <span>{t('More')}</span>
                    </button>
                </li>
            </ul>
        </nav>
    );
}
