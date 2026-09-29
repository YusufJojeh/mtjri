import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ArrowUpRight, ImageOff, Mail, Phone } from 'lucide-react';
import { PageTemplate } from '@/components/page-template';
import { DescriptionList, PageHeader, Panel, SectionLabel } from '@/components/ds/layout';
import { StatusBadge, ToneBadge } from '@/components/ds/status-badge';
import { Timeline, type TimelineEvent } from '@/components/ds/timeline';
import { orderStatusMeta, paymentStatusMeta } from '@/lib/commerce/status';
import { useCommerceFormat } from '@/hooks/use-commerce-format';
import { usePermissions } from '@/hooks/usePermissions';
import { getImageUrl } from '@/utils/image-helper';
import { orderIssue, paymentMethodLabel } from '@/components/orders/order-meta';
import { OrderStatusActions } from '@/components/orders/order-status-actions';

interface Address {
    name: string;
    street: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    country: string | null;
}

interface OrderItem {
    id: number;
    productId: number | null;
    name: string;
    sku: string | null;
    quantity: number;
    price: number;
    lineTotal: number;
    variants: Record<string, unknown> | unknown[] | null;
    image: string | null;
}

interface OrderShowProps {
    order: {
        id: number;
        orderNumber: string;
        status: string;
        paymentStatus: string;
        paymentMethod: string | null;
        paymentGateway: string | null;
        transactionId: string | null;
        customerId: number | null;
        customer: { name: string; email: string | null; phone: string | null };
        shippingAddress: Address;
        billingAddress: Address | null;
        items: OrderItem[];
        summary: { subtotal: number; shipping: number; tax: number; discount: number; couponCode: string | null; total: number };
        shippingMethod: string | null;
        trackingNumber: string | null;
        notes: string | null;
        createdAt: string | null;
        updatedAt: string | null;
        shippedAt: string | null;
        deliveredAt: string | null;
    };
}

function variantEntries(v: OrderItem['variants']): Array<[string, string]> {
    if (!v) return [];
    if (Array.isArray(v)) return v.map((x, i) => [String(i + 1), typeof x === 'object' ? JSON.stringify(x) : String(x)]);
    return Object.entries(v).map(([k, val]) => [k, typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)]);
}

function AddressBlock({ address, empty }: { address: Address | null; empty: string }) {
    const lines = address
        ? [address.name, address.street, [address.city, address.state, address.zip].filter(Boolean).join(', '), address.country].filter(
              (l) => l && String(l).trim(),
          )
        : [];
    if (!lines.length) return <p className="text-muted-foreground text-sm">{empty}</p>;
    return (
        <address className="text-sm leading-6 not-italic">
            {lines.map((l, i) => (
                <div key={i} className={i === 0 ? 'font-medium' : 'text-muted-foreground'}>
                    {l}
                </div>
            ))}
        </address>
    );
}

