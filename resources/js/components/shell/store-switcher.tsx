import { Link, router, usePage } from '@inertiajs/react';
import { Check, ChevronsUpDown, Loader2, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface StoreLite {
    id: number | string;
    name: string;
    slug?: string;
}

function initials(name: string) {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '·';
}

export function SidebarStoreSwitcher({ stores, current, collapsed }: { stores: StoreLite[]; current: StoreLite | null; collapsed?: boolean }) {
    const { t } = useTranslation();
    const { auth } = usePage().props as unknown as { auth?: { user?: { type?: string }; permissions?: string[] } };
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const [query, setQuery] = useState('');
    const isCompany = auth?.user?.type === 'company';
    const canSwitch = isCompany || !!auth?.permissions?.includes('switch-stores');
    const canCreate = isCompany || !!auth?.permissions?.includes('create-stores');

    const badge = (
        <span className="bg-foreground text-background flex size-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold" aria-hidden>
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : initials(current?.name ?? '')}
        </span>
    );

    const label = (
        <span className="min-w-0 flex-1 text-start group-data-[collapsible=icon]:hidden">
            <span className="block truncate text-sm font-semibold leading-tight">{current?.name ?? t('No store yet')}</span>
            <span className="text-muted-foreground block truncate text-[11px] leading-tight">{t('Store')}</span>
        </span>
    );

    if (!canSwitch || stores.length <= 1) {
        return (
            <div className={cn('flex items-center gap-2 rounded-lg p-1.5', collapsed && 'justify-center')}>
                {badge}
                {label}
                {canCreate && stores.length <= 1 && !collapsed && (
                    <Link
                        href={route('stores.create')}
                        className="text-muted-foreground hover:bg-sidebar-accent hover:text-foreground flex size-7 items-center justify-center rounded-md group-data-[collapsible=icon]:hidden"
                        aria-label={t('Create New Store')}
                        title={t('Create New Store')}
                    >
                        <Plus className="size-4" />
                    </Link>
                )}
            </div>
        );
    }

    const filtered = query ? stores.filter((s) => s.name.toLowerCase().includes(query.toLowerCase())) : stores;

    const select = (s: StoreLite) => {
        setOpen(false);
        if (String(s.id) === String(current?.id)) return;
        setBusy(true);
        router.post(route('switch-store'), { store_id: s.id }, { onFinish: () => setBusy(false) });
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    disabled={busy}
                    aria-label={t('Switch store')}
                    className="hover:bg-sidebar-accent focus-visible:ring-sidebar-ring flex w-full items-center gap-2 rounded-lg p-1.5 outline-none focus-visible:ring-2"
                >
                    {badge}
                    {label}
                    <ChevronsUpDown className="text-muted-foreground size-4 shrink-0 group-data-[collapsible=icon]:hidden" aria-hidden />
                </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-1.5">
                {stores.length > 5 && (
                    <div className="relative mb-1">
                        <Search className="text-muted-foreground absolute start-2 top-1/2 size-3.5 -translate-y-1/2" aria-hidden />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t('Find a store')}
                            aria-label={t('Find a store')}
                            className="h-8 w-full rounded-md bg-transparent ps-7 text-sm outline-none"
                        />
                    </div>
                )}
                <p className="text-muted-foreground px-2 py-1 text-[11px] font-semibold uppercase">{t('Your stores')}</p>
                <ul className="max-h-72 overflow-y-auto" role="listbox" aria-label={t('Your stores')}>
                    {filtered.map((s) => {
                        const on = String(s.id) === String(current?.id);
                        return (
                            <li key={s.id} role="option" aria-selected={on}>
                                <button type="button" onClick={() => select(s)} className="hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm">
                                    <span className="bg-muted flex size-6 items-center justify-center rounded text-[10px] font-bold">{initials(s.name)}</span>
                                    <span className="flex-1 truncate text-start">{s.name}</span>
                                    {on && <Check className="size-4" aria-hidden />}
                                </button>
                            </li>
                        );
                    })}
                    {filtered.length === 0 && <li className="text-muted-foreground px-2 py-4 text-center text-sm">{t('No store found')}</li>}
                </ul>
                {canCreate && (
                    <Link href={route('stores.create')} className="hover:bg-accent mt-1 flex items-center gap-2 rounded-md border-t px-2 py-2 text-sm font-medium">
                        <Plus className="size-4" aria-hidden />
                        {t('Create New Store')}
                    </Link>
                )}
            </PopoverContent>
        </Popover>
    );
}
