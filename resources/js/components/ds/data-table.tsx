import { Link, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

/* ----------------------------------------------------------------------------
 * DataTable — a real table from md up; stacked cards on phones.
 * Never squeezes a wide table onto a 390px screen.
 * ------------------------------------------------------------------------- */
export interface Column<T> {
    key: string;
    header: React.ReactNode;
    cell: (row: T) => React.ReactNode;
    align?: 'start' | 'end' | 'center';
    className?: string;
    /** Hide below lg to keep tablet layouts breathable. */
    hideBelow?: 'lg' | 'xl';
}

interface DataTableProps<T> {
    rows: T[];
    columns: Column<T>[];
    rowKey: (row: T) => string | number;
    /** Mobile card renderer; required so phones get a purpose-built layout. */
    mobileCard: (row: T) => React.ReactNode;
    rowHref?: (row: T) => string | undefined;
    empty?: React.ReactNode;
    loading?: boolean;
    caption?: string;
    selectable?: {
        selected: Set<string | number>;
        onChange: (next: Set<string | number>) => void;
    };
}

const alignCls = { start: 'text-start', end: 'text-end', center: 'text-center' };
const hideCls = { lg: 'hidden lg:table-cell', xl: 'hidden xl:table-cell' };

export function DataTable<T>({ rows, columns, rowKey, mobileCard, rowHref, empty, loading, caption, selectable }: DataTableProps<T>) {
    const { t } = useTranslation();

    if (loading) {
        return (
            <div className="space-y-2 p-4" aria-busy="true" aria-live="polite">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                ))}
            </div>
        );
    }

    if (!rows.length) return <>{empty}</>;

    const allKeys = rows.map(rowKey);
    const allSelected = selectable ? allKeys.every((k) => selectable.selected.has(k)) : false;

    const toggleAll = () => {
        if (!selectable) return;
        selectable.onChange(allSelected ? new Set() : new Set(allKeys));
    };
    const toggle = (k: string | number) => {
        if (!selectable) return;
        const next = new Set(selectable.selected);
        if (next.has(k)) next.delete(k);
        else next.add(k);
        selectable.onChange(next);
    };

    const onRowClick = (e: React.MouseEvent, row: T) => {
        const href = rowHref?.(row);
        if (!href) return;
        const target = e.target as HTMLElement;
        if (target.closest('a,button,input,label,[role="menuitem"],[data-no-row-click]')) return;
        if (e.metaKey || e.ctrlKey) {
            window.open(href, '_blank');
            return;
        }
        router.visit(href);
    };

    return (
        <>
            {/* Desktop / tablet */}
            <div className="hidden md:block">
                <table className="w-full border-collapse text-sm">
                    {caption && <caption className="sr-only">{caption}</caption>}
                    <thead>
                        <tr className="border-b">
                            {selectable && (
                                <th scope="col" className="w-10 ps-4">
                                    <input
                                        type="checkbox"
                                        className="accent-primary size-4 align-middle"
                                        aria-label={t('Select all')}
                                        checked={allSelected}
                                        onChange={toggleAll}
                                    />
                                </th>
                            )}
                            {columns.map((c) => (
                                <th
                                    key={c.key}
                                    scope="col"
                                    className={cn(
                                        'text-muted-foreground h-9 px-3 text-xs font-medium whitespace-nowrap first:ps-4 last:pe-4',
                                        alignCls[c.align ?? 'start'],
                                        c.hideBelow && hideCls[c.hideBelow],
                                        c.className,
                                    )}
                                >
                                    {c.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => {
                            const k = rowKey(row);
                            const href = rowHref?.(row);
                            return (
                                <tr
                                    key={k}
                                    onClick={(e) => onRowClick(e, row)}
                                    className={cn(
                                        'border-b transition-colors last:border-0',
                                        href && 'hover:bg-muted/50 cursor-pointer',
                                        selectable?.selected.has(k) && 'bg-muted/60',
                                    )}
                                >
                                    {selectable && (
                                        <td className="w-10 ps-4" data-no-row-click>
                                            <input
                                                type="checkbox"
                                                className="accent-primary size-4 align-middle"
                                                aria-label={t('Select row')}
                                                checked={selectable.selected.has(k)}
                                                onChange={() => toggle(k)}
                                            />
                                        </td>
                                    )}
                                    {columns.map((c) => (
                                        <td
                                            key={c.key}
                                            className={cn(
                                                'h-12 px-3 align-middle first:ps-4 last:pe-4',
                                                alignCls[c.align ?? 'start'],
                                                c.hideBelow && hideCls[c.hideBelow],
                                                c.className,
                                            )}
                                        >
                                            {c.cell(row)}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Phone */}
            <ul className="divide-y md:hidden" role="list">
                {rows.map((row) => {
                    const k = rowKey(row);
                    const href = rowHref?.(row);
                    const content = mobileCard(row);
                    return (
                        <li key={k} className="relative">
                            {href ? (
                                <Link href={href} className="active:bg-muted/60 block px-4 py-3 outline-none focus-visible:bg-muted">
                                    {content}
                                </Link>
                            ) : (
                                <div className="px-4 py-3">{content}</div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </>
    );
}

/* ----------------------------------------------------------------------------
 * SearchInput — debounced, with clear button.
 * ------------------------------------------------------------------------- */
interface SearchInputProps {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    debounce?: number;
    className?: string;
    autoFocus?: boolean;
}

export function SearchInput({ value, onChange, placeholder, debounce = 300, className, autoFocus }: SearchInputProps) {
    const { t } = useTranslation();
    const [local, setLocal] = useState(value);
    const first = useRef(true);

    useEffect(() => setLocal(value), [value]);
    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        if (local === value) return;
        const id = setTimeout(() => onChange(local), debounce);
        return () => clearTimeout(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [local]);

    return (
        <div className={cn('relative', className)}>
            <Search className="text-muted-foreground pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2" aria-hidden />
            <input
                type="search"
                value={local}
                autoFocus={autoFocus}
                onChange={(e) => setLocal(e.target.value)}
                placeholder={placeholder ?? t('Search')}
                aria-label={placeholder ?? t('Search')}
                className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring/40 h-9 w-full rounded-lg border ps-8 pe-8 text-sm outline-none focus-visible:ring-[3px] [&::-webkit-search-cancel-button]:hidden"
            />
            {local && (
                <button
                    type="button"
                    onClick={() => {
                        setLocal('');
                        onChange('');
                    }}
                    className="text-muted-foreground hover:text-foreground absolute end-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded"
                    aria-label={t('Clear search')}
                >
                    <X className="size-3.5" />
                </button>
            )}
        </div>
    );
}

/* ----------------------------------------------------------------------------
 * SegmentedTabs — view switcher (e.g. All / Unfulfilled / Unpaid) with counts.
 * Scrolls horizontally on phones instead of wrapping.
 * ------------------------------------------------------------------------- */
export interface Segment {
    value: string;
    label: string;
    count?: number;
}

export function SegmentedTabs({ segments, value, onChange, label }: { segments: Segment[]; value: string; onChange: (v: string) => void; label: string }) {
    return (
        <div role="tablist" aria-label={label} className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {segments.map((s) => {
                const active = s.value === value;
                return (
                    <button
                        key={s.value}
                        role="tab"
                        type="button"
                        aria-selected={active}
                        onClick={() => onChange(s.value)}
                        className={cn(
                            'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
                            active ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                    >
                        {s.label}
                        {s.count !== undefined && (
                            <span className={cn('rounded-full px-1.5 text-[11px] tabular-nums', active ? 'bg-background/20' : 'bg-muted')}>{s.count}</span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

/* ----------------------------------------------------------------------------
 * Toolbar — row that sits at the top of a list panel.
 * ------------------------------------------------------------------------- */
export function Toolbar({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={cn('flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between', className)}>{children}</div>;
}

/* ----------------------------------------------------------------------------
 * Pager — works with Laravel paginator meta.
 * ------------------------------------------------------------------------- */
export interface PageMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

export function Pager({ meta, onPage }: { meta: PageMeta; onPage: (page: number) => void }) {
    const { t, i18n } = useTranslation();
    if (!meta || meta.last_page <= 1) {
        return meta?.total ? (
            <div className="text-muted-foreground border-t px-4 py-3 text-xs">{t('{{count}} results', { count: meta.total })}</div>
        ) : null;
    }
    const nf = new Intl.NumberFormat(i18n.language?.startsWith('ar') ? 'ar-u-nu-latn' : i18n.language);
    return (
        <nav className="flex items-center justify-between gap-2 border-t px-4 py-3 text-xs" aria-label={t('Pagination')}>
            <span className="text-muted-foreground tabular-nums">
                {t('{{from}}–{{to}} of {{total}}', { from: nf.format(meta.from ?? 0), to: nf.format(meta.to ?? 0), total: nf.format(meta.total) })}
            </span>
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    disabled={meta.current_page <= 1}
                    onClick={() => onPage(meta.current_page - 1)}
                    className="hover:bg-muted inline-flex size-8 items-center justify-center rounded-md border disabled:opacity-40"
                    aria-label={t('Previous page')}
                >
                    <ChevronLeft className="size-4 rtl:rotate-180" />
                </button>
                <span className="px-2 tabular-nums">
                    {nf.format(meta.current_page)} / {nf.format(meta.last_page)}
                </span>
                <button
                    type="button"
                    disabled={meta.current_page >= meta.last_page}
                    onClick={() => onPage(meta.current_page + 1)}
                    className="hover:bg-muted inline-flex size-8 items-center justify-center rounded-md border disabled:opacity-40"
                    aria-label={t('Next page')}
                >
                    <ChevronRight className="size-4 rtl:rotate-180" />
                </button>
            </div>
        </nav>
    );
}

/** Push list filters into the URL (Inertia partial reload, state preserved). */
export function useListQuery<F extends Record<string, string | number | undefined>>(routeName: string, filters: F, only: string[]) {
    return (patch: Partial<F>) => {
        const next: Record<string, string | number> = {};
        const merged = { ...filters, ...patch } as Record<string, string | number | undefined>;
        if (!('page' in patch)) delete merged.page;
        Object.entries(merged).forEach(([k, v]) => {
            if (v !== undefined && v !== '' && v !== 'all') next[k] = v;
        });
        router.get(route(routeName), next, { preserveState: true, preserveScroll: true, replace: true, only });
    };
}
