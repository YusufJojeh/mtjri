import { FormEventHandler } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { PageTemplate } from '@/components/page-template';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DescriptionList, PageHeader, Panel } from '@/components/ds/layout';
import { StatusBadge } from '@/components/ds/status-badge';
import { orderStatusMeta, paymentStatusMeta } from '@/lib/commerce/status';
import { useCommerceFormat } from '@/hooks/use-commerce-format';
import { usePermissions } from '@/hooks/usePermissions';
import { ORDER_STATUS_VALUES, PAYMENT_STATUS_VALUES, paymentMethodLabel } from '@/components/orders/order-meta';

interface EditOrderProps {
    order: {
        id: number;
        orderNumber: string;
        status: string;
        paymentStatus: string;
        paymentMethod: string;
        customer: { id: number | null; name: string; email: string; phone: string };
        shippingAddress: { address: string; city: string; state: string; postalCode: string; country: string };
        items: Array<{ id: number; productId: number; name: string; quantity: number; price: number; variants?: Record<string, string> }>;
        summary: { subtotal: number; shipping: number; tax: number; total: number };
        shippingMethodId: number | null;
        trackingNumber?: string;
        notes?: string;
    };
    customers: Array<{ id: number; name: string; email: string }>;
    products: Array<{ id: number; name: string; price: number; variants: Array<{ name: string; values: string[] }> | null }>;
    shippingMethods: Array<{ id: number; name: string; cost: number }>;
}

type ItemRow = EditOrderProps['order']['items'][number] & { variants: Record<string, string> };

const selectCls =
    'border-input bg-background focus-visible:ring-ring/40 h-9 w-full rounded-md border px-2.5 text-sm outline-none focus-visible:ring-[3px] disabled:opacity-60';

