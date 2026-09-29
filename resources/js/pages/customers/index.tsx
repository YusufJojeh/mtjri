import { router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Download, Plus, Users } from 'lucide-react';
import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { EmptyState, MetricCard, PageHeader, Panel } from '@/components/ds/layout';
import { DataTable, Pager, SearchInput, SegmentedTabs, Toolbar, useListQuery, type Column, type PageMeta } from '@/components/ds/data-table';
import { StatusBadge, ToneBadge } from '@/components/ds/status-badge';
import { ACTIVE_STATUS } from '@/lib/commerce/status';
import { useCommerceFormat } from '@/hooks/use-commerce-format';
import { usePermissions } from '@/hooks/usePermissions';
import { CustomerAvatar, customerGroupLabel } from '@/components/customers/customer-meta';

interface CustomerRow {
    id: number;
    full_name: string;
    initials: string;
    email: string | null;
    phone: string | null;
    avatar: string | null;
    is_active: boolean;
    customer_group: string | null;
    created_at: string | null;
    orders_count: number;
    lifetime_spend: number;
    last_order_at: string | null;
}

interface Filters {
    q: string;
    status: string;
    group: string;
    sort: string;
    page?: number;
    [key: string]: string | number | undefined;
}

interface CustomersProps {
    customers: CustomerRow[];
    pagination: PageMeta;
    counts: { all: number; active: number; inactive: number };
    groups: string[];
    filters?: Partial<Filters>;
    stats: { totalCustomers: number; activeCustomers: number; newThisMonth: number; customersWithOrders: number; repeatCustomers: number };
}

const selectCls =
    'border-input bg-background focus-visible:ring-ring/40 h-9 rounded-lg border px-2.5 text-sm outline-none focus-visible:ring-[3px]';