export default function ShowOrder({ order }: OrderShowProps) {
    const { t } = useTranslation();
    const fmt = useCommerceFormat();
    const { hasPermission } = usePermissions();
    const [actionError, setActionError] = useState<string | null>(null);

    const status = order.status;
    const payment = order.paymentStatus;
    const issue = orderIssue(order, t);
    const itemCount = order.items.reduce((n, i) => n + (i.quantity || 0), 0);
    const reached = (s: string) => {
        const flow = ['pending', 'processing', 'shipped', 'delivered'];
        return flow.indexOf(status) >= flow.indexOf(s);
    };

    // Timeline — real timestamps only. Steps without a recorded time show state, never a made-up date.
    const events: TimelineEvent[] = [];
    events.push({
        id: 'placed',
        title: t('Order placed'),
        time: order.createdAt ? <time dateTime={order.createdAt}>{fmt.dateTime(order.createdAt)}</time> : undefined,
        description: t('{{count}} items · {{total}}', { count: itemCount, total: fmt.money(order.summary.total) }),
        tone: 'info',
    });
    events.push(
        payment === 'paid'
            ? { id: 'payment', title: t('Payment received'), description: t('Current payment status'), tone: 'success' }
            : payment === 'failed'
              ? { id: 'payment', title: t('Payment failed'), description: t('Current payment status'), tone: 'danger' }
              : payment === 'refunded'
                ? { id: 'payment', title: t('Payment refunded'), description: t('Current payment status'), tone: 'neutral' }
                : { id: 'payment', title: t('Awaiting payment'), pending: true },
    );
    if (status === 'cancelled') {
        events.push({ id: 'cancelled', title: t('Order cancelled'), description: t('Current order status'), tone: 'neutral' });
    } else {
        events.push(
            reached('processing')
                ? { id: 'processing', title: t('Processing'), tone: 'info' }
                : { id: 'processing', title: t('Processing'), pending: true },
        );
        events.push(
            reached('shipped')
                ? {
                      id: 'shipped',
                      title: t('Shipped'),
                      tone: 'info',
                      time: order.shippedAt ? <time dateTime={order.shippedAt}>{fmt.dateTime(order.shippedAt)}</time> : undefined,
                      description: order.trackingNumber ? (
                          <span>
                              {t('Tracking')}: <bdi dir="ltr">{order.trackingNumber}</bdi>
                          </span>
                      ) : undefined,
                  }
                : { id: 'shipped', title: t('Shipped'), pending: true },
        );
        events.push(
            reached('delivered')
                ? {
                      id: 'delivered',
                      title: t('Delivered'),
                      tone: 'success',
                      time: order.deliveredAt ? <time dateTime={order.deliveredAt}>{fmt.dateTime(order.deliveredAt)}</time> : undefined,
                  }
                : { id: 'delivered', title: t('Delivered'), pending: true },
        );
    }

    const methodLabel = paymentMethodLabel(order.paymentMethod, t);
    const gatewayLabel = order.paymentGateway ? paymentMethodLabel(order.paymentGateway, t) : null;

    return (
        <PageTemplate
            title={t('Order {{number}}', { number: order.orderNumber })}
            url={route('orders.show', order.id)}
            breadcrumbs={[
                { title: t('Dashboard'), href: route('dashboard') },
                { title: t('Orders'), href: route('orders.index') },
                { title: order.orderNumber },
            ]}
            header={
                <PageHeader
                    back={{ href: route('orders.index'), label: t('Orders') }}
                    title={<bdi dir="ltr">{order.orderNumber}</bdi>}
                    meta={
                        <div className="flex flex-wrap items-center gap-1.5">
                            <StatusBadge meta={paymentStatusMeta(payment)} />
                            <StatusBadge meta={orderStatusMeta(status)} />
                        </div>
                    }
                    description={
                        order.createdAt ? (
                            <span>
                                {t('Placed {{date}}', { date: fmt.dateTime(order.createdAt) })}
                                <span className="text-muted-foreground/70"> · {fmt.relative(order.createdAt)}</span>
                            </span>
                        ) : undefined
                    }
                    actions={<OrderStatusActions order={order} onError={setActionError} />}
                />
            }
        >
            <div className="space-y-4">
                {actionError && (
                    <div role="alert" className="bg-danger-soft text-danger-fg flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                        <span>{actionError}</span>
                    </div>
                )}
                {issue && !actionError && (
                    <div className="flex">
                        <ToneBadge tone={issue.tone} icon={<AlertTriangle aria-hidden />} className="h-7 px-2.5">
                            {issue.label}
                        </ToneBadge>
                    </div>
                )}

                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Main column */}
                    <div className="min-w-0 space-y-4 lg:col-span-2">
                        <Panel title={t('Items')} description={t('{{count}} units', { count: itemCount })} flush>
                            <ul className="divide-y border-t">
                                {order.items.map((item) => {
                                    const variants = variantEntries(item.variants);
                                    return (
                                        <li key={item.id} className="flex gap-3 px-4 py-3 sm:px-5">
                                            <div className="bg-muted flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
                                                {item.image ? (
                                                    <img
                                                        src={getImageUrl(item.image)}
                                                        alt=""
                                                        className="size-full object-cover"
                                                        loading="lazy"
                                                        onError={(e) => {
                                                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <ImageOff className="text-muted-foreground size-4" aria-hidden />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-3">
                                                    <p className="min-w-0 text-sm font-medium break-words">{item.name}</p>
                                                    <p className="shrink-0 text-sm font-medium tabular-nums">{fmt.money(item.lineTotal)}</p>
                                                </div>
                                                <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                                                    {item.sku && (
                                                        <span>
                                                            {t('SKU')} <bdi dir="ltr">{item.sku}</bdi>
                                                        </span>
                                                    )}
                                                    <span className="tabular-nums">
                                                        {fmt.number(item.quantity)} × {fmt.money(item.price)}
                                                    </span>
                                                </div>
                                                {variants.length > 0 && (
                                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                                        {variants.map(([k, v]) => (
                                                            <span key={k} className="bg-muted rounded px-1.5 py-0.5 text-[11px]">
                                                                {k}: {v}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                            <dl className="bg-muted/30 space-y-1.5 border-t px-4 py-4 text-sm sm:px-5">
                                <div className="flex justify-between gap-4">
                                    <dt className="text-muted-foreground">{t('Subtotal')}</dt>
                                    <dd className="tabular-nums">{fmt.money(order.summary.subtotal)}</dd>
                                </div>
                                {order.summary.discount > 0 && (
                                    <div className="flex justify-between gap-4">
                                        <dt className="text-muted-foreground">
                                            {t('Discount')}
                                            {order.summary.couponCode && (
                                                <bdi dir="ltr" className="bg-muted text-foreground ms-2 rounded px-1.5 py-0.5 font-mono text-[11px]">
                                                    {order.summary.couponCode}
                                                </bdi>
                                            )}
                                        </dt>
                                        <dd className="text-success-fg tabular-nums">
                                            <bdi dir="ltr">−{fmt.money(order.summary.discount)}</bdi>
                                        </dd>
                                    </div>
                                )}
                                <div className="flex justify-between gap-4">
                                    <dt className="text-muted-foreground">{t('Shipping')}</dt>
                                    <dd className="tabular-nums">{fmt.money(order.summary.shipping)}</dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-muted-foreground">{t('Tax')}</dt>
                                    <dd className="tabular-nums">{fmt.money(order.summary.tax)}</dd>
                                </div>
                                <div className="flex justify-between gap-4 border-t pt-2.5 text-base font-semibold">
                                    <dt>{t('Total')}</dt>
                                    <dd className="tabular-nums">{fmt.money(order.summary.total)}</dd>
                                </div>
                            </dl>
                        </Panel>

                        <Panel title={t('Timeline')} description={t('Times are shown only where the store recorded them.')}>
                            <Timeline events={events} />
                        </Panel>
                    </div>

                    {/* Side column */}
                    <div className="min-w-0 space-y-4">
                        <Panel
                            title={t('Customer')}
                            action={
                                order.customerId && hasPermission('view-customers') ? (
                                    <Link
                                        href={route('customers.show', order.customerId)}
                                        className="text-primary inline-flex items-center gap-1 text-xs font-medium hover:underline"
                                    >
                                        {t('View profile')}
                                        <ArrowUpRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
                                    </Link>
                                ) : undefined
                            }
                        >
                            <div className="space-y-1.5 text-sm">
                                <p className="font-medium">{order.customer.name || t('Guest')}</p>
                                {order.customer.email && (
                                    <a href={`mailto:${order.customer.email}`} className="text-muted-foreground hover:text-foreground flex min-w-0 items-center gap-2">
                                        <Mail className="size-3.5 shrink-0" aria-hidden />
                                        <bdi className="truncate">{order.customer.email}</bdi>
                                    </a>
                                )}
                                {order.customer.phone && (
                                    <a href={`tel:${order.customer.phone}`} className="text-muted-foreground hover:text-foreground flex items-center gap-2">
                                        <Phone className="size-3.5 shrink-0" aria-hidden />
                                        <bdi dir="ltr">{order.customer.phone}</bdi>
                                    </a>
                                )}
                                {!order.customerId && <p className="text-muted-foreground text-xs">{t('Guest checkout — no customer profile linked.')}</p>}
                            </div>
                        </Panel>

                        <Panel title={t('Addresses')}>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <SectionLabel>{t('Shipping address')}</SectionLabel>
                                    <AddressBlock address={order.shippingAddress} empty={t('No shipping address')} />
                                </div>
                                <div className="space-y-1.5 border-t pt-4">
                                    <SectionLabel>{t('Billing address')}</SectionLabel>
                                    <AddressBlock address={order.billingAddress} empty={t('No billing address')} />
                                </div>
                            </div>
                        </Panel>

                        <Panel title={t('Payment')}>
                            <DescriptionList
                                items={[
                                    { label: t('Status'), value: <StatusBadge meta={paymentStatusMeta(payment)} /> },
                                    { label: t('Method'), value: methodLabel || '—' },
                                    { label: t('Gateway'), value: gatewayLabel, hidden: !gatewayLabel },
                                    {
                                        label: t('Transaction ID'),
                                        value: <bdi dir="ltr" className="font-mono text-xs break-all">{order.transactionId}</bdi>,
                                        hidden: !order.transactionId,
                                    },
                                ]}
                            />
                        </Panel>

                        <Panel title={t('Shipping')}>
                            <DescriptionList
                                items={[
                                    { label: t('Method'), value: order.shippingMethod || '—' },
                                    {
                                        label: t('Tracking number'),
                                        value: order.trackingNumber ? (
                                            <bdi dir="ltr" className="font-mono text-xs break-all">
                                                {order.trackingNumber}
                                            </bdi>
                                        ) : (
                                            <span className="text-muted-foreground font-normal">{t('Not added')}</span>
                                        ),
                                    },
                                ]}
                            />
                        </Panel>

                        <Panel title={t('Notes')}>
                            {order.notes ? (
                                <p className="text-sm whitespace-pre-line break-words">{order.notes}</p>
                            ) : (
                                <p className="text-muted-foreground text-sm">
                                    {t('No notes on this order.')}{' '}
                                    {hasPermission('edit-orders') && (
                                        <Link href={route('orders.edit', order.id)} className="text-primary font-medium hover:underline">
                                            {t('Add a note')}
                                        </Link>
                                    )}
                                </p>
                            )}
                        </Panel>
                    </div>
                </div>
            </div>
        </PageTemplate>
    );
}
