import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Pause, Pencil, Play, ShoppingBag } from 'lucide-react';
import { PageTemplate } from '@/components/page-template';
import { DescriptionList, EmptyState, MetricCard, PageHeader, Panel } from '@/components/ds/layout';
import { StatusBadge } from '@/components/ds/status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/custom-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { useCommerceFormat } from '@/hooks/use-commerce-format';
import { orderStatusMeta, paymentStatusMeta } from '@/lib/commerce/status';
import { DiscountCode, DiscountStateBadge, UsageMeter } from '@/components/discounts/discount-bits';
import { daysUntil, deriveState, localDate, missingDates, num, valueLabel, type Discount, type DiscountState } from '@/components/discounts/discount-utils';

interface Stats {
    total_usage: number;
    unique_users: number;
    recent_usage: number;
    discount_given?: number;
    revenue?: number;
    avg_order_value?: number | null;
    state?: DiscountState;
    last_used_at?: string | null;
}

interface RecentOrder {
    id: number;
    order_number: string;
    customer_name: string;
    total: number | string;
    created_at?: string;
    date?: string;
    status?: string;
    payment_status?: string;
    coupon_discount?: number;
}

export default function DiscountShow() {
    const { t } = useTranslation();
    const f = useCommerceFormat();
    const { hasPermission } = usePermissions();
    const { coupon, stats, recentOrders = [] } = usePage().props as unknown as { coupon: Discount; stats?: Stats; recentOrders?: RecentOrder[] };
    const [pending, setPending] = useState(false);

    // The shared /coupon-system/{id} route renders without performance data; load the full view.
    useEffect(() => {
        if (!stats && coupon?.id) router.visit(route('store-coupons.show', coupon.id), { replace: true, preserveScroll: true });
    }, [stats, coupon?.id]);

    const state: DiscountState = stats?.state ?? deriveState(coupon);
    const daysLeft = daysUntil(coupon.expiry_date);
    const used = Math.max(stats?.total_usage ?? 0, coupon.used_count ?? 0);
    const min = num(coupon.minimum_spend);
    const cap = num(coupon.maximum_spend);
    const canView = hasPermission('view-orders');

    const toggle = async () => {
        setPending(true);
        try {
            const res = await axios.post(route('store-coupons.toggle-status', coupon.id), {}, { headers: { Accept: 'application/json' } });
            toast.success(res.data?.status ? t('{{name}} is now active', { name: coupon.name }) : t('{{name}} is paused', { name: coupon.name }));
            router.reload({ onFinish: () => setPending(false) });
        } catch {
            toast.error(t('Could not change the status. Please try again.'));
            setPending(false);
        }
    };

    const header = (
        <PageHeader
            back={{ href: route('coupon-system.index'), label: t('Discounts') }}
            title={coupon.name}
            meta={<DiscountStateBadge state={state} daysLeft={daysLeft} />}
            description={<DiscountCode code={coupon.code} size="lg" className="mt-1" />}
            actions={
                <>
                    {hasPermission('toggle-status-coupon-system') && (
                        <Button variant="outline" size="sm" className="h-9" onClick={toggle} disabled={pending}>
                            {coupon.status ? <Pause className="size-4" /> : <Play className="size-4 rtl:-scale-x-100" />}
                            {pending ? t('Saving…') : coupon.status ? t('Pause') : t('Activate')}
                        </Button>
                    )}
                    {hasPermission('edit-coupon-system') && (
                        <Button size="sm" className="h-9" asChild>
                            <Link href={route('coupon-system.edit', coupon.id)}>
                                <Pencil className="size-4" />
                                {t('Edit')}
                            </Link>
                        </Button>
                    )}
                </>
            }
        />
    );

    const from = coupon.start_date ? f.date(localDate(coupon.start_date)) : null;
    const to = coupon.expiry_date ? f.date(localDate(coupon.expiry_date)) : null;

    const scheduleText = (() => {
        switch (state) {
            case 'paused':
                return t('Paused. Customers can’t use this code until you activate it.');
            case 'expired':
                return t('Ended on {{date}}.', { date: to });
            case 'scheduled':
                return t('Starts on {{date}}.', { date: from });
            default:
                if (daysLeft !== null && daysLeft >= 0) return daysLeft === 0 ? t('Running now. Ends today.') : t('Running now. Ends in {{count}} days.', { count: daysLeft });
                return t('Running now with no end date.');
        }
    })();

    return (
        <PageTemplate
            title={coupon.name}
            url="/coupon-system/show"
            header={header}
            width="narrow"
            breadcrumbs={[
                { title: t('Dashboard'), href: route('dashboard') },
                { title: t('Discounts'), href: route('coupon-system.index') },
                { title: coupon.name },
            ]}
        >
            <div className="space-y-5">
                {coupon.status && missingDates(coupon) ? (
                    <div role="status" className="bg-warning-soft text-warning-fg flex items-start gap-2 rounded-xl px-4 py-3 text-sm">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                        <span>{t('Checkout only accepts this code when it has both a start and an end date. Edit the discount to add them.')}</span>
                    </div>
                ) : null}

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <MetricCard label={t('Orders with this code')} value={stats ? f.number(stats.total_usage) : '—'} loading={!stats} hint={t('All time')} />
                    <MetricCard label={t('Sales from these orders')} value={stats ? f.money(stats.revenue ?? 0) : '—'} loading={!stats} hint={t('Excludes cancelled and refunded')} />
                    <MetricCard label={t('Discount given')} value={stats ? f.money(stats.discount_given ?? 0) : '—'} loading={!stats} hint={t('Total off customer orders')} />
                    <MetricCard
                        label={t('Customers')}
                        value={stats ? f.number(stats.unique_users) : '—'}
                        loading={!stats}
                        hint={stats?.recent_usage ? t('{{count}} uses in the last 30 days', { count: stats.recent_usage }) : t('No uses in the last 30 days')}
                    />
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                    <Panel title={t('What the customer gets')}>
                        <p className="text-2xl font-semibold tracking-tight">{valueLabel(coupon, f, t)}</p>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {coupon.type === 'percentage' ? t('Percentage off the order subtotal') : t('Fixed amount off the order subtotal')}
                            {coupon.type === 'percentage' && cap ? ` · ${t('up to {{amount}}', { amount: f.money(cap) })}` : ''}
                        </p>
                        {coupon.description ? <p className="mt-3 border-t pt-3 text-sm">{coupon.description}</p> : null}
                    </Panel>

                    <Panel title={t('Eligibility & limits')}>
                        <DescriptionList
                            items={[
                                { label: t('Minimum order'), value: min ? f.money(min) : t('No minimum') },
                                { label: t('Maximum discount'), value: cap ? f.money(cap) : t('No cap') },
                                { label: t('Total uses allowed'), value: coupon.use_limit_per_coupon ? f.number(coupon.use_limit_per_coupon) : t('Unlimited') },
                                { label: t('Uses per customer'), value: coupon.use_limit_per_user ? f.number(coupon.use_limit_per_user) : t('Unlimited') },
                            ]}
                        />
                    </Panel>

                    <Panel title={t('Schedule')}>
                        <p className="mb-3 text-sm">{scheduleText}</p>
                        <DescriptionList
                            items={[
                                { label: t('Starts'), value: from ?? t('Not set') },
                                { label: t('Ends'), value: to ?? t('Not set') },
                                { label: t('Created'), value: f.date(coupon.created_at) },
                                { label: t('Last updated'), value: f.date(coupon.updated_at) },
                            ]}
                        />
                    </Panel>

                    <Panel title={t('Usage & performance')}>
                        <UsageMeter used={used} limit={coupon.use_limit_per_coupon} />
                        <DescriptionList
                            className="mt-4"
                            items={[
                                { label: t('Average order value'), value: stats?.avg_order_value ? f.money(stats.avg_order_value) : '—' },
                                {
                                    label: t('Average discount per order'),
                                    value: stats && stats.total_usage > 0 ? f.money((stats.discount_given ?? 0) / stats.total_usage) : '—',
                                },
                                { label: t('Last used'), value: stats?.last_used_at ? f.relative(stats.last_used_at) : t('Never') },
                            ]}
                        />
                    </Panel>
                </div>

                <Panel title={t('Recent orders using this code')} flush>
                    {!stats ? (
                        <div className="space-y-2 px-4 pb-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : recentOrders.length === 0 ? (
                        <EmptyState
                            compact
                            icon={<ShoppingBag />}
                            title={t('No orders have used this code yet')}
                            description={t('Share the code with customers, for example on social media or in your store banner.')}
                            action={
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={route('coupon-system.index')}>{t('Back to discounts')}</Link>
                                </Button>
                            }
                        />
                    ) : (
                        <ul className="divide-y border-t" role="list">
                            {recentOrders.map((o) => {
                                const inner = (
                                    <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <bdi dir="ltr" className="font-medium tabular-nums">
                                                    #{o.order_number}
                                                </bdi>
                                                {o.status && <StatusBadge meta={orderStatusMeta(o.status)} />}
                                                {o.payment_status && <StatusBadge meta={paymentStatusMeta(o.payment_status)} className="hidden sm:inline-flex" />}
                                            </div>
                                            <div className="text-muted-foreground truncate text-xs">
                                                {o.customer_name} · {o.created_at ? f.date(o.created_at) : o.date}
                                            </div>
                                        </div>
                                        <div className="shrink-0 text-end">
                                            <div className="font-medium tabular-nums">{f.money(o.total)}</div>
                                            {o.coupon_discount ? (
                                                <div className="text-muted-foreground text-xs tabular-nums">{t('{{amount}} off', { amount: f.money(o.coupon_discount) })}</div>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                                return (
                                    <li key={o.id}>
                                        {canView ? (
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
                </Panel>
            </div>
        </PageTemplate>
    );
}