export default function Customers({ customers = [], pagination, counts, groups = [], filters, stats }: CustomersProps) {
    const { t } = useTranslation();
    const fmt = useCommerceFormat();
    const { hasPermission } = usePermissions();
    const f: Filters = { q: '', status: 'all', group: '', sort: 'newest', ...(filters || {}) };
    const update = useListQuery<Filters>('customers.index', f, ['customers', 'pagination', 'counts', 'filters']);
    const canCreate = hasPermission('create-customers');
    const showGroup = groups.length > 1 || groups.some((g) => g !== 'regular');
    const hasFilters = !!(f.q || f.group || f.status !== 'all');

    const segments = [
        { value: 'all', label: t('All'), count: counts?.all },
        { value: 'active', label: t('Active'), count: counts?.active },
        { value: 'inactive', label: t('Inactive'), count: counts?.inactive },
    ];

    const columns: Column<CustomerRow>[] = [
        {
            key: 'name',
            header: t('Customer'),
            cell: (c) => (
                <div className="flex min-w-0 items-center gap-3">
                    <CustomerAvatar initials={c.initials} avatar={c.avatar} />
                    <div className="min-w-0">
                        <div className="truncate font-medium">{c.full_name || t('Unnamed customer')}</div>
                        {c.created_at && (
                            <div className="text-muted-foreground text-xs">{t('Since {{date}}', { date: fmt.date(c.created_at, { month: 'short', year: 'numeric' }) })}</div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'contact',
            header: t('Contact'),
            className: 'max-w-[240px]',
            cell: (c) => (
                <div className="min-w-0 text-xs">
                    {c.email && (
                        <div className="truncate">
                            <bdi>{c.email}</bdi>
                        </div>
                    )}
                    {c.phone && (
                        <div className="text-muted-foreground truncate">
                            <bdi dir="ltr">{c.phone}</bdi>
                        </div>
                    )}
                </div>
            ),
        },
        ...(showGroup
            ? [
                  {
                      key: 'group',
                      header: t('Group'),
                      hideBelow: 'xl' as const,
                      cell: (c: CustomerRow) => (c.customer_group ? <ToneBadge>{customerGroupLabel(c.customer_group, t)}</ToneBadge> : null),
                  },
              ]
            : []),
        { key: 'status', header: t('Status'), hideBelow: 'lg', cell: (c) => <StatusBadge meta={c.is_active ? ACTIVE_STATUS.active : { ...ACTIVE_STATUS.inactive, label: 'Inactive' }} /> },
        { key: 'orders', header: t('Orders'), align: 'end', cell: (c) => <span className="tabular-nums">{fmt.number(c.orders_count)}</span> },
        {
            key: 'last',
            header: t('Last order'),
            hideBelow: 'lg',
            cell: (c) =>
                c.last_order_at ? (
                    <time dateTime={c.last_order_at} title={fmt.dateTime(c.last_order_at)} className="text-muted-foreground whitespace-nowrap">
                        {fmt.relative(c.last_order_at)}
                    </time>
                ) : (
                    <span className="text-muted-foreground">—</span>
                ),
        },
        {
            key: 'spend',
            header: t('Total spent'),
            align: 'end',
            cell: (c) => <span className="font-medium whitespace-nowrap tabular-nums">{fmt.money(c.lifetime_spend)}</span>,
        },
    ];

    const mobileCard = (c: CustomerRow) => (
        <div className="flex items-center gap-3">
            <CustomerAvatar initials={c.initials} avatar={c.avatar} />
            <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-semibold">{c.full_name || t('Unnamed customer')}</span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums">{fmt.money(c.lifetime_spend)}</span>
                </div>
                <div className="text-muted-foreground flex items-baseline justify-between gap-3 text-xs">
                    <span className="min-w-0 truncate">
                        <bdi>{c.email || c.phone}</bdi>
                    </span>
                    <span className="shrink-0">{t('{{count}} orders', { count: c.orders_count })}</span>
                </div>
                {!c.is_active && (
                    <div className="pt-1">
                        <StatusBadge meta={{ ...ACTIVE_STATUS.inactive, label: 'Inactive' }} />
                    </div>
                )}
            </div>
        </div>
    );

    const empty = hasFilters ? (
        <EmptyState
            icon={<Users />}
            title={t('No customers match these filters')}
            description={t('Try a different search or filter.')}
            action={
                <Button variant="outline" size="sm" onClick={() => update({ q: '', group: '', status: 'all' })}>
                    {t('Clear filters')}
                </Button>
            }
        />
    ) : (
        <EmptyState
            icon={<Users />}
            title={t('No customers yet')}
            description={t('Customers appear here when they sign up or place an order. You can also add one manually.')}
            action={
                canCreate ? (
                    <Button size="sm" onClick={() => router.visit(route('customers.create'))}>
                        <Plus aria-hidden />
                        {t('Add customer')}
                    </Button>
                ) : undefined
            }
        />
    );

    return (
        <PageTemplate
            title={t('Customers')}
            url="/customers"
            breadcrumbs={[{ title: t('Dashboard'), href: route('dashboard') }, { title: t('Customers') }]}
            header={
                <PageHeader
                    title={t('Customers')}
                    description={t('Everyone who has an account or ordered from your store.')}
                    actions={
                        <>
                            {hasPermission('export-customers') && (
                                <Button variant="outline" size="sm" className="h-9" onClick={() => window.open(route('customers.export'), '_blank')}>
                                    <Download aria-hidden />
                                    {t('Export')}
                                </Button>
                            )}
                            {canCreate && (
                                <Button size="sm" className="h-9" onClick={() => router.visit(route('customers.create'))}>
                                    <Plus aria-hidden />
                                    {t('Add customer')}
                                </Button>
                            )}
                        </>
                    }
                />
            }
        >
            <div className="space-y-4">
                {(stats?.totalCustomers ?? 0) > 0 && (
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <MetricCard label={t('Customers')} value={fmt.number(stats.totalCustomers)} hint={t('{{count}} active', { count: stats.activeCustomers })} />
                        <MetricCard label={t('New this month')} value={fmt.number(stats.newThisMonth)} />
                        <MetricCard label={t('Have ordered')} value={fmt.number(stats.customersWithOrders)} hint={t('At least one order')} />
                        <MetricCard label={t('Repeat customers')} value={fmt.number(stats.repeatCustomers)} hint={t('Two or more orders')} />
                    </div>
                )}

                <Panel flush className="overflow-hidden">
                    <div className="border-b px-4 pb-3">
                        <SegmentedTabs segments={segments} value={f.status || 'all'} onChange={(v) => update({ status: v })} label={t('Customer status')} />
                    </div>
                    <Toolbar>
                        <SearchInput value={f.q} onChange={(v) => update({ q: v })} placeholder={t('Search name, email or phone')} className="w-full sm:max-w-xs" />
                        <div className="flex items-center gap-2">
                            {showGroup && (
                                <>
                                    <label className="sr-only" htmlFor="customer-group-filter">
                                        {t('Group')}
                                    </label>
                                    <select id="customer-group-filter" className={selectCls + ' flex-1 sm:flex-none'} value={f.group} onChange={(e) => update({ group: e.target.value })}>
                                        <option value="">{t('All groups')}</option>
                                        {groups.map((g) => (
                                            <option key={g} value={g}>
                                                {customerGroupLabel(g, t)}
                                            </option>
                                        ))}
                                    </select>
                                </>
                            )}
                            <label className="sr-only" htmlFor="customer-sort">
                                {t('Sort')}
                            </label>
                            <select id="customer-sort" className={selectCls + ' flex-1 sm:flex-none'} value={f.sort} onChange={(e) => update({ sort: e.target.value })}>
                                <option value="newest">{t('Newest first')}</option>
                                <option value="oldest">{t('Oldest first')}</option>
                                <option value="name">{t('Name A–Z')}</option>
                                <option value="spend">{t('Highest spend')}</option>
                                <option value="orders">{t('Most orders')}</option>
                                <option value="last_order">{t('Recent order')}</option>
                            </select>
                        </div>
                    </Toolbar>
                    <DataTable
                        rows={customers}
                        columns={columns}
                        rowKey={(c) => c.id}
                        rowHref={(c) => route('customers.show', c.id)}
                        mobileCard={mobileCard}
                        caption={t('Customers')}
                        empty={empty}
                    />
                    {customers.length > 0 && pagination && <Pager meta={pagination} onPage={(p) => update({ page: p })} />}
                </Panel>
                <p className="text-muted-foreground px-1 text-xs">{t('Total spent counts paid orders only.')}</p>
            </div>
        </PageTemplate>
    );
}
