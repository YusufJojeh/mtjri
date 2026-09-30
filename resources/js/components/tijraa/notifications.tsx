import { Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { Bell, BookOpen, CheckCheck, CircleAlert, Package, Percent, ShoppingCart, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCommerceFormat } from '@/hooks/use-commerce-format';
import { cn } from '@/lib/utils';
import type { TijraaShared } from '@/lib/tijraa/types';

export interface MerchantNotificationView {
    id: number;
    type: string;
    category: string;
    severity: 'info' | 'success' | 'warning' | 'critical';
    title: string;
    body: string | null;
    params: Record<string, string | number>;
    url: string | null;
    read: boolean;
    created_at: string;
}

export const CATEGORY_ICON: Record<string, typeof Bell> = {
    orders: ShoppingCart,
    inventory: Package,
    ai: Sparkles,
    knowledge: BookOpen,
    discounts: Percent,
    system: CircleAlert,
};

/** Titles are stored as English templates with :params; translate, then fill. */
export function useNotificationText() {
    const { t } = useTranslation();
    const fmt = useCommerceFormat();
    return (template: string | null, params: Record<string, string | number>) =>
        template
            ? t(template).replace(/:(\w+)/g, (m, key: string) => {
                  if (!(key in params)) return m;
                  const v = params[key];
                  if (key === 'total' || key === 'value' || key === 'revenue') return fmt.money(v);
                  if (key === 'type') return t(String(v));
                  return typeof v === 'number' ? fmt.number(v) : String(v);
              })
            : '';
}

export function NotificationRow({ n, onOpen, dense }: { n: MerchantNotificationView; onOpen: (n: MerchantNotificationView) => void; dense?: boolean }) {
    const fmt = useCommerceFormat();
    const text = useNotificationText();
    const { t } = useTranslation();
    const Icon = CATEGORY_ICON[n.category] ?? Bell;
    return (
        <button
            type="button"
            onClick={() => onOpen(n)}
            className={cn('hover:bg-muted/60 focus-visible:ring-ring/40 flex w-full gap-3 px-4 text-start outline-none focus-visible:ring-[3px] focus-visible:ring-inset', dense ? 'py-2.5' : 'py-3')}
        >
            <span
                className={cn(
                    'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full [&_svg]:size-4',
                    n.severity === 'critical' ? 'bg-danger-soft text-danger-fg' : n.severity === 'warning' ? 'bg-warning-soft text-warning-fg' : n.severity === 'success' ? 'bg-success-soft text-success-fg' : 'bg-muted text-muted-foreground',
                )}
                aria-hidden
            >
                <Icon />
            </span>
            <span className="min-w-0 flex-1">
                <span className={cn('block text-sm', !n.read && 'font-semibold')}>{text(n.title, n.params)}</span>
                {n.body && <span className="text-muted-foreground line-clamp-2 block text-xs">{text(n.body, n.params)}</span>}
                <span className="text-muted-foreground block text-[11px]">{fmt.relative(n.created_at)}</span>
            </span>
            {!n.read && (
                <span className="bg-ai mt-2 size-2 shrink-0 rounded-full">
                    <span className="sr-only">{t('Unread')}</span>
                </span>
            )}
        </button>
    );
}

export function openNotification(n: MerchantNotificationView) {
    router.post(route('notifications.read', n.id), {}, { preserveState: false });
}

/** Header bell: unread count from shared props, list fetched on open, light polling. */
export function NotificationBell() {
    const { t } = useTranslation();
    const shared = (usePage().props as { tijraa?: TijraaShared | null }).tijraa;
    const [unread, setUnread] = useState(shared?.unread_notifications ?? 0);
    const [items, setItems] = useState<MerchantNotificationView[] | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => setUnread(shared?.unread_notifications ?? 0), [shared?.unread_notifications]);

    const load = useCallback(async () => {
        try {
            const res = await axios.get(route('notifications.feed'));
            setItems(res.data.items);
            setUnread(res.data.unread);
        } catch {
            /* keep last state */
        }
    }, []);

    useEffect(() => {
        if (open) load();
    }, [open, load]);

    useEffect(() => {
        const id = setInterval(() => document.visibilityState === 'visible' && load(), 60000);
        return () => clearInterval(id);
    }, [load]);

    if (!shared) return null;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative size-9" aria-label={unread ? t('Notifications, {{count}} unread', { count: unread }) : t('Notifications')}>
                    <Bell className="size-[18px]" />
                    {unread > 0 && (
                        <span className="bg-danger absolute end-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white tabular-nums" aria-hidden>
                            {unread > 99 ? '99+' : unread}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[min(92vw,380px)] p-0">
                <div className="flex items-center justify-between border-b px-4 py-2.5">
                    <p className="text-sm font-semibold">{t('Notifications')}</p>
                    {unread > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={async () => {
                                await axios.post(route('notifications.read-all'), {}, { headers: { Accept: 'application/json' } });
                                setUnread(0);
                                setItems((l) => l?.map((n) => ({ ...n, read: true })) ?? null);
                            }}
                        >
                            <CheckCheck className="size-3.5" /> {t('Mark all read')}
                        </Button>
                    )}
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                    {items === null ? (
                        <p className="text-muted-foreground px-4 py-6 text-center text-sm">{t('Loading…')}</p>
                    ) : items.length === 0 ? (
                        <p className="text-muted-foreground px-4 py-8 text-center text-sm">{t('You are all caught up.')}</p>
                    ) : (
                        <ul className="divide-y">
                            {items.map((n) => (
                                <li key={n.id}>
                                    <NotificationRow
                                        n={n}
                                        dense
                                        onOpen={(x) => {
                                            setOpen(false);
                                            openNotification(x);
                                        }}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="border-t px-4 py-2 text-center">
                    <Link href={route('notifications.index')} className="text-xs font-medium hover:underline" onClick={() => setOpen(false)}>
                        {t('View all notifications')}
                    </Link>
                </div>
            </PopoverContent>
        </Popover>
    );
}
