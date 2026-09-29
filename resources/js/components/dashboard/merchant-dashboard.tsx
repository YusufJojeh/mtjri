import { Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Circle,
    Clock,
    CreditCard,
    Download,
    Lightbulb,
    PackageX,
    Percent,
    ShoppingBag,
    Timer,
    Truck,
} from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, MetricCard, PageHeader, Panel } from '@/components/ds/layout';
import { StatusBadge, ToneBadge, toneClasses } from '@/components/ds/status-badge';
import { Button } from '@/components/ui/button';
import { useCommerceFormat } from '@/hooks/use-commerce-format';
import { usePermissions } from '@/hooks/usePermissions';
import { computeInsights, type CommandCenterData } from '@/lib/commerce/insights';
import { orderStatusMeta, paymentStatusMeta, type Tone } from '@/lib/commerce/status';
import { percentChange } from '@/lib/commerce/format';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/utils/image-helper';
import { SalesTrendChart, type TrendPoint } from './sales-trend-chart';

export interface AttentionItem {
    id: 'payment_failed' | 'ready_to_ship' | 'stale_orders' | 'unpaid_fulfilled' | 'out_of_stock' | 'low_stock' | 'coupons_expiring' | string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    count: number;
    amount: number | null;
    href: string;
    hours?: number;
    threshold?: number;
    items?: string[];
}

export interface CommandCenter extends CommandCenterData {
    today: { orders: number; sales: number };
    yesterdaySameTime: { orders: number; sales: number };
    series: TrendPoint[];
    openOrders: number;
    attention: AttentionItem[];
    recentOrders: Array<{ id: number; number: string; customer: string; total: number; status: string; paymentStatus: string; createdAt: string }>;
    topProducts: Array<{ id: number; name: string; units: number; revenue: number; image: string | null; stock: number | null }>;
    setup: Array<{ id: 'product' | 'shipping' | 'discount' | 'first_order' | string; done: boolean; href: string | null }>;
    generatedAt: string;
}

interface Props {
    data: CommandCenter;
    store: { name: string; slug?: string } | null;
    userName?: string;
}

const severityTone: Record<AttentionItem['severity'], Tone> = { critical: 'danger', high: 'warning', medium: 'warning', low: 'info' };
const severityLabel: Record<AttentionItem['severity'], string> = { critical: 'Urgent', high: 'High', medium: 'Medium', low: 'Low' };
const attentionIcon: Record<string, typeof Clock> = {
    payment_failed: CreditCard,
    ready_to_ship: Truck,
    stale_orders: Timer,
    unpaid_fulfilled: AlertTriangle,
    out_of_stock: PackageX,
    low_stock: ShoppingBag,
    coupons_expiring: Percent,
};

function greetingKey(date: Date) {
    const h = date.getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
}

