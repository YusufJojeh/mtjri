import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Boxes, ExternalLink, FileText, Images, Info, Layers, Pencil, ReceiptText, Tag, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageTemplate } from '@/components/page-template';
import { DescriptionList, EmptyState, PageHeader, Panel, SectionLabel } from '@/components/ds/layout';
import { StatusBadge, ToneBadge } from '@/components/ds/status-badge';
import { Timeline } from '@/components/ds/timeline';
import { ACTIVE_STATUS, STOCK_STATUS, orderStatusMeta, stockState } from '@/lib/commerce/status';
import { useCommerceFormat } from '@/hooks/use-commerce-format';
import { usePermissions } from '@/hooks/usePermissions';
import { useMerchantShell } from '@/components/shell/use-merchant-shell';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/utils/image-helper';
import { htmlToText } from '@/lib/commerce/diff';
import { PriceCell, StockMeter, effectivePrice } from '@/components/products/product-bits';
import { RichContent } from '@/components/products/rich-content';

interface Product {
    id: number;
    name: string;
    sku: string | null;
    description: string | null;
    specifications: string | null;
    details: string | null;
    price: string | number;
    sale_price: string | number | null;
    stock: number;
    cover_image: string | null;
    images: string | null;
    variants: Array<{ name: string; values: string[] }> | null;
    custom_fields: Array<{ name: string; value: string }> | null;
    is_active: boolean;
    is_downloadable: boolean;
    downloadable_file: string | null;
    category?: { id: number; name: string } | null;
    tax?: { id: number; name: string; rate?: number | string } | null;
    created_at: string;
    updated_at: string;
}

interface Window {
    units: number;
    revenue: number;
    orders: number;
}

interface PageProps {
    product: Product;
    performance?: { d30: Window; d90: Window; onOpenOrders: number };
    recentOrders?: Array<{ id: number; number: string; status: string; paymentStatus: string; customer: string; createdAt: string; quantity: number; total: number }>;
    lowStockThreshold?: number;
}

