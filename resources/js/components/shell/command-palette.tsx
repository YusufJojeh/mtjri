import * as DialogPrimitive from '@radix-ui/react-dialog';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { Command } from 'cmdk';
import { CornerDownLeft, ExternalLink, Loader2, Package, Percent, Plus, Search, ShoppingCart, UserRound } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCommerceFormat } from '@/hooks/use-commerce-format';
import { orderStatusMeta } from '@/lib/commerce/status';
import type { MerchantNavGroup } from './merchant-nav';

export const OPEN_COMMAND_EVENT = 'tijra:command-palette';

export function openCommandPalette() {
    window.dispatchEvent(new CustomEvent(OPEN_COMMAND_EVENT));
}

interface SearchResults {
    orders: Array<{ id: number; number: string; customer: string; total: number; status: string }>;
    products: Array<{ id: number; name: string; sku: string | null; price: number; stock: number }>;
    customers: Array<{ id: number; name: string; email: string | null }>;
}

const EMPTY: SearchResults = { orders: [], products: [], customers: [] };

interface QuickAction {
    id: string;
    label: string;
    href: string;
    icon: React.ReactNode;
    external?: boolean;
}

interface Props {
    groups: MerchantNavGroup[];
    actions: QuickAction[];
}

const itemCls =
    'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0';