export function MerchantDashboard({ data, store, userName }: Props) {
    const { t } = useTranslation();
    const fmt = useCommerceFormat();
    const { hasPermission } = usePermissions();
    const canOrders = hasPermission('view-orders') || hasPermission('manage-orders');
    const canProducts = hasPermission('view-products') || hasPermission('manage-products');

    const insights = useMemo(
        () =>
            computeInsights(data, t, fmt, {
                product: (id) => route('products.show', id),
                productEdit: hasPermission('edit-products') ? (id) => route('products.edit', id) : undefined,
                createDiscount: hasPermission('create-coupon-system') ? route('coupon-system.create') : undefined,
                analytics: hasPermission('view-analytics') ? route('analytics.index') : undefined,
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [data, t, fmt],
    );

    const k = data.kpis;
    const setupRemaining = data.setup.filter((s) => !s.done);
    const attentionCopy = (a: AttentionItem): { title: string; impact: string; action: string } => {
        const amount = a.amount ? fmt.money(a.amount) : '';
        switch (a.id) {
            case 'payment_failed':
                return { title: t('{{count}} orders with failed payments', { count: a.count }), impact: t('{{amount}} at risk', { amount }), action: t('Review payments') };
            case 'ready_to_ship':
                return { title: t('{{count}} paid orders ready to fulfil', { count: a.count }), impact: t('{{amount}} waiting on you', { amount }), action: t('Fulfil orders') };
            case 'stale_orders':
                return { title: t('{{count}} open orders older than {{hours}} hours', { count: a.count, hours: a.hours ?? 48 }), impact: t('Slow fulfilment drives cancellations'), action: t('Review orders') };
            case 'unpaid_fulfilled':
                return { title: t('{{count}} shipped orders still unpaid', { count: a.count }), impact: t('{{amount}} not collected', { amount }), action: t('Follow up') };
            case 'out_of_stock':
                return { title: t('{{count}} active products are out of stock', { count: a.count }), impact: (a.items ?? []).join(' · '), action: t('Restock') };
            case 'low_stock':
                return { title: t('{{count}} products at or below {{threshold}} units', { count: a.count, threshold: a.threshold }), impact: (a.items ?? []).join(' · '), action: t('View inventory') };
            case 'coupons_expiring':
                return { title: t('{{count}} discounts end within 7 days', { count: a.count }), impact: (a.items ?? []).join(' · '), action: t('Review discounts') };
            default:
                return { title: String(a.id), impact: '', action: t('Open') };
        }
    };

    const setupCopy: Record<string, string> = {
        product: t('Add your first product'),
        shipping: t('Set up a shipping method'),
        discount: t('Create a launch discount'),
        first_order: t('Receive your first order'),
    };

    const todayChange = percentChange(data.today.sales, data.yesterdaySameTime.sales);

    return (
        <div className="flex flex-col gap-5">
            <PageHeader
                title={t('{{greeting}}, {{name}}', { greeting: t(greetingKey(new Date())), name: userName?.split(' ')[0] ?? '' }).replace(/,\s*$/, '')}
                description={store ? t('Here is what is happening at {{store}}', { store: store.name }) : undefined}
                actions={
                    <>
                        {hasPermission('export-dashboard') && (
                            <Button variant="ghost" size="sm" asChild className="h-9 sm:h-8">
                                <a href={route('dashboard.export')} target="_blank" rel="noopener noreferrer">
                                    <Download />
                                    {t('Export')}
                                </a>
                            </Button>
                        )}
                        {canOrders && (
                            <Button variant="outline" size="sm" asChild className="h-9 sm:h-8">
                                <Link href={route('orders.index')}>
                                    {t('All orders')}
                                    <ArrowRight className="rtl:rotate-180" />
                                </Link>
                            </Button>
                        )}
                    </>
                }
            />

            {/* KPI strip */}
            <section aria-label={t('Key metrics')} className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                <MetricCard
                    label={t("Today's sales")}
                    value={fmt.money(data.today.sales, { whole: true })}
                    change={todayChange}
                    changeLabel={t('vs yesterday so far')}
                    hint={t('{{count}} orders today', { count: data.today.orders })}
                />
                <MetricCard
                    label={t('Sales · {{days}} days', { days: data.periodDays })}
                    value={fmt.money(k.sales.current, { whole: true })}
                    change={percentChange(k.sales.current, k.sales.previous)}
                    changeLabel={t('vs previous period')}
                    hint={t('No earlier data to compare')}
                    href={hasPermission('view-analytics') ? route('analytics.index') : undefined}
                />
                <MetricCard
                    label={t('Orders · {{days}} days', { days: data.periodDays })}
                    value={fmt.number(k.orders.current)}
                    change={percentChange(k.orders.current, k.orders.previous)}
                    changeLabel={t('vs previous period')}
                    hint={t('No earlier data to compare')}
                    href={canOrders ? route('orders.index') : undefined}
                />
                <MetricCard
                    label={t('Average order value')}
                    value={fmt.money(k.aov.current, { whole: true })}
                    change={percentChange(k.aov.current, k.aov.previous)}
                    changeLabel={t('vs previous period')}
                    hint={t('No earlier data to compare')}
                />
                <MetricCard
                    className="col-span-2 lg:col-span-1"
                    label={t('Open orders')}
                    value={fmt.number(data.openOrders)}
                    hint={t('Pending or processing')}
                    emphasis={data.openOrders > 0 ? 'warning' : 'default'}
                    href={canOrders ? route('orders.index', { view: 'open' }) : undefined}
                />
            </section>

            <div className="grid items-start gap-5 lg:grid-cols-3">
                {/* Needs attention — first on phones, beside the chart on desktop */}
                <Panel
                    id="attention"
                    title={t('Needs attention')}
                    description={data.attention.length ? t('Ranked by urgency') : undefined}
                    className="lg:order-2"
                    flush
                    action={data.attention.length ? <ToneBadge tone="warning">{fmt.number(data.attention.length)}</ToneBadge> : undefined}
                >
                    {data.attention.length === 0 ? (
                        <EmptyState compact icon={<CheckCircle2 />} title={t('All caught up')} description={t('No orders, payments or stock issues need action right now')} />
                    ) : (
                        <ul className="divide-y" role="list">
                            {data.attention.map((a) => {
                                const copy = attentionCopy(a);
                                const Icon = attentionIcon[a.id] ?? AlertTriangle;
                                const tone = severityTone[a.severity];
                                return (
                                    <li key={a.id}>
                                        <Link href={a.href} className="hover:bg-muted/50 group flex items-start gap-3 px-4 py-3 outline-none focus-visible:bg-muted sm:px-5">
                                            <span className={cn('mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg', toneClasses[tone])} aria-hidden>
                                                <Icon className="size-4" />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="flex items-start justify-between gap-2">
                                                    <span className="text-sm font-medium leading-5">{copy.title}</span>
                                                    <span className="sr-only">
                                                        {t('Priority')}: {t(severityLabel[a.severity])}
                                                    </span>
                                                </span>
                                                {copy.impact && <span className="text-muted-foreground mt-0.5 block truncate text-xs">{copy.impact}</span>}
                                                <span className="text-foreground mt-1.5 inline-flex items-center gap-1 text-xs font-medium group-hover:underline">
                                                    {copy.action}
                                                    <ArrowRight className="size-3 rtl:rotate-180" aria-hidden />
                                                </span>
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Panel>

                <Panel
                    title={t('Sales trend')}
                    description={t('Last {{days}} days compared with the {{days}} days before', { days: data.periodDays })}
                    className="lg:order-1 lg:col-span-2"
                >
                    {k.orders.current + k.orders.previous === 0 ? (
                        <EmptyState compact icon={<ShoppingBag />} title={t('No sales yet')} description={t('Your sales trend appears here after the first order')} />
                    ) : (
                        <SalesTrendChart data={data.series} height={300} />
                    )}
                </Panel>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
                <Panel
                    title={t('Recent orders')}
                    className="lg:col-span-2"
                    flush
                    action={
                        canOrders ? (
                            <Link href={route('orders.index')} className="text-muted-foreground hover:text-foreground text-xs font-medium">
                                {t('View all')}
                            </Link>
                        ) : undefined
                    }
                >
                    {data.recentOrders.length === 0 ? (
                        <EmptyState compact icon={<ShoppingBag />} title={t('No orders yet')} description={t('Share your store link to start receiving orders')} />
                    ) : (
                        <ul className="divide-y" role="list">
                            {data.recentOrders.map((o) => (
                                <li key={o.id}>
                                    <Link
                                        href={canOrders ? route('orders.show', o.id) : '#'}
                                        className="hover:bg-muted/50 grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-2.5 outline-none focus-visible:bg-muted sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto_auto] sm:px-5"
                                    >
                                        <span className="min-w-0">
                                            <bdi className="block truncate text-sm font-medium" dir="ltr">
                                                {o.number}
                                            </bdi>
                                            <span className="text-muted-foreground block truncate text-xs">
                                                {o.customer || t('Guest')} · {fmt.relative(o.createdAt)}
                                            </span>
                                        </span>
                                        <span className="hidden flex-wrap gap-1.5 sm:flex">
                                            <StatusBadge meta={paymentStatusMeta(o.paymentStatus)} />
                                            <StatusBadge meta={orderStatusMeta(o.status)} />
                                        </span>
                                        <span className="text-end text-sm font-semibold tabular-nums sm:col-start-4">{fmt.money(o.total)}</span>
                                        <span className="col-span-2 flex flex-wrap gap-1.5 sm:hidden">
                                            <StatusBadge meta={paymentStatusMeta(o.paymentStatus)} />
                                            <StatusBadge meta={orderStatusMeta(o.status)} />
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                <Panel
                    title={t('Top products')}
                    description={t('By sales, last {{days}} days', { days: data.periodDays })}
                    flush
                    action={
                        canProducts ? (
                            <Link href={route('products.index')} className="text-muted-foreground hover:text-foreground text-xs font-medium">
                                {t('View all')}
                            </Link>
                        ) : undefined
                    }
                >
                    {data.topProducts.length === 0 ? (
                        <EmptyState compact icon={<ShoppingBag />} title={t('No product sales yet')} description={t('Best sellers show up here once orders come in')} />
                    ) : (
                        <ol className="divide-y">
                            {data.topProducts.map((p, i) => {
                                const max = data.topProducts[0].revenue || 1;
                                const low = p.stock !== null && p.stock <= data.catalog.lowStockThreshold;
                                return (
                                    <li key={p.id}>
                                        <Link href={canProducts ? route('products.show', p.id) : '#'} className="hover:bg-muted/50 flex items-center gap-3 px-4 py-2.5 sm:px-5">
                                            <span className="text-muted-foreground w-4 text-xs tabular-nums">{i + 1}</span>
                                            {p.image ? (
                                                <img src={getImageUrl(p.image)} alt="" loading="lazy" className="bg-muted size-9 shrink-0 rounded-md border object-cover" />
                                            ) : (
                                                <span className="bg-muted size-9 shrink-0 rounded-md border" aria-hidden />
                                            )}
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-medium">{p.name}</span>
                                                <span className="bg-muted mt-1 block h-1 overflow-hidden rounded-full" aria-hidden>
                                                    <span className="bg-primary block h-full rounded-full" style={{ width: `${Math.max(4, (p.revenue / max) * 100)}%` }} />
                                                </span>
                                                <span className="text-muted-foreground mt-1 flex items-center gap-2 text-xs">
                                                    {t('{{count}} sold', { count: p.units })}
                                                    {low && (
                                                        <span className="text-warning-fg inline-flex items-center gap-0.5 font-medium">
                                                            <AlertTriangle className="size-3" aria-hidden />
                                                            {p.stock === 0 ? t('Out of stock') : t('{{count}} left', { count: p.stock ?? 0 })}
                                                        </span>
                                                    )}
                                                </span>
                                            </span>
                                            <span className="text-sm font-semibold tabular-nums">{fmt.money(p.revenue)}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </Panel>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
                <Panel
                    title={t('Insights')}
                    description={t('Rules applied to your last {{days}} days of store data', { days: data.periodDays })}
                    icon={<Lightbulb />}
                    className={setupRemaining.length ? 'lg:col-span-2' : 'lg:col-span-3'}
                    flush
                >
                    {insights.length === 0 ? (
                        <EmptyState compact title={t('Nothing unusual right now')} description={t('Insights appear when sales, stock or customer patterns change meaningfully')} />
                    ) : (
                        <ul className={cn('grid divide-y', !setupRemaining.length && 'lg:grid-cols-2 lg:divide-y-0')} role="list">
                            {insights.map((ins) => (
                                <li key={ins.id} className="flex gap-3 px-4 py-3 sm:px-5">
                                    <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', { 'bg-success': ins.tone === 'success', 'bg-warning': ins.tone === 'warning', 'bg-danger': ins.tone === 'danger', 'bg-info': ins.tone === 'info' })} aria-hidden />
                                    <div className="min-w-0 space-y-1">
                                        <p className="text-sm font-medium">{ins.title}</p>
                                        <p className="text-muted-foreground text-sm">{ins.why}</p>
                                        <p className="text-muted-foreground text-xs">
                                            <span className="font-medium">{t('Evidence')}</span> · <span className="tabular-nums">{ins.evidence}</span>
                                        </p>
                                        {ins.action && (
                                            <Link href={ins.action.href} className="inline-flex items-center gap-1 text-xs font-medium hover:underline">
                                                {ins.action.label}
                                                <ArrowRight className="size-3 rtl:rotate-180" aria-hidden />
                                            </Link>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                {setupRemaining.length > 0 && (
                    <Panel
                        title={t('Store setup')}
                        description={t('{{done}} of {{total}} complete', { done: data.setup.length - setupRemaining.length, total: data.setup.length })}
                    >
                        <div className="bg-muted mb-3 h-1.5 overflow-hidden rounded-full" role="progressbar" aria-valuemin={0} aria-valuemax={data.setup.length} aria-valuenow={data.setup.length - setupRemaining.length} aria-label={t('Store setup')}>
                            <div className="bg-primary h-full rounded-full" style={{ width: `${((data.setup.length - setupRemaining.length) / data.setup.length) * 100}%` }} />
                        </div>
                        <ul className="space-y-1" role="list">
                            {data.setup.map((s) => (
                                <li key={s.id}>
                                    {s.done || !s.href ? (
                                        <span className={cn('flex items-center gap-2 py-1.5 text-sm', s.done && 'text-muted-foreground line-through decoration-1')}>
                                            {s.done ? <CheckCircle2 className="text-success size-4" aria-hidden /> : <Circle className="text-muted-foreground size-4" aria-hidden />}
                                            {setupCopy[s.id] ?? s.id}
                                            <span className="sr-only">{s.done ? t('Done') : t('Not done')}</span>
                                        </span>
                                    ) : (
                                        <Link href={s.href} className="hover:bg-muted -mx-2 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium">
                                            <Circle className="text-muted-foreground size-4" aria-hidden />
                                            <span className="flex-1">{setupCopy[s.id] ?? s.id}</span>
                                            <ArrowRight className="text-muted-foreground size-3.5 rtl:rotate-180" aria-hidden />
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </Panel>
                )}
            </div>
        </div>
    );
}