export default function EditOrder({ order, products, shippingMethods }: EditOrderProps) {
    const { t } = useTranslation();
    const fmt = useCommerceFormat();
    const { hasPermission } = usePermissions();
    const canEdit = hasPermission('edit-orders');

    // Same payload as before: status, payment_status, tracking_number, notes, items[] (id + variants).
    const form = useForm<{
        status: string;
        payment_status: string;
        tracking_number: string;
        notes: string;
        items: ItemRow[];
    }>({
        status: order.status,
        payment_status: order.paymentStatus,
        tracking_number: order.trackingNumber || '',
        notes: order.notes || '',
        items: (Array.isArray(order.items) ? order.items : []).map((item) => ({ ...item, variants: item.variants || {} })),
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        form.put(route('orders.update', order.id), { preserveScroll: true });
    };

    const setVariant = (index: number, name: string, value: string) => {
        const items = form.data.items.map((it, i) => (i === index ? { ...it, variants: { ...it.variants, [name]: value } } : it));
        form.setData('items', items);
    };

    const shippingMethod = shippingMethods.find((m) => m.id === order.shippingMethodId);
    const address = order.shippingAddress;
    const addressLines = [address.address, [address.city, address.state, address.postalCode].filter(Boolean).join(', '), address.country].filter(
        (l) => l && String(l).trim(),
    );
    const errorList = Object.values(form.errors);

    return (
        <PageTemplate
            title={t('Edit order {{number}}', { number: order.orderNumber })}
            url={route('orders.edit', order.id)}
            width="narrow"
            breadcrumbs={[
                { title: t('Dashboard'), href: route('dashboard') },
                { title: t('Orders'), href: route('orders.index') },
                { title: order.orderNumber, href: route('orders.show', order.id) },
                { title: t('Edit') },
            ]}
            header={
                <PageHeader
                    back={{ href: route('orders.show', order.id), label: t('Back to order') }}
                    title={
                        <span>
                            {t('Edit order')} <bdi dir="ltr">{order.orderNumber}</bdi>
                        </span>
                    }
                    meta={
                        <div className="flex flex-wrap items-center gap-1.5">
                            <StatusBadge meta={paymentStatusMeta(order.paymentStatus)} />
                            <StatusBadge meta={orderStatusMeta(order.status)} />
                        </div>
                    }
                />
            }
        >
            <form onSubmit={submit} className="space-y-4 pb-20 md:pb-0">
                {errorList.length > 0 && (
                    <div role="alert" className="bg-danger-soft text-danger-fg rounded-lg px-3 py-2.5 text-sm">
                        <p className="font-medium">{t('Please fix the following:')}</p>
                        <ul className="mt-1 list-disc ps-5">
                            {errorList.map((e, i) => (
                                <li key={i}>{e}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="min-w-0 space-y-4 lg:col-span-2">
                        <Panel title={t('Status')} description={t('Changes are saved when you select Save changes.')}>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="order_status">{t('Fulfillment status')}</Label>
                                    <select
                                        id="order_status"
                                        className={selectCls}
                                        value={form.data.status}
                                        onChange={(e) => form.setData('status', e.target.value)}
                                        disabled={!canEdit}
                                    >
                                        {ORDER_STATUS_VALUES.map((v) => (
                                            <option key={v} value={v}>
                                                {t(orderStatusMeta(v).label)}
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.status && <p className="text-danger-fg text-xs">{form.errors.status}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="payment_status">{t('Payment status')}</Label>
                                    <select
                                        id="payment_status"
                                        className={selectCls}
                                        value={form.data.payment_status}
                                        onChange={(e) => form.setData('payment_status', e.target.value)}
                                        disabled={!canEdit}
                                    >
                                        {PAYMENT_STATUS_VALUES.map((v) => (
                                            <option key={v} value={v}>
                                                {t(paymentStatusMeta(v).label)}
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.payment_status && <p className="text-danger-fg text-xs">{form.errors.payment_status}</p>}
                                    <p className="text-muted-foreground text-xs">{t('Recording a payment status does not charge or refund the customer.')}</p>
                                </div>
                            </div>
                        </Panel>

                        <Panel title={t('Shipping')}>
                            <div className="space-y-4">
                                <DescriptionList items={[{ label: t('Shipping method'), value: shippingMethod?.name || '—' }]} />
                                <div className="space-y-1.5">
                                    <Label htmlFor="tracking_number">{t('Tracking number')}</Label>
                                    <Input
                                        id="tracking_number"
                                        dir="ltr"
                                        value={form.data.tracking_number}
                                        onChange={(e) => form.setData('tracking_number', e.target.value)}
                                        maxLength={255}
                                        disabled={!canEdit}
                                    />
                                    {form.errors.tracking_number && <p className="text-danger-fg text-xs">{form.errors.tracking_number}</p>}
                                </div>
                            </div>
                        </Panel>

                        <Panel title={t('Items')} description={t('Quantities and prices are fixed after checkout. You can adjust variant options.')} flush>
                            <ul className="divide-y border-t">
                                {form.data.items.map((item, index) => {
                                    const product = products.find((p) => p.id === item.productId);
                                    const variants = product?.variants || [];
                                    return (
                                        <li key={item.id} className="space-y-2 px-4 py-3 sm:px-5">
                                            <div className="flex items-start justify-between gap-3 text-sm">
                                                <div className="min-w-0">
                                                    <p className="font-medium break-words">{item.name || product?.name}</p>
                                                    <p className="text-muted-foreground text-xs tabular-nums">
                                                        {fmt.number(item.quantity)} × {fmt.money(item.price)}
                                                    </p>
                                                </div>
                                                <p className="shrink-0 font-medium tabular-nums">{fmt.money(item.quantity * item.price)}</p>
                                            </div>
                                            {variants.length > 0 && (
                                                <div className="grid gap-2 sm:grid-cols-2">
                                                    {variants.map((variant) => {
                                                        const id = `item-${item.id}-${variant.name}`;
                                                        return (
                                                            <div key={variant.name} className="space-y-1">
                                                                <Label htmlFor={id} className="text-xs">
                                                                    {variant.name}
                                                                </Label>
                                                                <select
                                                                    id={id}
                                                                    className={selectCls}
                                                                    value={item.variants?.[variant.name] ?? ''}
                                                                    onChange={(e) => setVariant(index, variant.name, e.target.value)}
                                                                    disabled={!canEdit}
                                                                >
                                                                    <option value="" disabled>
                                                                        {t('Select {{name}}', { name: variant.name })}
                                                                    </option>
                                                                    {variant.values.map((v) => (
                                                                        <option key={v} value={v}>
                                                                            {v}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </Panel>

                        <Panel title={t('Notes')}>
                            <Label htmlFor="order_notes" className="sr-only">
                                {t('Order notes')}
                            </Label>
                            <Textarea
                                id="order_notes"
                                rows={4}
                                maxLength={1000}
                                value={form.data.notes}
                                onChange={(e) => form.setData('notes', e.target.value)}
                                placeholder={t('Internal notes about this order')}
                                disabled={!canEdit}
                            />
                            {form.errors.notes && <p className="text-danger-fg mt-1 text-xs">{form.errors.notes}</p>}
                        </Panel>
                    </div>

                    <div className="min-w-0 space-y-4">
                        <Panel title={t('Customer')} description={t('Captured at checkout')}>
                            <div className="space-y-1 text-sm">
                                <p className="font-medium">{order.customer.name?.trim() || t('Guest')}</p>
                                {order.customer.email && (
                                    <p className="text-muted-foreground truncate">
                                        <bdi>{order.customer.email}</bdi>
                                    </p>
                                )}
                                {order.customer.phone && (
                                    <p className="text-muted-foreground">
                                        <bdi dir="ltr">{order.customer.phone}</bdi>
                                    </p>
                                )}
                            </div>
                            {addressLines.length > 0 && (
                                <address className="text-muted-foreground mt-3 border-t pt-3 text-sm leading-6 not-italic">
                                    {addressLines.map((l, i) => (
                                        <div key={i}>{l}</div>
                                    ))}
                                </address>
                            )}
                        </Panel>
                        <Panel title={t('Payment')}>
                            <DescriptionList
                                items={[
                                    { label: t('Method'), value: paymentMethodLabel(order.paymentMethod, t) || '—' },
                                    { label: t('Subtotal'), value: <span className="tabular-nums">{fmt.money(order.summary.subtotal)}</span> },
                                    { label: t('Shipping'), value: <span className="tabular-nums">{fmt.money(order.summary.shipping)}</span> },
                                    { label: t('Tax'), value: <span className="tabular-nums">{fmt.money(order.summary.tax)}</span> },
                                    { label: t('Total'), value: <span className="font-semibold tabular-nums">{fmt.money(order.summary.total)}</span> },
                                ]}
                            />
                        </Panel>
                    </div>
                </div>

                {canEdit && (
                    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky bottom-14 z-10 -mx-4 flex items-center justify-end gap-2 border-t px-4 py-3 backdrop-blur md:bottom-0 md:mx-0 md:rounded-xl md:border">
                        <Button variant="outline" asChild>
                            <Link href={route('orders.show', order.id)}>{t('Discard')}</Link>
                        </Button>
                        <Button type="submit" disabled={form.processing || !form.isDirty}>
                            {form.processing && <Loader2 className="animate-spin" aria-hidden />}
                            {t('Save changes')}
                        </Button>
                    </div>
                )}
            </form>
        </PageTemplate>
    );
}
