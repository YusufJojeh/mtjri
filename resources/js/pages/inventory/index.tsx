import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Clock, Info, Package, PackageCheck, Plus, SearchX, ShoppingCart, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageTemplate } from '@/components/page-template';
import { EmptyState, MetricCard, PageHeader, Panel } from '@/components/ds/layout';
import { DataTable, SearchInput, SegmentedTabs, type Column } from '@/components/ds/data-table';
import { StatusBadge } from '@/components/ds/status-badge';
import { STOCK_STATUS, type StockState } from '@/lib/commerce/status';
import { useCommerceFormat } from '@/hooks/use-commerce-format';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ProductThumb, StockMeter } from '@/components/products/product-bits';

interface Item {
    id: number;
    name: string;
    sku: string | null;
    image: string | null;
    category: string | null;
    active: boolean;
    digital: boolean;
    variantOptions: string[];
    stock: number;
    onOpenOrders: number;
    sold30: number;
    daysOfCover: number | null;
    state: StockState;
    price: number;
    stockValue: number;
    updatedAt: string | null;
}

type View = 'all' | 'low' | 'out' | 'healthy';
type Sort = 'cover_asc' | 'stock_asc' | 'stock_desc' | 'name';

interface PageProps {
    items: Item[];
    counts: { all: number; low: number; out: number; healthy: number };
    summary: { units: number; value: number; onOpenOrders: number; atRisk: number };
    threshold: number;
    filters: { view: View; q: string; sort: Sort };
}


const RISK_DAYS = 14;