export function CommandPalette({ groups, actions }: Props) {
    const { t } = useTranslation();
    const fmt = useCommerceFormat();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults>(EMPTY);
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setOpen((o) => !o);
            }
        };
        const onOpen = () => setOpen(true);
        window.addEventListener('keydown', onKey);
        window.addEventListener(OPEN_COMMAND_EVENT, onOpen);
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener(OPEN_COMMAND_EVENT, onOpen);
        };
    }, []);

    useEffect(() => {
        if (!open) {
            setQuery('');
            setResults(EMPTY);
            setFailed(false);
        }
    }, [open]);

    useEffect(() => {
        const q = query.trim();
        abortRef.current?.abort();
        if (q.length < 2) {
            setResults(EMPTY);
            setLoading(false);
            return;
        }
        const ctrl = new AbortController();
        abortRef.current = ctrl;
        setLoading(true);
        const id = setTimeout(async () => {
            try {
                const res = await axios.get(route('merchant.search'), { params: { q }, signal: ctrl.signal });
                setResults({ ...EMPTY, ...(res.data as SearchResults) });
                setFailed(false);
            } catch (e) {
                if (!axios.isCancel(e)) setFailed(true);
            } finally {
                if (!ctrl.signal.aborted) setLoading(false);
            }
        }, 180);
        return () => {
            clearTimeout(id);
            ctrl.abort();
        };
    }, [query]);

    const navItems = useMemo(
        () =>
            groups.flatMap((g) => [
                ...g.items.map((i) => ({ id: i.id, title: i.title, href: i.href, group: g.label ?? '', icon: i.icon })),
                ...g.items.flatMap((i) => (i.children ?? []).filter((c) => c.href !== i.href).map((c) => ({ id: c.id, title: c.title, href: c.href, group: i.title, icon: i.icon }))),
            ]),
        [groups],
    );

    const q = query.trim().toLowerCase();
    const matchedNav = q ? navItems.filter((n) => n.title.toLowerCase().includes(q) || n.group.toLowerCase().includes(q)) : navItems.slice(0, 6);
    const matchedActions = q ? actions.filter((a) => a.label.toLowerCase().includes(q)) : actions;
    const hasRemote = results.orders.length + results.products.length + results.customers.length > 0;

    const go = (href: string, external?: boolean) => {
        setOpen(false);
        if (external) window.open(href, '_blank', 'noopener,noreferrer');
        else router.visit(href);
    };

    return (
        <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px]" />
                <DialogPrimitive.Content
                    aria-describedby={undefined}
                    className="bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98] fixed start-1/2 top-3 z-50 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border shadow-pop sm:top-[12vh] rtl:translate-x-1/2"
                >
                    <DialogPrimitive.Title className="sr-only">{t('Search and commands')}</DialogPrimitive.Title>
                    <Command shouldFilter={false} loop label={t('Search and commands')}>
                        <div className="flex items-center gap-2 border-b px-3">
                            {loading ? <Loader2 className="text-muted-foreground size-4 animate-spin" aria-hidden /> : <Search className="text-muted-foreground size-4" aria-hidden />}
                            <Command.Input
                                value={query}
                                onValueChange={setQuery}
                                placeholder={t('Search orders, products, customers…')}
                                className="placeholder:text-muted-foreground h-12 w-full bg-transparent text-sm outline-none"
                            />
                            <kbd className="text-muted-foreground hidden rounded border px-1.5 py-0.5 text-[10px] font-medium sm:inline">Esc</kbd>
                        </div>
                        <Command.List className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
                            {q.length >= 2 && !loading && !hasRemote && matchedNav.length === 0 && matchedActions.length === 0 && (
                                <p className="text-muted-foreground px-3 py-8 text-center text-sm">{failed ? t('Search is unavailable right now') : t('No matches for “{{q}}”', { q: query.trim() })}</p>
                            )}

                            {results.orders.length > 0 && (
                                <Command.Group heading={t('Orders')} className="[&_[cmdk-group-heading]]:text-muted-foreground mb-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold">
                                    {results.orders.map((o) => (
                                        <Command.Item key={`o${o.id}`} value={`order-${o.id}`} onSelect={() => go(route('orders.show', o.id))} className={itemCls}>
                                            <ShoppingCart className="text-muted-foreground" />
                                            <span className="min-w-0 flex-1 truncate">
                                                <span className="font-medium">{o.number}</span>
                                                <span className="text-muted-foreground"> · {o.customer || t('Guest')}</span>
                                            </span>
                                            <span className="text-muted-foreground text-xs">{t(orderStatusMeta(o.status).label)}</span>
                                            <span className="text-xs font-medium tabular-nums">{fmt.money(o.total)}</span>
                                        </Command.Item>
                                    ))}
                                </Command.Group>
                            )}
                            {results.products.length > 0 && (
                                <Command.Group heading={t('Products')} className="[&_[cmdk-group-heading]]:text-muted-foreground mb-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold">
                                    {results.products.map((p) => (
                                        <Command.Item key={`p${p.id}`} value={`product-${p.id}`} onSelect={() => go(route('products.show', p.id))} className={itemCls}>
                                            <Package className="text-muted-foreground" />
                                            <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                                            <span className="text-muted-foreground text-xs tabular-nums">{t('{{count}} in stock', { count: p.stock })}</span>
                                        </Command.Item>
                                    ))}
                                </Command.Group>
                            )}
                            {results.customers.length > 0 && (
                                <Command.Group heading={t('Customers')} className="[&_[cmdk-group-heading]]:text-muted-foreground mb-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold">
                                    {results.customers.map((c) => (
                                        <Command.Item key={`c${c.id}`} value={`customer-${c.id}`} onSelect={() => go(route('customers.show', c.id))} className={itemCls}>
                                            <UserRound className="text-muted-foreground" />
                                            <span className="min-w-0 flex-1 truncate">
                                                <span className="font-medium">{c.name}</span>
                                                {c.email && <span className="text-muted-foreground"> · {c.email}</span>}
                                            </span>
                                        </Command.Item>
                                    ))}
                                </Command.Group>
                            )}

                            {matchedActions.length > 0 && (
                                <Command.Group heading={t('Actions')} className="[&_[cmdk-group-heading]]:text-muted-foreground mb-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold">
                                    {matchedActions.map((a) => (
                                        <Command.Item key={a.id} value={`action-${a.id}`} onSelect={() => go(a.href, a.external)} className={itemCls}>
                                            <span className="text-muted-foreground">{a.icon}</span>
                                            <span className="flex-1">{a.label}</span>
                                            {a.external && <ExternalLink className="text-muted-foreground size-3.5!" aria-hidden />}
                                        </Command.Item>
                                    ))}
                                </Command.Group>
                            )}

                            {matchedNav.length > 0 && (
                                <Command.Group heading={t('Go to')} className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold">
                                    {matchedNav.map((n) => {
                                        const Icon = n.icon;
                                        return (
                                            <Command.Item key={`n${n.id}`} value={`nav-${n.id}`} onSelect={() => go(n.href)} className={itemCls}>
                                                <Icon className="text-muted-foreground" />
                                                <span className="flex-1">{n.title}</span>
                                                {n.group && <span className="text-muted-foreground text-xs">{n.group}</span>}
                                            </Command.Item>
                                        );
                                    })}
                                </Command.Group>
                            )}
                        </Command.List>
                        <div className="text-muted-foreground hidden items-center justify-between border-t px-3 py-2 text-[11px] sm:flex">
                            <span className="inline-flex items-center gap-1">
                                <CornerDownLeft className="size-3" aria-hidden /> {t('to open')}
                            </span>
                            <span>{t('Results respect your permissions')}</span>
                        </div>
                    </Command>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

export const quickActionIcons = { plus: <Plus />, percent: <Percent />, external: <ExternalLink /> };
