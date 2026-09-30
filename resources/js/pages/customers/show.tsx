import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Check, Loader2, Minus, Pencil, ShoppingBag, Trash2 } from 'lucide-react';
import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DescriptionList, EmptyState, MetricCard, PageHeader, Panel, SectionLabel } from '@/components/ds/layout';
import { AskTijraaButton } from '@/components/tijraa/ask-button';
import { DataTable, type Column } from '@/components/ds/data-table';
import { StatusBadge, ToneBadge } from '@/components/ds/status-badge';
import { Timeline, type TimelineEvent } from '@/components/ds/timeline';
import { ACTIVE_STATUS, orderStatusMeta, paymentStatusMeta } from '@/lib/commerce/status';
import { useCommerceFormat } from '@/hooks/use-commerce-format';
import { usePermissions } from '@/hooks/usePermissions';
import { CustomerAvatar, customerGroupLabel } from '@/components/customers/customer-meta';

interface Address {
    address?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
}

interface OrderRow {
    id: number;
    order_number: string;
    total: number;
    status: string;
    payment_status: string;
    items_count: number;
    created_at: string | null;
}

interface ShowProps {
    customer: {
        id: number;
        first_name: string | null;
        last_name: string | null;
        full_name: string;
        initials: string;
        email: string | null;
        phone: string | null;
        avatar: string | null;
        is_active: boolean;
        customer_group: string | null;
        preferred_language: string | null;
        date_of_birth: string | null;
        gender: string | null;
        notes: string | null;
        email_marketing: boolean;
        sms_notifications: boolean;
        order_updates: boolean;
        created_at: string | null;
        total_orders: number;
        total_spent: number;
        avg_order_value: number;
        paid_orders: number;
        last_order_date: string | null;
        pending_orders: number;
    };
    billingAddress: Address | null;
    shippingAddress: Address | null;
    recentOrders: OrderRow[];
    [key: string]: unknown;
}

const COUNTRY_LABELS: Record<string, string> = { us: 'United States', ca: 'Canada', uk: 'United Kingdom', au: 'Australia' };