export default function Inventory() {
    const { t } = useTranslation();
    const fmt = useCommerceFormat();
    const { hasPermission } = usePermissions();
    const { items = [], counts, summary, threshold, filters } = usePage().props as unknown as PageProps;
    const [loading, setLoading] = useState(false);
    const SORTS: Array<{ value: Sort; label: string }> = [
        { value: 'cover_asc', label: t('Most urgent') },
        { value: 'stock_asc', label: t('Lowest stock') },
        { value: 'stock_desc', label: t('Highest stock') },
        { value: 'name', label: t('Name A–Z') },
    ];
    const canEdit = hasPermission('edit-products');

    const apply = (patch: Partial<PageProps['filters']>) => {
        const merged = { ...filters, ...patch };
        const params: Record<string, string> = {};
        if (merged.view && merged.view !== 'all') params.view = merged.view;
        if (merged.q) params.q = merged.q;
        if (merged.sort && merged.sort !== 'cover_asc') params.sort = merged.sort;
        router.get(route('inventory.index'), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['items', 'filters'],
            onStart: () => setLoading(true),
            onFinish: () => setLoading(false),
        });
    };

    const rowHref = (i: Item) => (canEdit ? route('products.edit', i.id) : route('products.show', i.id));

    const cover = (i: Item) => {
        if (i.stock <= 0) return <span className="text-danger-fg font-medium">{t('Out now')}</span>;
        if (i.daysOfCover === null) return <span className="text-muted-foreground">{t('No recent sales')}</span>;
        const risky = i.daysOfCover <= RISK_DAYS;
        return (
            <span className={cn('inline-flex items-center gap-1 tabular-nums', risky ? 'text-warning-fg font-medium' : 'text-foreground')}>
                {risky && <Clock className="size-3.5" aria-hidden />}
                {t('{{n}} days', { n: fmt.number(i.daysOfCover) })}
            </span>
        );
    };

    const productCell = (i: Item, compact = false) => (
        <div className="flex min-w-0 items-center gap-3">
            <ProductThumb src={i.image} alt="" size={compact ? 'lg' : 'md'} />
            <div className="min-w-0">
                <p dir="auto" className={cn('truncate text-start font-medium', !compact && 'max-w-[30ch]')}>{i.name}</p>
                <p className="text-muted-foreground truncate text-xs">
                    {i.sku ? <bdi dir="ltr">{i.sku}</bdi> : t('No SKU')}
                    {i.category && <> · {i.category}</>}
                    {!i.active && <> · {t('Draft')}</>}
                    {i.digital && <> · {t('Digital')}</>}
                </p>
                {i.variantOptions.length > 0 && (
                    <p className="text-muted-foreground truncate text-xs" title={t('Options (shared stock)')}>
                        {t('Options')}: {i.variantOptions.join(', ')}
                    </p>
                )}
            </div>
        </div>
    );

    const columns: Column<Item>[] = [
        { key: 'product', header: t('Product'), cell: (i) => productCell(i) },
        {
            key: 'stock',
            header: t('Available'),
            cell: (i) => (
                <div className="w-36 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold tabular-nums">{fmt.number(i.stock)}</span>
                        <StatusBadge meta={STOCK_STATUS[i.state]} />
                    </div>
                    <StockMeter stock={i.stock} threshold={threshold} state={i.state} />
                </div>
            ),
        },
        {
            key: 'open',
            header: t('On open orders'),
            align: 'end',
            cell: (i) => <span className={cn('tabular-nums', i.onOpenOrders > i.stock && 'text-danger-fg font-medium')}>{fmt.number(i.onOpenOrders)}</span>,
        },
        { key: 'sold', header: t('Sold · 30 days'), align: 'end', hideBelow: 'lg', cell: (i) => <span className="tabular-nums">{fmt.number(i.sold30)}</span> },
        { key: 'cover', header: t('Days of cover'), align: 'end', cell: (i) => cover(i) },
    ];

    const mobileCard = (i: Item) => (
        <div className="space-y-2.5">
            <div className="flex items-start justify-between gap-2">
                {productCell(i, true)}
                <StatusBadge meta={STOCK_STATUS[i.state]} />
            </div>
            <StockMeter stock={i.stock} threshold={threshold} state={i.state} />
            <dl className="grid grid-cols-4 gap-2 text-xs">
                <div>
                    <dt className="text-muted-foreground">{t('Available')}</dt>
                    <dd className="font-semibold tabular-nums">{fmt.number(i.stock)}</dd>
                </div>
                <div>
                    <dt className="text-muted-foreground">{t('Open orders')}</dt>
                    <dd className="tabular-nums">{fmt.number(i.onOpenOrders)}</dd>
                </div>
                <div>
                    <dt className="text-muted-foreground">{t('Sold · 30d')}</dt>
                    <dd className="tabular-nums">{fmt.number(i.sold30)}</dd>
                </div>
                <div>
                    <dt className="text-muted-foreground">{t('Cover')}</dt>
                    <dd>{cover(i)}</dd>
                </div>
            </dl>
        </div>
    );

    const segments = [
        { value: 'all', label: t('All'), count: counts.all },
        { value: 'low', label: t('Low stock'), count: counts.low },
        { value: 'out', label: t('Out of stock'), count: counts.out },
        { value: 'healthy', label: t('Healthy'), count: counts.healthy },
    ];

    const empty = (() => {
        if (counts.all === 0) {
            return (
                <EmptyState
                    icon={<Package />}
                    title={t('No products to track yet')}
                    description={t('Stock levels appear here as soon as you add products.')}
                    action={
                        hasPermission('create-products') && (
                            <Button asChild>
                                <Link href={route('products.create')}>
                                    <Plus /> {t('Add product')}
                                </Link>
                            </Button>
                        )
                    }
                />
            );
        }
        if (filters.q) {
            return (
                <EmptyState
                    icon={<SearchX />}
                    title={t('No products match “{{q}}”', { q: filters.q })}
                    description={t('Search looks at product names and SKUs.')}
                    action={
                        <Button variant="outline" onClick={() => apply({ q: '' })}>
                            {t('Clear search')}
                        </Button>
                    }
                />
            );
        }
        if (filters.view === 'out') {
            return <EmptyState icon={<CheckCircle2 className="text-success-fg" />} title={t('Nothing is out of stock')} description={t('Every product has units available to sell.')} />;
        }
        if (filters.view === 'low') {
            return (
                <EmptyState
                    icon={<PackageCheck className="text-success-fg" />}
                    title={t('No products are running low')}
                    description={t('Products appear here when stock drops to {{n}} units or fewer.', { n: fmt.number(threshold) })}
                />
            );
        }
        return (
            <EmptyState
                icon={<AlertTriangle />}
                title={t('No products above the low-stock threshold')}
                description={t('Restock low and out-of-stock products to move them here.')}
                action={
                    <Button variant="outline" onClick={() => apply({ view: 'low' })}>
                        {t('Review low stock')}
                    </Button>
                }
            />
        );
    })();

    return (
        <PageTemplate
            title={t('Inventory')}
            url="/inventory"
            breadcrumbs={[{ title: t('Dashboard'), href: route('dashboard') }, { title: t('Products'), href: route('products.index') }, { title: t('Inventory') }]}
            header={
                <PageHeader
                    title={t('Inventory')}
                    description={t('Stock on hand, what is committed to open orders and how long it will last at the current pace.')}
                    actions={
                        <Button variant="outline" size="sm" asChild className="h-9 sm:h-8">
                            <Link href={route('products.index')}>{t('All products')}</Link>
                        </Button>
                    }
                />
            }
        >
            <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <MetricCard label={t('Units on hand')} value={fmt.number(summary.units)} icon={<Package />} hint={t('Across {{n}} products', { n: fmt.number(counts.all) })} />
                    <MetricCard label={t('Stock value')} value={fmt.money(summary.value, { whole: true })} icon={<Wallet />} hint={t('At retail price')} />
                    <MetricCard label={t('On open orders')} value={fmt.number(summary.onOpenOrders)} icon={<ShoppingCart />} hint={t('Pending and processing')} />
                    <MetricCard
                        label={t('At risk')}
                        value={fmt.number(summary.atRisk)}
                        icon={<Clock />}
                        emphasis={summary.atRisk > 0 ? 'warning' : 'default'}
                        hint={t('≤ {{n}} days of cover', { n: fmt.number(RISK_DAYS) })}
                    />
                </div>

                <Panel flush className="overflow-hidden">
                    <div className="space-y-3 border-b px-4 pb-3">
                        <SegmentedTabs label={t('Inventory views')} segments={segments} value={filters.view} onChange={(v) => apply({ view: v as View })} />
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <SearchInput value={filters.q} onChange={(q) => apply({ q })} placeholder={t('Search by name or SKU')} className="sm:max-w-xs sm:flex-1" />
                            <Select value={filters.sort} onValueChange={(v) => apply({ sort: v as Sort })}>
                                <SelectTrigger className="h-9 w-full sm:ms-auto sm:w-52" aria-label={t('Sort')}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {SORTS.map((s) => (
                                        <SelectItem key={s.value} value={s.value}>
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
                            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                            <span>
                                {t('Low stock means {{n}} units or fewer (set in store settings). The bar marks that threshold at its midpoint. Days of cover uses the last 30 days of sales.', {
                                    n: fmt.number(threshold),
                                })}
                            </span>
                        </p>
                    </div>
                    <DataTable
                        rows={items}
                        columns={columns}
                        rowKey={(i) => i.id}
                        rowHref={rowHref}
                        mobileCard={mobileCard}
                        loading={loading}
                        caption={t('Inventory')}
                        empty={empty}
                    />
                    {items.length > 0 && (
                        <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-xs">
                            <span>{t('{{n}} products', { n: fmt.number(items.length) })}</span>
                            <span>{canEdit ? t('Select a product to update its stock') : t('Select a product to see its details')}</span>
                        </div>
                    )}
                </Panel>
            </div>
        </PageTemplate>
    );
}
