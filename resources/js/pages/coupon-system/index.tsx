import { useState } from 'react';
import axios from 'axios';
import { Link, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Download, Eye, MoreHorizontal, Pencil, Plus, TicketPercent, Trash2 } from 'lucide-react';
import { PageTemplate } from '@/components/page-template';
import { PageHeader, EmptyState } from '@/components/ds/layout';
import { DataTable, Pager, SearchInput, SegmentedTabs, Toolbar, useListQuery, type Column, type PageMeta } from '@/components/ds/data-table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/components/custom-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { useCommerceFormat } from '@/hooks/use-commerce-format';
import { DiscountCode, DiscountStateBadge, UsageMeter } from '@/components/discounts/discount-bits';
import { deriveState, daysUntil, localDate, missingDates, num, valueLabel, type Discount, type DiscountState } from '@/components/discounts/discount-utils';

type View = 'all' | DiscountState;

interface Filters {
    search?: string;
    view?: View;
    per_page?: string | number;
    page?: number;
    [k: string]: string | number | undefined;
}

interface Props {
    coupons: { data: Discount[] } & PageMeta;
    filters: Filters;
    viewCounts?: Partial<Record<View, number>>;
}

export default function DiscountsIndex() {
    const { t } = useTranslation();
    const f = useCommerceFormat();
    const { hasPermission } = usePermissions();
    const { coupons, filters = {}, viewCounts = {} } = usePage().props as unknown as Props;
    const rows = coupons?.data ?? [];
    const view: View = (filters.view as View) || 'all';
    const [pending, setPending] = useState<number | null>(null);
    const [toDelete, setToDelete] = useState<Discount | null>(null);
    const [deleting, setDeleting] = useState(false);

    const canCreate = hasPermission('create-coupon-system');
    const canEdit = hasPermission('edit-coupon-system');
    const canToggle = hasPermission('toggle-status-coupon-system');
    const canDelete = hasPermission('delete-coupon-system');
    const canExport = hasPermission('export-coupon-system');

    const query = useListQuery<Filters>('coupon-system.index', { search: filters.search, view: filters.view, per_page: filters.per_page }, [
        'coupons',
        'filters',
        'viewCounts',
        'stats',
    ]);

    const stateOf = (c: Discount): DiscountState => c.state ?? deriveState(c);
    const daysLeftOf = (c: Discount) => (c.days_left !== undefined ? c.days_left : daysUntil(c.expiry_date));
    const usedOf = (c: Discount) => Math.max(c.performance?.orders ?? 0, c.used_count ?? 0);

    const toggle = async (c: Discount) => {
        setPending(c.id);
        try {
            const res = await axios.post(route('store-coupons.toggle-status', c.id), {}, { headers: { Accept: 'application/json' } });
            const on = Boolean(res.data?.status);
            toast.success(on ? t('{{name}} is now active', { name: c.name }) : t('{{name}} is paused', { name: c.name }));
            router.reload({ only: ['coupons', 'viewCounts', 'stats'], onFinish: () => setPending(null) });
        } catch {
            toast.error(t('Could not change the status. Please try again.'));
            setPending(null);
        }
    };

    const confirmDelete = () => {
        if (!toDelete) return;
        setDeleting(true);
        router.delete(route('store-coupons.destroy', toDelete.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setToDelete(null);
            },
        });
    };

    const schedule = (c: Discount) => {
        const from = c.start_date ? f.date(localDate(c.start_date)) : null;
        const to = c.expiry_date ? f.date(localDate(c.expiry_date)) : null;
        if (from && to) return t('{{from}} – {{to}}', { from, to });
        if (from) return t('From {{date}}', { date: from });
        if (to) return t('Until {{date}}', { date: to });
        return t('No end date');
    };

    const conditions = (c: Discount) => {
        const parts: string[] = [];
        const min = num(c.minimum_spend);
        const cap = num(c.maximum_spend);
        if (min && min > 0) parts.push(t('Min. order {{amount}}', { amount: f.money(min) }));
        if (cap && cap > 0) parts.push(t('Max. discount {{amount}}', { amount: f.money(cap) }));
        return parts.length ? parts.join(' · ') : t('No minimum');
    };

    const datesWarning = (c: Discount) =>
        c.status && missingDates(c) ? (
            <span className="text-warning-fg inline-flex items-center gap-1 text-xs">
                <AlertTriangle className="size-3" aria-hidden />
                {t('Needs start and end dates to work at checkout')}
            </span>
        ) : null;

    const perf = (c: Discount) => {
        const p = c.performance;
        if (!p || p.orders === 0) return <span className="text-muted-foreground text-sm">{t('Not used yet')}</span>;
        return (
            <div className="text-sm leading-5">
                <div className="tabular-nums">
                    {t('{{count}} orders', { count: p.orders })} · <span className="font-medium">{f.money(p.revenue)}</span>
                </div>
                <div className="text-muted-foreground text-xs tabular-nums">{t('{{amount}} given', { amount: f.money(p.discount) })}</div>
            </div>
        );
    };

    const rowActions = (c: Discount) => (
        <div className="flex items-center justify-end gap-1" data-no-row-click>
            {canToggle && (
                <Switch
                    checked={Boolean(c.status)}
                    disabled={pending === c.id}
                    onCheckedChange={() => toggle(c)}
                    aria-label={c.status ? t('Pause {{name}}', { name: c.name }) : t('Activate {{name}}', { name: c.name })}
                    className={pending === c.id ? 'animate-pulse' : undefined}
                />
            )}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8" aria-label={t('Actions for {{name}}', { name: c.name })}>
                        <MoreHorizontal className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                        <Link href={route('coupon-system.show', c.id)}>
                            <Eye className="size-4" /> {t('View details')}
                        </Link>
                    </DropdownMenuItem>
                    {canEdit && (
                        <DropdownMenuItem asChild>
                            <Link href={route('coupon-system.edit', c.id)}>
                                <Pencil className="size-4" /> {t('Edit')}
                            </Link>
                        </DropdownMenuItem>
                    )}
                    {canDelete && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onSelect={() => setToDelete(c)}>
                                <Trash2 className="size-4" /> {t('Delete')}
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );

    const columns: Column<Discount>[] = [
        {
            key: 'discount',
            header: t('Discount'),
            cell: (c) => (
                <div className="min-w-0 space-y-1 py-2">
                    <div className="truncate font-medium">{c.name}</div>
                    <DiscountCode code={c.code} />
                </div>
            ),
        },
        {
            key: 'value',
            header: t('Customer gets'),
            cell: (c) => (
                <div className="leading-5">
                    <div className="font-medium">{valueLabel(c, f, t)}</div>
                    <div className="text-muted-foreground text-xs">{conditions(c)}</div>
                </div>
            ),
        },
        {
            key: 'usage',
            header: t('Usage'),
            cell: (c) => <UsageMeter used={usedOf(c)} limit={c.use_limit_per_coupon} compact />,
        },
        { key: 'performance', header: t('Performance'), hideBelow: 'lg', cell: perf },
        {
            key: 'schedule',
            header: t('Schedule'),
            hideBelow: 'xl',
            cell: (c) => (
                <div className="space-y-0.5">
                    <div className="text-sm whitespace-nowrap">{schedule(c)}</div>
                    {datesWarning(c)}
                </div>
            ),
        },
        { key: 'state', header: t('Status'), cell: (c) => <DiscountStateBadge state={stateOf(c)} daysLeft={daysLeftOf(c)} /> },
        { key: 'actions', header: <span className="sr-only">{t('Actions')}</span>, align: 'end', cell: rowActions },
    ];

    const mobileCard = (c: Discount) => (
        <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="truncate font-medium">{c.name}</div>
                    <div className="text-sm">
                        {valueLabel(c, f, t)} <span className="text-muted-foreground text-xs">· {conditions(c)}</span>
                    </div>
                </div>
                <DiscountStateBadge state={stateOf(c)} daysLeft={daysLeftOf(c)} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <code dir="ltr" className="bg-muted/60 rounded-md border px-2 py-0.5 font-mono text-xs font-medium">
                    {c.code}
                </code>
                <span className="text-muted-foreground text-xs">{schedule(c)}</span>
            </div>
            <div className="grid grid-cols-2 items-end gap-3">
                <UsageMeter used={usedOf(c)} limit={c.use_limit_per_coupon} />
                <div className="text-end text-xs">
                    {c.performance && c.performance.orders > 0 ? (
                        <>
                            <div className="font-medium tabular-nums">{f.money(c.performance.revenue)}</div>
                            <div className="text-muted-foreground">{t('{{count}} orders', { count: c.performance.orders })}</div>
                        </>
                    ) : (
                        <span className="text-muted-foreground">{t('Not used yet')}</span>
                    )}
                </div>
            </div>
            {datesWarning(c)}
        </div>
    );

    const segments = [
        { value: 'all', label: t('All'), count: viewCounts.all },
        { value: 'active', label: t('Active'), count: viewCounts.active },
        { value: 'scheduled', label: t('Scheduled'), count: viewCounts.scheduled },
        { value: 'expired', label: t('Expired'), count: viewCounts.expired },
        { value: 'paused', label: t('Paused'), count: viewCounts.paused },
    ];

    const filtered = Boolean(filters.search) || view !== 'all';
    const totalAll = viewCounts.all ?? 0;

    const header = (
        <PageHeader
            title={t('Discounts')}
            description={t('Codes customers enter at checkout. Pause a code any time without losing its history.')}
            actions={
                <>
                    {canExport && (
                        <Button variant="outline" size="sm" className="h-9" onClick={() => window.open(route('coupon-system.export'), '_blank')}>
                            <Download className="size-4" />
                            {t('Export')}
                        </Button>
                    )}
                    {canCreate && (
                        <Button size="sm" className="h-9" asChild>
                            <Link href={route('coupon-system.create')}>
                                <Plus className="size-4" />
                                {t('Create discount')}
                            </Link>
                        </Button>
                    )}
                </>
            }
        />
    );

    return (
        <PageTemplate
            title={t('Discounts')}
            url="/coupon-system"
            header={header}
            breadcrumbs={[{ title: t('Dashboard'), href: route('dashboard') }, { title: t('Discounts') }]}
        >
            {totalAll === 0 && !filters.search ? (
                <section className="bg-card rounded-xl border shadow-card">
                    <EmptyState
                        icon={<TicketPercent />}
                        title={t('No discounts yet')}
                        description={t('Create a code like WELCOME10 to reward first orders or run a limited-time sale.')}
                        action={
                            canCreate ? (
                                <Button asChild>
                                    <Link href={route('coupon-system.create')}>
                                        <Plus className="size-4" />
                                        {t('Create discount')}
                                    </Link>
                                </Button>
                            ) : undefined
                        }
                    />
                </section>
            ) : (
                <section className="bg-card overflow-hidden rounded-xl border shadow-card" aria-label={t('Discounts')}>
                    <Toolbar>
                        <SegmentedTabs label={t('Filter discounts')} segments={segments} value={view} onChange={(v) => query({ view: v as View })} />
                        <SearchInput
                            className="sm:w-64"
                            value={filters.search ?? ''}
                            onChange={(v) => query({ search: v })}
                            placeholder={t('Search name or code')}
                        />
                    </Toolbar>
                    <DataTable
                        rows={rows}
                        columns={columns}
                        rowKey={(c) => c.id}
                        rowHref={(c) => route('coupon-system.show', c.id)}
                        mobileCard={mobileCard}
                        caption={t('Discounts')}
                        empty={
                            <EmptyState
                                compact
                                icon={<TicketPercent />}
                                title={filtered ? t('No discounts match') : t('No discounts yet')}
                                description={filtered ? t('Try another view or search term.') : undefined}
                                action={
                                    filtered ? (
                                        <Button variant="outline" size="sm" onClick={() => query({ search: '', view: 'all' })}>
                                            {t('Clear filters')}
                                        </Button>
                                    ) : canCreate ? (
                                        <Button size="sm" asChild>
                                            <Link href={route('coupon-system.create')}>{t('Create discount')}</Link>
                                        </Button>
                                    ) : undefined
                                }
                            />
                        }
                    />
                    <Pager meta={coupons} onPage={(page) => query({ page })} />
                </section>
            )}

            <Dialog open={!!toDelete} onOpenChange={(open) => !open && !deleting && setToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Delete this discount?')}</DialogTitle>
                        <DialogDescription>
                            {t('Customers will no longer be able to use {{code}}. Past orders keep their discount. This cannot be undone.', {
                                code: toDelete?.code ?? '',
                            })}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setToDelete(null)} disabled={deleting}>
                            {t('Cancel')}
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
                            {deleting ? t('Deleting…') : t('Delete discount')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageTemplate>
    );
}