export default function ShowCustomer() {
    const { t } = useTranslation();
    const fmt = useCommerceFormat();
    const { hasPermission } = usePermissions();
    const { customer, billingAddress, shippingAddress, recentOrders = [] } = usePage<ShowProps>().props;
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const name = customer.full_name?.trim() || t('Unnamed customer');
    const canViewOrders = hasPermission('view-orders');

    const countryLabel = (c?: string | null) => {
        if (!c) return '';
        const key = c.toLowerCase();
        if (key === 'us') return t('United States');
        if (key === 'ca') return t('Canada');
        if (key === 'uk') return t('United Kingdom');
        if (key === 'au') return t('Australia');
        return COUNTRY_LABELS[key] ?? c;
    };

    const genderLabel = (g: string | null) =>
        g === 'male' ? t('Male') : g === 'female' ? t('Female') : g === 'other' ? t('Other') : g === 'prefer_not_to_say' ? t('Prefer not to say') : null;

    const languageLabel = (l: string | null) =>
        l === 'ar' ? t('Arabic') : l === 'en' ? t('English') : l === 'es' ? t('Spanish') : l === 'fr' ? t('French') : l === 'de' ? t('German') : l;

    const addressLines = (a: Address | null) =>
        a ? [a.address, [a.city, a.state, a.postal_code].filter(Boolean).join(', '), countryLabel(a.country)].filter((l) => l && String(l).trim()) : [];

    const doDelete = () => {
        setDeleteError(null);
        router.delete(route('customers.destroy', customer.id), {
            onStart: () => setDeleting(true),
            onFinish: () => setDeleting(false),
            onError: () => setDeleteError(t('The customer could not be deleted. Please try again.')),
        });
    };

    // Real events only: account creation and each order placed.
    const events: TimelineEvent[] = [
        ...recentOrders.slice(0, 10).map<TimelineEvent>((o) => ({
            id: `order-${o.id}`,
            title: (
                <span>
                    {t('Placed order')}{' '}
                    {canViewOrders ? (
                        <Link href={route('orders.show', o.id)} className="text-primary hover:underline">
                            <bdi dir="ltr">{o.order_number}</bdi>
                        </Link>
                    ) : (
                        <bdi dir="ltr">{o.order_number}</bdi>
                    )}
                </span>
            ),
            time: o.created_at ? <time dateTime={o.created_at}>{fmt.dateTime(o.created_at)}</time> : undefined,
            description: (
                <span className="flex flex-wrap items-center gap-1.5">
                    <span className="tabular-nums">{fmt.money(o.total)}</span>
                    <StatusBadge meta={paymentStatusMeta(o.payment_status)} />
                    <StatusBadge meta={orderStatusMeta(o.status)} />
                </span>
            ),
            tone: orderStatusMeta(o.status).tone,
        })),
        ...(customer.created_at
            ? [
                  {
                      id: 'created',
                      title: t('Customer account created'),
                      time: <time dateTime={customer.created_at}>{fmt.dateTime(customer.created_at)}</time>,
                      tone: 'neutral' as const,
                  },
              ]
            : []),
    ];

    const orderColumns: Column<OrderRow>[] = [
        {
            key: 'number',
            header: t('Order'),
            cell: (o) => (
                <span dir="ltr" className="font-medium whitespace-nowrap">
                    {o.order_number}
                </span>
            ),
        },
        {
            key: 'date',
            header: t('Date'),
            cell: (o) =>
                o.created_at ? (
                    <time dateTime={o.created_at} title={fmt.dateTime(o.created_at)} className="text-muted-foreground whitespace-nowrap">
                        {fmt.date(o.created_at)}
                    </time>
                ) : null,
        },
        { key: 'payment', header: t('Payment'), cell: (o) => <StatusBadge meta={paymentStatusMeta(o.payment_status)} /> },
        { key: 'status', header: t('Fulfillment'), hideBelow: 'lg', cell: (o) => <StatusBadge meta={orderStatusMeta(o.status)} /> },
        { key: 'total', header: t('Total'), align: 'end', cell: (o) => <span className="font-medium whitespace-nowrap tabular-nums">{fmt.money(o.total)}</span> },
    ];

    const orderCard = (o: OrderRow) => (
        <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
                <span dir="ltr" className="truncate text-sm font-semibold">
                    {o.order_number}
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">{fmt.money(o.total)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
                {o.created_at && <span className="text-muted-foreground me-1 text-xs">{fmt.date(o.created_at)}</span>}
                <StatusBadge meta={paymentStatusMeta(o.payment_status)} />
                <StatusBadge meta={orderStatusMeta(o.status)} />
            </div>
        </div>
    );

    const pref = (on: boolean) =>
        on ? (
            <ToneBadge tone="success" icon={<Check aria-hidden />}>
                {t('Opted in')}
            </ToneBadge>
        ) : (
            <ToneBadge icon={<Minus aria-hidden />}>{t('Not opted in')}</ToneBadge>
        );

    const billing = addressLines(billingAddress);
    const shipping = addressLines(shippingAddress);

    return (
        <PageTemplate
            title={name}
            url={route('customers.show', customer.id)}
            breadcrumbs={[
                { title: t('Dashboard'), href: route('dashboard') },
                { title: t('Customers'), href: route('customers.index') },
                { title: name },
            ]}
            header={
                <div className="flex flex-col gap-3">
                    <PageHeader
                        back={{ href: route('customers.index'), label: t('Customers') }}
                        title={
                            <span className="flex min-w-0 items-center gap-3">
                                <CustomerAvatar initials={customer.initials} avatar={customer.avatar} size="lg" />
                                <span className="truncate">{name}</span>
                            </span>
                        }
                        meta={
                            <div className="flex flex-wrap items-center gap-1.5">
                                <StatusBadge meta={customer.is_active ? ACTIVE_STATUS.active : { ...ACTIVE_STATUS.inactive, label: 'Inactive' }} />
                                {customer.customer_group && <ToneBadge>{customerGroupLabel(customer.customer_group, t)}</ToneBadge>}
                            </div>
                        }
                        description={
                            <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                {customer.email && (
                                    <a href={`mailto:${customer.email}`} className="hover:text-foreground">
                                        <bdi>{customer.email}</bdi>
                                    </a>
                                )}
                                {customer.phone && (
                                    <a href={`tel:${customer.phone}`} className="hover:text-foreground">
                                        <bdi dir="ltr">{customer.phone}</bdi>
                                    </a>
                                )}
                                {customer.created_at && <span>{t('Customer since {{date}}', { date: fmt.date(customer.created_at) })}</span>}
                            </span>
                        }
                        actions={
                            <>
                                <AskTijraaButton type="customer" id={customer.id} className="h-9" />
                                {hasPermission('delete-customers') && (
                                    <Button variant="outline" size="sm" className="text-danger-fg h-9" onClick={() => setConfirmDelete(true)}>
                                        <Trash2 aria-hidden />
                                        {t('Delete')}
                                    </Button>
                                )}
                                {hasPermission('edit-customers') && (
                                    <Button size="sm" className="h-9" asChild>
                                        <Link href={route('customers.edit', customer.id)}>
                                            <Pencil aria-hidden />
                                            {t('Edit customer')}
                                        </Link>
                                    </Button>
                                )}
                            </>
                        }
                    />
                </div>
            }
        >
            <div className="space-y-4">
                {deleteError && (
                    <div role="alert" className="bg-danger-soft text-danger-fg rounded-lg px-3 py-2.5 text-sm">
                        {deleteError}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <MetricCard
                        label={t('Orders')}
                        value={fmt.number(customer.total_orders)}
                        hint={customer.pending_orders > 0 ? t('{{count}} pending', { count: customer.pending_orders }) : undefined}
                        emphasis={customer.pending_orders > 0 ? 'warning' : 'default'}
                    />
                    <MetricCard label={t('Lifetime spend')} value={fmt.money(customer.total_spent)} hint={t('{{count}} paid orders', { count: customer.paid_orders })} />
                    <MetricCard
                        label={t('Average order value')}
                        value={customer.paid_orders > 0 ? fmt.money(customer.avg_order_value) : '—'}
                        hint={customer.paid_orders > 0 ? t('Paid orders only') : t('No paid orders yet')}
                    />
                    <MetricCard
                        label={t('Last order')}
                        value={customer.last_order_date ? fmt.relative(customer.last_order_date) : '—'}
                        hint={customer.last_order_date ? fmt.date(customer.last_order_date) : t('No orders yet')}
                    />
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="min-w-0 space-y-4 lg:col-span-2">
                        <Panel
                            title={t('Orders')}
                            description={recentOrders.length ? t('{{count}} orders, newest first', { count: recentOrders.length }) : undefined}
                            flush
                            className="overflow-hidden"
                        >
                            <div className="border-t">
                                <DataTable
                                    rows={recentOrders}
                                    columns={orderColumns}
                                    rowKey={(o) => o.id}
                                    rowHref={canViewOrders ? (o) => route('orders.show', o.id) : undefined}
                                    mobileCard={orderCard}
                                    caption={t('Orders')}
                                    empty={
                                        <EmptyState
                                            compact
                                            icon={<ShoppingBag />}
                                            title={t('No orders yet')}
                                            description={t('Orders this customer places will appear here.')}
                                            action={
                                                hasPermission('view-products') ? (
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={route('products.index')}>{t('Review your products')}</Link>
                                                    </Button>
                                                ) : undefined
                                            }
                                        />
                                    }
                                />
                            </div>
                        </Panel>

                        <Panel title={t('Activity')} description={t('Account and order events recorded by your store.')}>
                            <Timeline events={events} />
                        </Panel>
                    </div>

                    <div className="min-w-0 space-y-4">
                        <Panel title={t('Profile')}>
                            <DescriptionList
                                items={[
                                    { label: t('Email'), value: customer.email ? <bdi className="break-all">{customer.email}</bdi> : '—' },
                                    { label: t('Phone'), value: customer.phone ? <bdi dir="ltr">{customer.phone}</bdi> : '—' },
                                    { label: t('Date of birth'), value: fmt.date(customer.date_of_birth), hidden: !customer.date_of_birth },
                                    { label: t('Gender'), value: genderLabel(customer.gender), hidden: !genderLabel(customer.gender) },
                                    { label: t('Language'), value: languageLabel(customer.preferred_language), hidden: !customer.preferred_language },
                                    { label: t('Group'), value: customerGroupLabel(customer.customer_group, t), hidden: !customer.customer_group },
                                ]}
                            />
                        </Panel>

                        <Panel title={t('Addresses')}>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <SectionLabel>{t('Billing address')}</SectionLabel>
                                    {billing.length ? (
                                        <address className="text-sm leading-6 not-italic">
                                            {billing.map((l, i) => (
                                                <div key={i} className={i === 0 ? '' : 'text-muted-foreground'}>
                                                    {l}
                                                </div>
                                            ))}
                                        </address>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">{t('No billing address')}</p>
                                    )}
                                </div>
                                <div className="space-y-1.5 border-t pt-4">
                                    <SectionLabel>{t('Shipping address')}</SectionLabel>
                                    {shipping.length ? (
                                        <address className="text-sm leading-6 not-italic">
                                            {shipping.map((l, i) => (
                                                <div key={i} className={i === 0 ? '' : 'text-muted-foreground'}>
                                                    {l}
                                                </div>
                                            ))}
                                        </address>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">{t('No shipping address')}</p>
                                    )}
                                </div>
                            </div>
                        </Panel>

                        <Panel title={t('Communication preferences')}>
                            <DescriptionList
                                items={[
                                    { label: t('Email marketing'), value: pref(!!customer.email_marketing) },
                                    { label: t('SMS notifications'), value: pref(!!customer.sms_notifications) },
                                    { label: t('Order updates'), value: pref(!!customer.order_updates) },
                                ]}
                            />
                        </Panel>

                        <Panel title={t('Notes')}>
                            {customer.notes ? (
                                <p className="text-sm whitespace-pre-line break-words">{customer.notes}</p>
                            ) : (
                                <p className="text-muted-foreground text-sm">
                                    {t('No notes yet.')}{' '}
                                    {hasPermission('edit-customers') && (
                                        <Link href={route('customers.edit', customer.id)} className="text-primary font-medium hover:underline">
                                            {t('Add a note')}
                                        </Link>
                                    )}
                                </p>
                            )}
                        </Panel>
                    </div>
                </div>
            </div>

            <Dialog open={confirmDelete} onOpenChange={(o) => !deleting && setConfirmDelete(o)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('Delete this customer?')}</DialogTitle>
                        <DialogDescription>
                            {t('{{name}} will be removed from your customer list. Their past orders are kept. This action cannot be undone.', { name })}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                            {t('Cancel')}
                        </Button>
                        <Button variant="destructive" onClick={doDelete} disabled={deleting}>
                            {deleting && <Loader2 className="animate-spin" aria-hidden />}
                            {t('Delete customer')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageTemplate>
    );
}