export default function ShowProduct() {
    const { t } = useTranslation();
    const fmt = useCommerceFormat();
    const { hasPermission } = usePermissions();
    const { currentStore } = useMerchantShell();
    const { product, performance, recentOrders = [], lowStockThreshold = 20 } = usePage().props as unknown as PageProps;
    // Files referenced by the product but missing from storage fall back to the placeholder.
    const [brokenImages, setBrokenImages] = useState<Set<string>>(() => new Set());
    const [range, setRange] = useState<'d30' | 'd90'>('d30');
    const [activeImage, setActiveImage] = useState<string | null>(product.cover_image || null);

    const threshold = lowStockThreshold;
    const state = stockState(product.stock, threshold);
    const images = [product.cover_image, ...(product.images ? product.images.split(',') : [])].map((s) => (s || '').trim()).filter(Boolean);
    const gallery = Array.from(new Set(images));
    const variants = (product.variants ?? []).filter((v) => v && v.name);
    const customFields = (product.custom_fields ?? []).filter((f) => f && f.name);
    const price = effectivePrice(product.price, product.sale_price);
    const discountPct = price.onSale && price.price > 0 ? Math.round(((price.price - (price.sale ?? 0)) / price.price) * 100) : null;
    const perf = performance?.[range];
    const canEdit = hasPermission('edit-products');
    const canViewOrders = hasPermission('view-orders');
    const storefrontUrl = currentStore?.slug ? route('store.product', { storeSlug: currentStore.slug, id: product.id }) : null;

    return (
        <PageTemplate
            title={product.name}
            url={`/products/${product.id}`}
            breadcrumbs={[
                { title: t('Dashboard'), href: route('dashboard') },
                { title: t('Products'), href: route('products.index') },
                { title: product.name },
            ]}
            header={
                <PageHeader
                    back={{ href: route('products.index'), label: t('Products') }}
                    title={product.name}
                    meta={
                        <>
                            <StatusBadge meta={product.is_active ? ACTIVE_STATUS.active : ACTIVE_STATUS.inactive} />
                            <StatusBadge meta={STOCK_STATUS[state]} />
                        </>
                    }
                    description={
                        <span className="inline-flex flex-wrap items-center gap-x-2">
                            {product.sku ? (
                                <span>
                                    {t('SKU')} <bdi dir="ltr">{product.sku}</bdi>
                                </span>
                            ) : (
                                <span>{t('No SKU')}</span>
                            )}
                            <span aria-hidden>·</span>
                            <span>{product.category?.name ?? t('Uncategorized')}</span>
                        </span>
                    }
                    actions={
                        <>
                            {storefrontUrl && product.is_active && (
                                <Button variant="outline" size="sm" asChild className="h-9 sm:h-8">
                                    <a href={storefrontUrl} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="rtl:-scale-x-100" /> {t('View on storefront')}
                                    </a>
                                </Button>
                            )}
                            {canEdit && (
                                <Button size="sm" asChild className="h-9 sm:h-8">
                                    <Link href={route('products.edit', product.id)}>
                                        <Pencil /> {t('Edit product')}
                                    </Link>
                                </Button>
                            )}
                        </>
                    }
                />
            }
        >
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                {/* Main column */}
                <div className="min-w-0 space-y-5">
                    {/* Overview */}
                    <Panel aria-label={t('Overview')}>
                        <div className="flex flex-col gap-5 sm:flex-row">
                            <div className="w-full shrink-0 sm:w-56">
                                <div className="bg-muted aspect-square overflow-hidden rounded-lg border">
                                    {activeImage && !brokenImages.has(activeImage) ? (
                                        <img
                                            src={getImageUrl(activeImage)}
                                            alt={product.name}
                                            className="size-full object-cover"
                                            onError={() => setBrokenImages((prev) => new Set(prev).add(activeImage))}
                                        />
                                    ) : (
                                        <div className="text-muted-foreground flex size-full flex-col items-center justify-center gap-2 text-xs">
                                            <Images className="size-6" aria-hidden />
                                            {t('No image yet')}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="min-w-0 flex-1 space-y-4">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                                    <div>
                                        <SectionLabel>{t('Price')}</SectionLabel>
                                        <PriceCell price={product.price} salePrice={product.sale_price} className="mt-1 text-lg font-semibold" />
                                    </div>
                                    <div>
                                        <SectionLabel>{t('Available')}</SectionLabel>
                                        <p className="mt-1 text-lg font-semibold tabular-nums">{fmt.number(product.stock)}</p>
                                    </div>
                                    <div>
                                        <SectionLabel>{t('Sold, last 30 days')}</SectionLabel>
                                        <p className="mt-1 text-lg font-semibold tabular-nums">{performance ? fmt.number(performance.d30.units) : '—'}</p>
                                    </div>
                                    <div>
                                        <SectionLabel>{t('On open orders')}</SectionLabel>
                                        <p className="mt-1 text-lg font-semibold tabular-nums">{performance ? fmt.number(performance.onOpenOrders) : '—'}</p>
                                    </div>
                                </div>
                                {product.description ? (
                                    <p className="text-muted-foreground line-clamp-3 text-sm">{htmlToText(product.description).replace(/\s+/g, ' ')}</p>
                                ) : (
                                    <p className="text-muted-foreground text-sm">{t('No description yet. A clear description helps customers decide.')}</p>
                                )}
                            </div>
                        </div>
                    </Panel>

                    {/* Performance */}
                    <Panel
                        title={t('Performance')}
                        icon={<TrendingUp />}
                        description={t('From orders containing this product. Cancelled orders are excluded.')}
                        action={
                            <div className="bg-muted inline-flex rounded-lg p-0.5 text-xs" role="group" aria-label={t('Period')}>
                                {(['d30', 'd90'] as const).map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        aria-pressed={range === r}
                                        onClick={() => setRange(r)}
                                        className={cn(
                                            'focus-visible:ring-ring/40 rounded-md px-2.5 py-1 font-medium outline-none focus-visible:ring-[3px]',
                                            range === r ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground',
                                        )}
                                    >
                                        {r === 'd30' ? t('30 days') : t('90 days')}
                                    </button>
                                ))}
                            </div>
                        }
                    >
                        <dl className="grid grid-cols-3 divide-x rounded-lg border rtl:divide-x-reverse">
                            {[
                                { label: t('Units sold'), value: perf ? fmt.number(perf.units) : '—' },
                                { label: t('Revenue'), value: perf ? fmt.money(perf.revenue) : '—' },
                                { label: t('Orders'), value: perf ? fmt.number(perf.orders) : '—' },
                            ].map((m) => (
                                <div key={m.label} className="min-w-0 px-3 py-2.5">
                                    <dt className="text-muted-foreground truncate text-xs">{m.label}</dt>
                                    <dd className="mt-0.5 truncate text-base font-semibold tabular-nums sm:text-lg">{m.value}</dd>
                                </div>
                            ))}
                        </dl>

                        <div className="mt-5">
                            <SectionLabel className="mb-2">{t('Recent orders')}</SectionLabel>
                            {recentOrders.length === 0 ? (
                                <p className="text-muted-foreground text-sm">{t('This product has not been ordered yet.')}</p>
                            ) : (
                                <ul className="divide-y rounded-lg border">
                                    {recentOrders.map((o) => {
                                        const inner = (
                                            <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">
                                                        <bdi dir="ltr">{o.number}</bdi>
                                                        {o.customer && <span className="text-muted-foreground font-normal"> · {o.customer}</span>}
                                                    </p>
                                                    <p className="text-muted-foreground text-xs">
                                                        {fmt.date(o.createdAt)} · {t('Qty {{n}}', { n: fmt.number(o.quantity) })}
                                                    </p>
                                                </div>
                                                <div className="flex shrink-0 flex-col items-end gap-1">
                                                    <span className="text-sm font-medium tabular-nums">{fmt.money(o.total)}</span>
                                                    <StatusBadge meta={orderStatusMeta(o.status)} />
                                                </div>
                                            </div>
                                        );
                                        return (
                                            <li key={`${o.id}-${o.createdAt}`}>
                                                {canViewOrders ? (
                                                    <Link href={route('orders.show', o.id)} className="hover:bg-muted/50 focus-visible:bg-muted block outline-none">
                                                        {inner}
                                                    </Link>
                                                ) : (
                                                    inner
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </Panel>

                    {/* Description */}
                    <Panel title={t('Description')} icon={<FileText />}>
                        {product.description ? (
                            <RichContent value={product.description} />
                        ) : (
                            <EmptyState
                                compact
                                title={t('No description yet')}
                                description={t('Describe what the product is, who it is for and what makes it worth buying.')}
                                action={
                                    canEdit && (
                                        <Button size="sm" variant="outline" asChild>
                                            <Link href={route('products.edit', product.id)}>{t('Add description')}</Link>
                                        </Button>
                                    )
                                }
                            />
                        )}
                        {(product.specifications || product.details) && (
                            <div className="mt-5 grid gap-5 border-t pt-4 md:grid-cols-2">
                                {product.specifications && (
                                    <div>
                                        <SectionLabel className="mb-2">{t('Specifications')}</SectionLabel>
                                        <RichContent value={product.specifications} />
                                    </div>
                                )}
                                {product.details && (
                                    <div>
                                        <SectionLabel className="mb-2">{t('Additional details')}</SectionLabel>
                                        <RichContent value={product.details} />
                                    </div>
                                )}
                            </div>
                        )}
                    </Panel>

                    {/* Media */}
                    <Panel title={t('Media')} icon={<Images />} description={gallery.length ? t('{{n}} images · the first image is the cover', { n: fmt.number(gallery.length) }) : undefined}>
                        {gallery.length === 0 ? (
                            <EmptyState
                                compact
                                title={t('No images yet')}
                                description={t('Products with clear photos sell better.')}
                                action={
                                    canEdit && (
                                        <Button size="sm" variant="outline" asChild>
                                            <Link href={route('products.edit', product.id)}>{t('Add images')}</Link>
                                        </Button>
                                    )
                                }
                            />
                        ) : (
                            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                                {gallery.map((src, i) => (
                                    <li key={src}>
                                        <button
                                            type="button"
                                            onClick={() => setActiveImage(src)}
                                            aria-pressed={activeImage === src}
                                            aria-label={t('Show image {{n}}', { n: i + 1 })}
                                            className={cn(
                                                'focus-visible:ring-ring/50 relative block aspect-square w-full overflow-hidden rounded-lg border outline-none focus-visible:ring-[3px]',
                                                activeImage === src && 'ring-primary ring-2',
                                            )}
                                        >
                                            <img src={getImageUrl(src)} alt="" loading="lazy" className="size-full object-cover" />
                                            {i === 0 && src === product.cover_image && (
                                                <span className="bg-background/90 absolute start-1 top-1 rounded px-1 text-[10px] font-medium">{t('Cover')}</span>
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>

                    {/* Variants */}
                    <Panel title={t('Variants')} icon={<Layers />}>
                        {variants.length === 0 ? (
                            <p className="text-muted-foreground text-sm">{t('This product has no options such as size or color.')}</p>
                        ) : (
                            <div className="space-y-4">
                                {variants.map((v, i) => (
                                    <div key={`${v.name}-${i}`}>
                                        <SectionLabel className="mb-1.5">{v.name}</SectionLabel>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(v.values ?? []).filter(Boolean).map((val, j) => (
                                                <span key={j} className="bg-muted rounded-md border px-2 py-0.5 text-xs font-medium">
                                                    {val}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="text-muted-foreground mt-4 flex items-start gap-1.5 text-xs">
                            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                            {t('Options are choices shown to customers. Stock and price are tracked for the product as a whole, not per option.')}
                        </p>
                    </Panel>

                    {customFields.length > 0 && (
                        <Panel title={t('Custom fields')} icon={<Tag />}>
                            <DescriptionList items={customFields.map((f, i) => ({ label: f.name || `#${i + 1}`, value: f.value || '—' }))} />
                        </Panel>
                    )}
                </div>

                {/* Sidebar */}
                <div className="min-w-0 space-y-5">
                    <Panel title={t('Pricing')} icon={<ReceiptText />}>
                        <DescriptionList
                            items={[
                                { label: t('Regular price'), value: <span className="tabular-nums">{fmt.money(price.price)}</span> },
                                {
                                    label: t('Sale price'),
                                    value: price.onSale ? (
                                        <span className="inline-flex items-center gap-1.5">
                                            <span className="tabular-nums">{fmt.money(price.sale)}</span>
                                            {discountPct !== null && <ToneBadge tone="success">{t('{{n}}% off', { n: fmt.number(discountPct) })}</ToneBadge>}
                                        </span>
                                    ) : product.sale_price !== null && product.sale_price !== '' ? (
                                        <span className="text-muted-foreground font-normal">{t('Not applied (not below regular price)')}</span>
                                    ) : (
                                        <span className="text-muted-foreground font-normal">{t('Not set')}</span>
                                    ),
                                },
                                {
                                    label: t('Tax'),
                                    value: product.tax ? (
                                        <span>
                                            {product.tax.name}
                                            {product.tax.rate !== undefined && <span className="text-muted-foreground"> ({fmt.number(Number(product.tax.rate))}%)</span>}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground font-normal">{t('None')}</span>
                                    ),
                                },
                            ]}
                        />
                    </Panel>

                    <Panel
                        title={t('Inventory')}
                        icon={<Boxes />}
                        action={
                            <Link href={route('inventory.index')} className="text-primary text-xs font-medium hover:underline">
                                {t('Open inventory')}
                            </Link>
                        }
                    >
                        <div className="flex items-baseline justify-between gap-2">
                            <p className="text-2xl font-semibold tabular-nums">{fmt.number(product.stock)}</p>
                            <StatusBadge meta={STOCK_STATUS[state]} />
                        </div>
                        <StockMeter stock={product.stock} threshold={threshold} state={state} className="mt-3" />
                        <p className="text-muted-foreground mt-2 text-xs">
                            {t('Low-stock alert at {{n}} units (store setting).', { n: fmt.number(threshold) })}
                            {performance && performance.onOpenOrders > 0 && <> {t('{{n}} units are on open orders.', { n: fmt.number(performance.onOpenOrders) })}</>}
                        </p>
                        {canEdit && (
                            <Button variant="outline" size="sm" asChild className="mt-3 w-full">
                                <Link href={route('products.edit', product.id)}>{t('Update stock')}</Link>
                            </Button>
                        )}
                    </Panel>

                    <Panel title={t('Organization')}>
                        <DescriptionList
                            items={[
                                { label: t('Category'), value: product.category?.name ?? <span className="text-muted-foreground font-normal">{t('Uncategorized')}</span> },
                                { label: t('Product type'), value: product.is_downloadable ? t('Digital (downloadable)') : t('Physical') },
                                {
                                    label: t('Download file'),
                                    hidden: !product.downloadable_file,
                                    value: (
                                        <bdi dir="ltr" className="block max-w-44 truncate" title={product.downloadable_file ?? ''}>
                                            {(product.downloadable_file ?? '').split('/').pop()}
                                        </bdi>
                                    ),
                                },
                                { label: t('Storefront visibility'), value: product.is_active ? t('Visible') : t('Hidden (draft)') },
                            ]}
                        />
                    </Panel>

                    <Panel title={t('Activity')}>
                        <Timeline
                            events={[
                                ...(product.updated_at && product.updated_at !== product.created_at
                                    ? [{ id: 'updated', title: t('Last updated'), time: fmt.dateTime(product.updated_at), tone: 'info' as const }]
                                    : []),
                                { id: 'created', title: t('Product created'), time: fmt.dateTime(product.created_at), tone: 'neutral' as const },
                            ]}
                        />
                    </Panel>
                </div>
            </div>
        </PageTemplate>
    );
}
