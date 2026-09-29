import { useMemo, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Boxes, Download, Eye, MoreHorizontal, Package, Pencil, Plus, SearchX, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageTemplate } from '@/components/page-template';
import { PageHeader, Panel, EmptyState } from '@/components/ds/layout';
import { DataTable, Pager, SearchInput, SegmentedTabs, type Column, type PageMeta } from '@/components/ds/data-table';
import { StatusBadge } from '@/components/ds/status-badge';
import { ACTIVE_STATUS, STOCK_STATUS, stockState } from '@/lib/commerce/status';
import { useCommerceFormat } from '@/hooks/use-commerce-format';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PriceCell, ProductThumb } from '@/components/products/product-bits';

interface ProductRow {
    id: number;
    name: string;
    sku: string | null;
    price: string | number;
    sale_price: string | number | null;
    stock: number;
    cover_image: string | null;
    is_active: boolean;
    is_downloadable: boolean;
    category?: { id: number; name: string } | null;
    updated_at: string;
}

interface Filters {
    q: string;
    status: 'active' | 'draft' | null;
    stock: 'in' | 'low' | 'out' | null;
    category: string | null;
    sort: string;
}

interface PageProps {
    products: PageMeta & { data: ProductRow[] };
    counts?: { all: number; active: number; draft: number; low: number; out: number };
    categories?: Array<{ id: number; name: string }>;
    lowStockThreshold?: number;
    filters?: Filters;
}

type View = 'all' | 'active' | 'draft' | 'low' | 'out';


