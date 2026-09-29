import { useMemo } from 'react';
import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Download, ShoppingCart } from 'lucide-react';
import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { EmptyState, MetricCard, PageHeader, Panel } from '@/components/ds/layout';
import { DataTable, Pager, SearchInput, SegmentedTabs, Toolbar, useListQuery, type Column, type PageMeta } from '@/components/ds/data-table';
import { StatusBadge, ToneBadge } from '@/components/ds/status-badge';
import { orderStatusMeta, paymentStatusMeta } from '@/lib/commerce/status';
import { useCommerceFormat } from '@/hooks/use-commerce-format';
import { usePermissions } from '@/hooks/usePermissions';
import { orderIssue, paymentMethodLabel } from '@/components/orders/order-meta';

interface OrderRow {
    id: number;
    orderNumber: string;
    customer: string;
    email: string | null;
    total: number;
    status: string;
    paymentStatus: string;
    items: number;
    createdAt: string | null;
    paymentMethod: string | null;
}

interface Filters {
    q: string;
    status: string;
    payment: string;
    view: string;
    sort: string;
    page?: number;
    [key: string]: string | number | undefined;
}

interface OrdersProps {
    orders: OrderRow[];
    pagination: PageMeta;
    counts: Record<'all' | 'open' | 'unpaid' | 'to_ship' | 'shipped' | 'cancelled', number>;
    filters?: Partial<Filters>;
    stats: {
        totalOrders: number;
        pendingOrders: number;
        totalRevenue: number;
        avgOrderValue: number;
    };
}

const selectCls =
    'border-input bg-background focus-visible:ring-ring/40 h-9 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-[3px]';

