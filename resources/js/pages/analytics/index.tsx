import { useEffect, useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Download, Store, TicketPercent } from 'lucide-react';
import { PageTemplate } from '@/components/page-template';
import { EmptyState, MetricCard, PageHeader, Panel } from '@/components/ds/layout';
import { SegmentedTabs } from '@/components/ds/data-table';
import { StatusBadge, toneDot } from '@/components/ds/status-badge';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/usePermissions';
import { useCommerceFormat } from '@/hooks/use-commerce-format';
import { orderStatusMeta } from '@/lib/commerce/status';
import { percentChange } from '@/lib/commerce/format';
import { cn } from '@/lib/utils';
import { TrendChart, type SeriesPoint } from '@/components/analytics/trend-chart';
import { BarTable } from '@/components/analytics/bar-table';
import { RangeControl, type RangeKey, type RangeMeta } from '@/components/analytics/range-control';

interface Totals {
    revenue: number;
    orders: number;
    aov: number | null;
    customers: number;
    discount: number;
    all_orders: number;
}

interface Product {
    product_id: number | null;
    name: string;
    units: number;
    revenue: number;
    orders: number;
}

interface Report {
    totals: Totals;
    previous: Totals | null;
    series: SeriesPoint[];
    topProducts: { by_revenue: Product[]; by_units: Product[] };
    customers: { new: number; returning: number; new_revenue: number; returning_revenue: number };
    topCustomers: Array<{ customer_id: number | null; name: string; email: string; orders: number; revenue: number }>;
    statusBreakdown: Array<{ status: string; orders: number; amount: number }>;
    discounts: {
        orders: number;
        discount: number;
        revenue: number;
        share: number | null;
        codes: Array<{ code: string; coupon_id: number | null; orders: number; discount: number; revenue: number }>;
    };
}

interface Props {
    analytics: Report | null;
    range: RangeMeta;
    hasStore: boolean;
}

const parseDay = (d: string) => {
    const [y, m, dd] = d.split('-').map(Number);
    return new Date(y, m - 1, dd);
};