export default function Products() {
    const { t } = useTranslation();
    const { number, relative, date } = useCommerceFormat();
    const { hasPermission } = usePermissions();
    const props = usePage().props as unknown as PageProps;
    const paginator = props.products;
    const rows = useMemo(() => (Array.isArray(paginator?.data) ? paginator.data : []), [paginator]);
    const counts = props.counts ?? { all: 0, active: 0, draft: 0, low: 0, out: 0 };
    const threshold = props.lowStockThreshold ?? 20;
    const filters: Filters = props.filters ?? { q: '', status: null, stock: null, category: null, sort: 'newest' };
    const categories = props.categories ?? [];

    const [loading, setLoading] = useState(false);
    const SORTS = [
        { value: 'newest', label: t('Newest first') },
        { value: 'updated', label: t('Recently updated') },
        { value: 'name', label: t('Name A–Z') },
        { value: 'price_desc', label: t('Highest price') },
        { value: 'price_asc', label: t('Lowest price') },
        { value: 'stock_asc', label: t('Lowest stock') },
        { value: 'stock_desc', label: t('Highest stock') },
    ];
    const [toDelete, setToDelete] = useState<ProductRow | null>(null);
    const [deleting, setDeleting] = useState(false);

    const view: View = filters.status === 'active' ? 'active' : filters.status === 'draft' ? 'draft' : filters.stock === 'low' ? 'low' : filters.stock === 'out' ? 'out' : 'all';
    const hasNarrowing = !!filters.q || !!filters.category || view !== 'all';

    const apply = (patch: Partial<Filters> & { page?: number }) => {
        const merged: Record<string, string | number | null | undefined> = { ...filters, ...patch };
        if (!('page' in patch)) delete merged.page;
        const params: Record<string, string | number> = {};
        Object.entries(merged).forEach(([k, v]) => {
            if (v === null || v === undefined || v === '') return;
            if (k === 'sort' && v === 'newest') return;
            params[k] = v;
        });
        router.get(route('products.index'), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            only: ['products', 'filters', 'counts'],
            onStart: () => setLoading(true),
            onFinish: () => setLoading(false),
        });
    };

    const setView = (v: string) => {
        const map: Record<string, Partial<Filters>> = {
            all: { status: null, stock: null },
            active: { status: 'active', stock: null },
            draft: { status: 'draft', stock: null },
            low: { status: null, stock: 'low' },
            out: { status: null, stock: 'out' },
        };
        apply(map[v] ?? map.all);
    };

    const confirmDelete = () => {
        if (!toDelete) return;
        router.delete(route('products.destroy', toDelete.id), {
            preserveScroll: true,
            onStart: () => setDeleting(true),
            onFinish: () => {
                setDeleting(false);
                setToDelete(null);
            },
        });
    };

    const canCreate = hasPermission('create-products');
    const canEdit = hasPermission('edit-products');
    const canDelete = hasPermission('delete-products');
    const canExport = hasPermission('export-products');

    const RowMenu = ({ p }: { p: ProductRow }) => (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8" aria-label={t('Actions for {{name}}', { name: p.name })}>
                    <MoreHorizontal className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
                <DropdownMenuItem asChild>
                    <Link href={route('products.show', p.id)}>
                        <Eye className="size-4" /> {t('View')}
                    </Link>
                </DropdownMenuItem>
                {canEdit && (
                    <DropdownMenuItem asChild>
                        <Link href={route('products.edit', p.id)}>
                            <Pencil className="size-4" /> {t('Edit')}
                        </Link>
                    </DropdownMenuItem>
                )}
                {canDelete && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-danger-fg focus:text-danger-fg" onSelect={() => setToDelete(p)}>
                            <Trash2 className="size-4" /> {t('Delete')}
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const columns: Column<ProductRow>[] = [
        {
            key: 'product',
            header: t('Product'),
            cell: (p) => (
                <div className="flex min-w-0 items-center gap-3">
                    <ProductThumb src={p.cover_image} alt="" />
                    <div className="min-w-0">
                        <Link href={route('products.show', p.id)} className="block max-w-[28ch] truncate font-medium hover:underline lg:max-w-[36ch]">
                            {p.name}
                        </Link>
                        <p className="text-muted-foreground truncate text-xs">
                            {p.sku ? <bdi dir="ltr">{p.sku}</bdi> : t('No SKU')}
                            {p.is_downloadable && <span> · {t('Digital')}</span>}
                        </p>
                    </div>
                </div>
            ),
        },
        { key: 'status', header: t('Status'), cell: (p) => <StatusBadge meta={p.is_active ? ACTIVE_STATUS.active : ACTIVE_STATUS.inactive} /> },
        {
            key: 'inventory',
            header: t('Inventory'),
            cell: (p) => {
                const st = stockState(p.stock, threshold);
                return (
                    <div className="flex flex-col items-start gap-0.5">
                        <StatusBadge meta={STOCK_STATUS[st]} />
                        <span className="text-muted-foreground text-xs tabular-nums">{t('{{n}} in stock', { n: number(p.stock) })}</span>
                    </div>
                );
            },
        },
        { key: 'price', header: t('Price'), align: 'end', cell: (p) => <PriceCell price={p.price} salePrice={p.sale_price} /> },
        { key: 'category', header: t('Category'), hideBelow: 'lg', cell: (p) => <span className="text-muted-foreground">{p.category?.name ?? t('Uncategorized')}</span> },
        {
            key: 'updated',
            header: t('Updated'),
            hideBelow: 'xl',
            cell: (p) => (
                <time dateTime={p.updated_at} title={date(p.updated_at)} className="text-muted-foreground whitespace-nowrap text-xs">
                    {relative(p.updated_at)}
                </time>
            ),
        },
        { key: 'actions', header: <span className="sr-only">{t('Actions')}</span>, align: 'end', className: 'w-10', cell: (p) => <RowMenu p={p} /> },
    ];

    const mobileCard = (p: ProductRow) => {
        const st = stockState(p.stock, threshold);
        return (
            <div className="flex gap-3">
                <ProductThumb src={p.cover_image} alt="" size="lg" />
                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-medium">{p.name}</p>
                        <PriceCell price={p.price} salePrice={p.sale_price} className="shrink-0 text-sm" />
                    </div>
                    <p className="text-muted-foreground truncate text-xs">
                        {p.sku ? <bdi dir="ltr">{p.sku}</bdi> : t('No SKU')}
                        {p.category?.name && <> · {p.category.name}</>}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <StatusBadge meta={p.is_active ? ACTIVE_STATUS.active : ACTIVE_STATUS.inactive} />
                        <StatusBadge meta={STOCK_STATUS[st]} />
                        <span className="text-muted-foreground text-xs tabular-nums">{t('{{n}} in stock', { n: number(p.stock) })}</span>
                    </div>
                </div>
            </div>
        );
    };

    const segments = [
        { value: 'all', label: t('All'), count: counts.all },
        { value: 'active', label: t('Active'), count: counts.active },
        { value: 'draft', label: t('Draft'), count: counts.draft },
        { value: 'low', label: t('Low stock'), count: counts.low },
        { value: 'out', label: t('Out of stock'), count: counts.out },
    ];

    const catalogEmpty = counts.all === 0;

    const emptyState = catalogEmpty ? (
        <EmptyState
            icon={<Package />}
            title={t('Add your first product')}
            description={t('Products you add appear in your storefront once they are active.')}
            action={
                canCreate && (
                    <Button asChild>
                        <Link href={route('products.create')}>
                            <Plus /> {t('Add product')}
                        </Link>
                    </Button>
                )
            }
        />
    ) : (
        <EmptyState
            icon={<SearchX />}
            title={t('No products match these filters')}
            description={view === 'out' && !filters.q && !filters.category ? t('Nothing is out of stock right now.') : t('Try a different search or clear the filters.')}
            action={
                <Button variant="outline" onClick={() => apply({ q: '', status: null, stock: null, category: null })}>
                    {t('Clear filters')}
                </Button>
            }
        />
    );

    return (
        <PageTemplate
            title={t('Products')}
            url="/products"
            breadcrumbs={[{ title: t('Dashboard'), href: route('dashboard') }, { title: t('Products') }]}
            header={
                <PageHeader
                    title={t('Products')}
                    description={
                        catalogEmpty
                            ? t('Build your catalog: add products, set prices and track stock.')
                            : t('{{total}} products · {{active}} active · low-stock alert at {{threshold}} units', {
                                  total: number(counts.all),
                                  active: number(counts.active),
                                  threshold: number(threshold),
                              })
                    }
                    actions={
                        <>
                            <Button variant="outline" size="sm" asChild className="h-9 sm:h-8">
                                <Link href={route('inventory.index')}>
                                    <Boxes /> {t('Inventory')}
                                </Link>
                            </Button>
                            {canExport && !catalogEmpty && (
                                <Button variant="outline" size="sm" asChild className="h-9 sm:h-8">
                                    <a href={route('products.export')}>
                                        <Download /> {t('Export CSV')}
                                    </a>
                                </Button>
                            )}
                            {canCreate && (
                                <Button size="sm" asChild className="h-9 sm:h-8">
                                    <Link href={route('products.create')}>
                                        <Plus /> {t('Add product')}
                                    </Link>
                                </Button>
                            )}
                        </>
                    }
                />
            }
        >
            <Panel flush className="overflow-hidden">
                {!catalogEmpty && (
                    <div className="space-y-3 border-b px-4 pb-3">
                        <SegmentedTabs label={t('Product views')} segments={segments} value={view} onChange={setView} />
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <SearchInput
                                value={filters.q}
                                onChange={(q) => apply({ q })}
                                placeholder={t('Search by name or SKU')}
                                className="sm:max-w-xs sm:flex-1"
                            />
                            <div className="grid grid-cols-2 gap-2 sm:ms-auto sm:flex">
                                <Select value={filters.category ?? 'all'} onValueChange={(v) => apply({ category: v === 'all' ? null : v })}>
                                    <SelectTrigger className="h-9 w-full sm:w-44" aria-label={t('Category')}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('All categories')}</SelectItem>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={filters.sort} onValueChange={(v) => apply({ sort: v })}>
                                    <SelectTrigger className="h-9 w-full sm:w-48" aria-label={t('Sort')}>
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
                        </div>
                        {hasNarrowing && (
                            <p className="text-muted-foreground text-xs" aria-live="polite">
                                {t('{{n}} matching products', { n: number(paginator?.total ?? 0) })}
                            </p>
                        )}
                    </div>
                )}
                <DataTable
                    rows={rows}
                    columns={columns}
                    rowKey={(p) => p.id}
                    rowHref={(p) => route('products.show', p.id)}
                    mobileCard={mobileCard}
                    loading={loading}
                    caption={t('Products')}
                    empty={emptyState}
                />
                {rows.length > 0 && <Pager meta={paginator} onPage={(page) => apply({ page })} />}
            </Panel>

            <Dialog open={!!toDelete} onOpenChange={(open) => !open && !deleting && setToDelete(null)}>
                <DialogContent data-testid="delete-product-dialog">
                    <DialogHeader>
                        <DialogTitle>{t('Delete product?')}</DialogTitle>
                        <DialogDescription>
                            {t('“{{name}}” will be removed from your catalog and storefront. This action cannot be undone.', { name: toDelete?.name ?? '' })}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setToDelete(null)} disabled={deleting}>
                            {t('Cancel')}
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
                            {deleting ? t('Deleting…') : t('Delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageTemplate>
    );
}