export default function Orders({ orders = [], pagination, counts, filters, stats }: OrdersProps) {
    const { t } = useTranslation();
    const fmt = useCommerceFormat();
    const { hasPermission } = usePermissions();
    const f: Filters = { q: '', status: '', payment: '', view: 'all', sort: 'newest', ...(filters || {}) };
    const update = useListQuery<Filters>('orders.index', f, ['orders', 'pagination', 'counts', 'filters']);
    const now = useMemo(() => Date.now(), [orders]); // eslint-disable-line react-hooks/exhaustive-deps

    const segments = [
        { value: 'all', label: t('All'), count: counts?.all },
        { value: 'open', label: t('Open'), count: counts?.open },
        { value: 'unpaid', label: t('Unpaid'), count: counts?.unpaid },
        { value: 'to_ship', label: t('To ship'), count: counts?.to_ship },
        { value: 'shipped', label: t('Shipped'), count: counts?.shipped },
        { value: 'cancelled', label: t('Cancelled'), count: counts?.cancelled },
    ];

    const hasFilters = !!(f.q || f.status || f.payment || (f.view && f.view !== 'all'));
    const storeHasOrders = (stats?.totalOrders ?? 0) > 0;

    const dateCell = (iso: string | null) =>
        iso ? (
            <time dateTime={iso} title={fmt.dateTime(iso)} className="text-muted-foreground whitespace-nowrap">
                {fmt.relative(iso)}
            </time>
        ) : (
            <span className="text-muted-foreground">—</span>
        );

    const columns: Column<OrderRow>[] = [
        {
            key: 'number',
            header: t('Order'),
            cell: (o) => (
                <span dir="ltr" className="font-medium whitespace-nowrap tabular-nums">
                    {o.orderNumber}
                </span>
            ),
        },
        { key: 'date', header: t('Date'), cell: (o) => dateCell(o.createdAt) },
        {
            key: 'customer',
            header: t('Customer'),
            className: 'max-w-[220px]',
            cell: (o) => (
                <div className="min-w-0">
                    <div className="truncate font-medium">{o.customer || t('Guest')}</div>
                    {o.email && (
                        <div className="text-muted-foreground truncate text-xs">
                            <bdi>{o.email}</bdi>
                        </div>
                    )}
                </div>
            ),
        },
        { key: 'payment', header: t('Payment'), cell: (o) => <StatusBadge meta={paymentStatusMeta(o.paymentStatus)} /> },
        { key: 'status', header: t('Fulfillment'), cell: (o) => <StatusBadge meta={orderStatusMeta(o.status)} /> },
        {
            key: 'items',
            header: t('Items'),
            align: 'end',
            hideBelow: 'lg',
            cell: (o) => <span className="tabular-nums">{fmt.number(o.items)}</span>,
        },
        {
            key: 'method',
            header: t('Method'),
            hideBelow: 'xl',
            cell: (o) => <span className="text-muted-foreground whitespace-nowrap">{paymentMethodLabel(o.paymentMethod, t) || '—'}</span>,
        },
        {
            key: 'issue',
            header: <span className="sr-only">{t('Attention')}</span>,
            cell: (o) => {
                const issue = orderIssue(o, t, now);
                return issue ? <ToneBadge tone={issue.tone} icon={<AlertTriangle aria-hidden />}>{issue.label}</ToneBadge> : null;
            },
        },
        {
            key: 'total',
            header: t('Total'),
            align: 'end',
            cell: (o) => <span className="font-medium whitespace-nowrap tabular-nums">{fmt.money(o.total)}</span>,
        },
    ];

    const mobileCard = (o: OrderRow) => {
        const issue = orderIssue(o, t, now);
        return (
            <div className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-3">
                    <span dir="ltr" className="truncate text-sm font-semibold tabular-nums">
                        {o.orderNumber}
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">{fmt.money(o.total)}</span>
                </div>
                <div className="text-muted-foreground flex items-baseline justify-between gap-3 text-xs">
                    <span className="truncate">{o.customer || t('Guest')}</span>
                    {o.createdAt && (
                        <time dateTime={o.createdAt} className="shrink-0">
                            {fmt.relative(o.createdAt)}
                        </time>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <StatusBadge meta={paymentStatusMeta(o.paymentStatus)} />
                    <StatusBadge meta={orderStatusMeta(o.status)} />
                    {issue && (
                        <ToneBadge tone={issue.tone} icon={<AlertTriangle aria-hidden />}>
                            {issue.label}
                        </ToneBadge>
                    )}
                </div>
            </div>
        );
    };

    const empty = hasFilters ? (
        <EmptyState
            icon={<ShoppingCart />}
            title={t('No orders match these filters')}
            description={t('Try a different search or view.')}
            action={
                <Button variant="outline" size="sm" onClick={() => update({ q: '', status: '', payment: '', view: 'all' })}>
                    {t('Clear filters')}
                </Button>
            }
        />
    ) : (
        <EmptyState
            icon={<ShoppingCart />}
            title={t('No orders yet')}
            description={t('Orders placed in your storefront will appear here.')}
            action={
                hasPermission('view-products') ? (
                    <Button variant="outline" size="sm" onClick={() => router.visit(route('products.index'))}>
                        {t('Review your products')}
                    </Button>
                ) : undefined
            }
        />
    );

    return (
        <PageTemplate
            title={t('Orders')}
            url="/orders"
            breadcrumbs={[{ title: t('Dashboard'), href: route('dashboard') }, { title: t('Orders') }]}
            header={
                <PageHeader
                    title={t('Orders')}
                    description={t('Track payment and fulfillment for every order.')}
                    actions={
                        hasPermission('export-orders') ? (
                            <Button variant="outline" size="sm" className="h-9" onClick={() => window.open(route('orders.export'), '_blank')}>
                                <Download aria-hidden />
                                {t('Export')}
                            </Button>
                        ) : undefined
                    }
                />
            }
        >
            <div className="space-y-4">
                {storeHasOrders && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <MetricCard label={t('Total orders')} value={fmt.number(stats.totalOrders)} />
                        <MetricCard
                            label={t('Pending orders')}
                            value={fmt.number(stats.pendingOrders)}
                            emphasis={stats.pendingOrders > 0 ? 'warning' : 'default'}
                            hint={t('Awaiting processing')}
                        />
                        <div className="col-span-2 sm:col-span-1">
                            <MetricCard label={t('Paid revenue')} value={fmt.money(stats.totalRevenue)} hint={t('All time, paid orders')} />
                        </div>
                    </div>
                )}

                <Panel flush className="overflow-hidden">
                    <div className="border-b px-4 pb-3">
                        <SegmentedTabs segments={segments} value={f.view || 'all'} onChange={(v) => update({ view: v })} label={t('Order views')} />
                    </div>
                    <Toolbar>
                        <SearchInput
                            value={f.q}
                            onChange={(v) => update({ q: v })}
                            placeholder={t('Search order #, customer or email')}
                            className="w-full sm:max-w-xs"
                        />
                        <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
                            <label className="sr-only" htmlFor="order-status-filter">
                                {t('Fulfillment')}
                            </label>
                            <select id="order-status-filter" className={selectCls} value={f.status} onChange={(e) => update({ status: e.target.value })}>
                                <option value="">{t('All statuses')}</option>
                                <option value="pending">{t('Pending')}</option>
                                <option value="processing">{t('Processing')}</option>
                                <option value="shipped">{t('Shipped')}</option>
                                <option value="delivered">{t('Delivered')}</option>
                                <option value="cancelled">{t('Cancelled')}</option>
                            </select>
                            <label className="sr-only" htmlFor="order-payment-filter">
                                {t('Payment')}
                            </label>
                            <select id="order-payment-filter" className={selectCls} value={f.payment} onChange={(e) => update({ payment: e.target.value })}>
                                <option value="">{t('All payments')}</option>
                                <option value="pending">{t('Unpaid')}</option>
                                <option value="paid">{t('Paid')}</option>
                                <option value="failed">{t('Payment failed')}</option>
                                <option value="refunded">{t('Refunded')}</option>
                            </select>
                            <label className="sr-only" htmlFor="order-sort">
                                {t('Sort')}
                            </label>
                            <select id="order-sort" className={selectCls} value={f.sort} onChange={(e) => update({ sort: e.target.value })}>
                                <option value="newest">{t('Newest first')}</option>
                                <option value="oldest">{t('Oldest first')}</option>
                                <option value="total">{t('Highest total')}</option>
                            </select>
                        </div>
                    </Toolbar>
                    <DataTable
                        rows={orders}
                        columns={columns}
                        rowKey={(o) => o.id}
                        rowHref={(o) => route('orders.show', o.id)}
                        mobileCard={mobileCard}
                        caption={t('Orders')}
                        empty={empty}
                    />
                    {orders.length > 0 && pagination && <Pager meta={pagination} onPage={(p) => update({ page: p })} />}
                </Panel>
            </div>
        </PageTemplate>
    );
}