export default function Analytics({ analytics, range, hasStore }: Props) {
    const { t } = useTranslation();
    const f = useCommerceFormat();
    const { hasPermission } = usePermissions();
    const [busy, setBusy] = useState(false);
    const [productSort, setProductSort] = useState<'revenue' | 'units'>('revenue');

    useEffect(() => {
        const offStart = router.on('start', () => setBusy(true));
        const offFinish = router.on('finish', () => setBusy(false));
        return () => {
            offStart();
            offFinish();
        };
    }, []);

    const go = (q: { range: RangeKey; from?: string; to?: string }) => {
        const params: Record<string, string> = { range: q.range };
        if (q.range === 'custom' && q.from && q.to) {
            params.from = q.from;
            params.to = q.to;
        }
        router.get(route('analytics.index'), params, { preserveScroll: true, preserveState: true, replace: true, only: ['analytics', 'range'] });
    };

    const periodLabel = `${f.date(parseDay(range.from))} – ${f.date(parseDay(range.to))}`;
    const prevLabel = `${f.date(parseDay(range.previous_from))} – ${f.date(parseDay(range.previous_to))}`;
    const cur = analytics?.totals;
    const prev = analytics?.previous ?? null;
    const change = (a: number | null | undefined, b: number | null | undefined) => (prev && a !== null && a !== undefined && b !== null && b !== undefined ? percentChange(a, b) : null);
    const changeLabel = t('vs previous {{count}} days', { count: range.days });

    const summaries = useMemo(() => {
        if (!analytics || !cur) return null;
        const best = analytics.series.reduce<SeriesPoint | null>((m, p) => (p.revenue > (m?.revenue ?? 0) ? p : m), null);
        const rc = change(cur.revenue, prev?.revenue);
        const revenue =
            (rc === null
                ? t('{{amount}} in sales. No earlier sales to compare with.', { amount: f.money(cur.revenue) })
                : t('{{amount}} in sales, {{change}} compared with the previous period ({{previous}}).', {
                      amount: f.money(cur.revenue),
                      change: f.percent(rc, { signed: true }),
                      previous: f.money(prev?.revenue ?? 0),
                  })) + (best ? ' ' + t('Best day: {{day}} ({{amount}}).', { day: f.date(parseDay(best.date)), amount: f.money(best.revenue) }) : '');
        const oc = change(cur.orders, prev?.orders);
        const orders =
            oc === null
                ? t('{{count}} orders in this period.', { count: cur.orders })
                : t('{{count}} orders, {{change}} compared with the previous period ({{previous}}).', {
                      count: cur.orders,
                      change: f.percent(oc, { signed: true }),
                      previous: f.number(prev?.orders ?? 0),
                  });
        return { revenue, orders };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [analytics, f, t]);

    const header = (
        <PageHeader
            title={t('Analytics')}
            description={
                hasStore ? (
                    <>
                        {periodLabel}
                        <span className="text-muted-foreground"> · {t('compared with {{period}}', { period: prevLabel })}</span>
                    </>
                ) : undefined
            }
            actions={
                hasPermission('export-analytics') && hasStore ? (
                    <Button variant="outline" size="sm" className="h-9" onClick={() => window.open(route('analytics.export'), '_blank')}>
                        <Download className="size-4" />
                        {t('Export report')}
                    </Button>
                ) : undefined
            }
        />
    );

    const frame = (children: React.ReactNode) => (
        <PageTemplate title={t('Analytics')} url="/analytics" header={header} breadcrumbs={[{ title: t('Dashboard'), href: route('dashboard') }, { title: t('Analytics') }]}>
            {children}
        </PageTemplate>
    );

    if (!hasStore || !analytics || !cur) {
        return frame(
            <section className="bg-card rounded-xl border shadow-card">
                <EmptyState
                    icon={<Store />}
                    title={t('Select a store to see analytics')}
                    description={t('Analytics are calculated per store. Choose a store from the header or create one.')}
                    action={
                        <Button asChild>
                            <Link href={route('stores.index')}>{t('Go to stores')}</Link>
                        </Button>
                    }
                />
            </section>,
        );
    }

    const empty = cur.all_orders === 0;
    const products = productSort === 'revenue' ? analytics.topProducts.by_revenue : analytics.topProducts.by_units;
    const mix = analytics.customers;
    const mixTotal = mix.new + mix.returning;
    const statusTotal = analytics.statusBreakdown.reduce((s, r) => s + r.orders, 0);
    const statusMax = Math.max(...analytics.statusBreakdown.map((r) => r.orders), 0);
    const canViewCustomers = hasPermission('view-customers');

    return frame(
        <div className={cn('space-y-5 transition-opacity', busy && 'pointer-events-none opacity-60')}>
            <RangeControl key={`${range.key}-${range.from}-${range.to}`} range={range} onChange={go} busy={busy} />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <MetricCard label={t('Sales')} value={f.money(cur.revenue, { whole: true })} change={change(cur.revenue, prev?.revenue)} changeLabel={changeLabel} hint={t('No earlier data')} />
                <MetricCard label={t('Orders')} value={f.number(cur.orders)} change={change(cur.orders, prev?.orders)} changeLabel={changeLabel} hint={t('No earlier data')} />
                <MetricCard
                    label={t('Average order value')}
                    value={cur.aov !== null ? f.money(cur.aov, { whole: true }) : '—'}
                    change={change(cur.aov, prev?.aov)}
                    changeLabel={changeLabel}
                    hint={t('No earlier data')}
                />
                <MetricCard label={t('Customers')} value={f.number(cur.customers)} change={change(cur.customers, prev?.customers)} changeLabel={changeLabel} hint={t('Unique buyers')} />
            </div>
            <p className="text-muted-foreground -mt-2 text-xs">{t('Sales and orders exclude cancelled and refunded orders.')}</p>

            {empty ? (
                <section className="bg-card rounded-xl border shadow-card">
                    <EmptyState
                        icon={<BarChart3 />}
                        title={t('No orders in this period')}
                        description={t('Try a longer date range. Charts appear as soon as orders come in.')}
                        action={
                            range.key !== '90d' ? (
                                <Button variant="outline" onClick={() => go({ range: '90d' })}>
                                    {t('Show last 90 days')}
                                </Button>
                            ) : (
                                <Button variant="outline" asChild>
                                    <Link href={route('coupon-system.create')}>{t('Create a discount')}</Link>
                                </Button>
                            )
                        }
                    />
                </section>
            ) : (
                <>
                    <Panel title={t('Sales over time')} description={t('Daily sales, this period against the previous one')}>
                        <TrendChart data={analytics.series} metric="revenue" showPrevious={!!prev} label={t('Sales over time')} summary={summaries?.revenue ?? ''} height={260} />
                    </Panel>

                    <div className="grid gap-5 lg:grid-cols-2">
                        <Panel title={t('Orders over time')} description={t('Average order value: {{amount}}', { amount: cur.aov !== null ? f.money(cur.aov) : '—' })}>
                            <TrendChart data={analytics.series} metric="orders" showPrevious={!!prev} label={t('Orders over time')} summary={summaries?.orders ?? ''} height={200} />
                        </Panel>

                        <Panel title={t('New vs returning customers')} description={t('Returning = ordered before this period')}>
                            {mixTotal === 0 ? (
                                <p className="text-muted-foreground text-sm">{t('No customers placed orders in this period.')}</p>
                            ) : (
                                <figure className="m-0 space-y-4">
                                    <figcaption className="text-muted-foreground text-xs">
                                        {t('{{new}} new and {{returning}} returning customers. Returning customers spent {{amount}}.', {
                                            new: mix.new,
                                            returning: mix.returning,
                                            amount: f.money(mix.returning_revenue),
                                        })}
                                    </figcaption>
                                    <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full" aria-hidden>
                                        {mix.new > 0 && <div className="h-full rounded-s-full last:rounded-e-full" style={{ width: `${(mix.new / mixTotal) * 100}%`, background: 'var(--chart-1)' }} />}
                                        {mix.returning > 0 && (
                                            <div className="h-full rounded-e-full first:rounded-s-full" style={{ width: `${(mix.returning / mixTotal) * 100}%`, background: 'var(--chart-3)' }} />
                                        )}
                                    </div>
                                    <dl className="grid grid-cols-2 gap-4">
                                        {[
                                            { key: 'new', label: t('New'), count: mix.new, revenue: mix.new_revenue, color: 'var(--chart-1)' },
                                            { key: 'ret', label: t('Returning'), count: mix.returning, revenue: mix.returning_revenue, color: 'var(--chart-3)' },
                                        ].map((s) => (
                                            <div key={s.key}>
                                                <dt className="text-muted-foreground flex items-center gap-1.5 text-xs">
                                                    <span className="size-2 rounded-full" style={{ background: s.color }} aria-hidden />
                                                    {s.label}
                                                </dt>
                                                <dd className="mt-1">
                                                    <span className="text-xl font-semibold">{f.number(s.count)}</span>
                                                    <span className="text-muted-foreground ms-1.5 text-xs tabular-nums">{f.percent((s.count / mixTotal) * 100)}</span>
                                                    <div className="text-muted-foreground text-xs tabular-nums">{t('{{amount}} in sales', { amount: f.money(s.revenue) })}</div>
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                </figure>
                            )}
                        </Panel>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                        <Panel
                            title={t('Top products')}
                            action={
                                <SegmentedTabs
                                    label={t('Rank products by')}
                                    value={productSort}
                                    onChange={(v) => setProductSort(v as 'revenue' | 'units')}
                                    segments={[
                                        { value: 'revenue', label: t('Sales') },
                                        { value: 'units', label: t('Units') },
                                    ]}
                                />
                            }
                        >
                            {products.length === 0 ? (
                                <p className="text-muted-foreground text-sm">{t('No products sold in this period.')}</p>
                            ) : (
                                <BarTable
                                    caption={productSort === 'revenue' ? t('Top products by sales') : t('Top products by units sold')}
                                    labelHeader={t('Product')}
                                    rows={products.map((p) => ({
                                        id: `${p.product_id}-${p.name}`,
                                        label: p.name,
                                        measure: productSort === 'revenue' ? p.revenue : p.units,
                                        sub: t('{{count}} orders', { count: p.orders }),
                                        p,
                                    }))}
                                    columns={[
                                        { key: 'units', header: t('Units'), render: (r) => f.number((r.p as Product).units) },
                                        { key: 'revenue', header: t('Sales'), render: (r) => f.money((r.p as Product).revenue) },
                                    ]}
                                />
                            )}
                        </Panel>

                        <Panel title={t('Orders by status')} description={t('All orders placed in this period, including cancelled')}>
                            {analytics.statusBreakdown.length === 0 ? (
                                <p className="text-muted-foreground text-sm">{t('No orders in this period.')}</p>
                            ) : (
                                <figure className="m-0">
                                    <figcaption className="sr-only">
                                        {analytics.statusBreakdown.map((r) => `${t(orderStatusMeta(r.status).label)}: ${r.orders}`).join(', ')}
                                    </figcaption>
                                    <ul className="space-y-3" role="list">
                                        {analytics.statusBreakdown.map((r) => {
                                            const meta = orderStatusMeta(r.status);
                                            return (
                                                <li key={r.status}>
                                                    <div className="flex items-center justify-between gap-3">
                                                        <StatusBadge meta={meta} />
                                                        <span className="text-sm tabular-nums">
                                                            <span className="font-medium">{f.number(r.orders)}</span>
                                                            <span className="text-muted-foreground ms-2 text-xs">{f.percent(statusTotal ? (r.orders / statusTotal) * 100 : 0)}</span>
                                                        </span>
                                                    </div>
                                                    <div className="bg-muted mt-1.5 h-1.5 w-full rounded-full" aria-hidden>
                                                        <div className={cn('h-full rounded-full', toneDot[meta.tone])} style={{ width: `${statusMax ? (r.orders / statusMax) * 100 : 0}%` }} />
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </figure>
                            )}
                        </Panel>
                    </div>

                    <div className="grid gap-5 lg:grid-cols-2">
                        <Panel title={t('Discount usage')} icon={<TicketPercent />}>
                            {analytics.discounts.orders === 0 ? (
                                <EmptyState
                                    compact
                                    title={t('No discount codes used in this period')}
                                    description={t('Codes redeemed at checkout show up here with the sales they brought in.')}
                                    action={
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={route('coupon-system.index')}>{t('Manage discounts')}</Link>
                                        </Button>
                                    }
                                />
                            ) : (
                                <div className="space-y-4">
                                    <dl className="grid grid-cols-3 gap-3">
                                        <div>
                                            <dt className="text-muted-foreground text-xs">{t('Orders with a code')}</dt>
                                            <dd className="mt-1 text-lg font-semibold">
                                                {f.number(analytics.discounts.orders)}
                                                {analytics.discounts.share !== null && (
                                                    <span className="text-muted-foreground ms-1 text-xs font-normal">{f.percent(analytics.discounts.share)}</span>
                                                )}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-muted-foreground text-xs">{t('Discount given')}</dt>
                                            <dd className="mt-1 truncate text-lg font-semibold">{f.money(analytics.discounts.discount)}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-muted-foreground text-xs">{t('Sales with codes')}</dt>
                                            <dd className="mt-1 truncate text-lg font-semibold">{f.money(analytics.discounts.revenue)}</dd>
                                        </div>
                                    </dl>
                                    <BarTable
                                        caption={t('Discount codes by orders')}
                                        labelHeader={t('Code')}
                                        rows={analytics.discounts.codes.map((c) => ({
                                            id: c.code,
                                            label: c.coupon_id ? (
                                                <Link href={route('store-coupons.show', c.coupon_id)} className="font-mono hover:underline" dir="ltr">
                                                    {c.code}
                                                </Link>
                                            ) : (
                                                <span className="font-mono" dir="ltr">
                                                    {c.code}
                                                </span>
                                            ),
                                            measure: c.orders,
                                            c,
                                        }))}
                                        columns={[
                                            { key: 'orders', header: t('Orders'), render: (r) => f.number((r.c as { orders: number }).orders) },
                                            { key: 'discount', header: t('Discount'), render: (r) => f.money((r.c as { discount: number }).discount) },
                                            { key: 'sales', header: t('Sales'), hideOnMobile: true, render: (r) => f.money((r.c as { revenue: number }).revenue) },
                                        ]}
                                    />
                                </div>
                            )}
                        </Panel>

                        <Panel title={t('Top customers')} description={t('By sales in this period')} flush>
                            {analytics.topCustomers.length === 0 ? (
                                <p className="text-muted-foreground px-4 pb-4 text-sm sm:px-5">{t('No customers placed orders in this period.')}</p>
                            ) : (
                                <ul className="divide-y border-t" role="list">
                                    {analytics.topCustomers.map((c) => {
                                        const body = (
                                            <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
                                                <div className="min-w-0">
                                                    <div className="truncate text-sm font-medium">{c.name || c.email}</div>
                                                    <div className="text-muted-foreground truncate text-xs">
                                                        <bdi dir="ltr">{c.email}</bdi>
                                                    </div>
                                                </div>
                                                <div className="shrink-0 text-end">
                                                    <div className="text-sm font-medium tabular-nums">{f.money(c.revenue)}</div>
                                                    <div className="text-muted-foreground text-xs">{t('{{count}} orders', { count: c.orders })}</div>
                                                </div>
                                            </div>
                                        );
                                        return (
                                            <li key={c.email}>
                                                {c.customer_id && canViewCustomers ? (
                                                    <Link href={route('customers.show', c.customer_id)} className="hover:bg-muted/50 focus-visible:bg-muted block outline-none">
                                                        {body}
                                                    </Link>
                                                ) : (
                                                    body
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </Panel>
                    </div>
                </>
            )}
        </div>,
    );
}
