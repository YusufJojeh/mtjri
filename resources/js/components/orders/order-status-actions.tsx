import { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Loader2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePermissions } from '@/hooks/usePermissions';

export interface StatusActionOrder {
    id: number;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    trackingNumber?: string | null;
    notes?: string | null;
}

type ActionKey = 'processing' | 'ship' | 'deliver' | 'paid' | 'refund' | 'cancel' | 'reopen';
type MenuOption = { key: ActionKey; label: string; show: boolean; run: () => void };
type DialogKind = 'ship' | 'paid' | 'refund' | 'cancel' | 'delete' | null;

/**
 * Operational status changes for an order. Submits the full payload expected by
 * the existing `orders.update` route and lets the server response (redirect back
 * to the order) drive the UI – nothing is changed optimistically.
 */
export function OrderStatusActions({ order, onError }: { order: StatusActionOrder; onError: (message: string | null) => void }) {
    const { t } = useTranslation();
    const { hasPermission } = usePermissions();
    const [busy, setBusy] = useState<ActionKey | 'delete' | null>(null);
    const [dialog, setDialog] = useState<DialogKind>(null);
    const [tracking, setTracking] = useState(order.trackingNumber ?? '');

    const canEdit = hasPermission('edit-orders');
    const canDelete = hasPermission('delete-orders');
    const status = order.status;
    const payment = order.paymentStatus;
    const isCancelled = status === 'cancelled';

    const submit = (key: ActionKey, patch: { status?: string; payment_status?: string; tracking_number?: string | null }) => {
        onError(null);
        const payload = {
            status: patch.status ?? status,
            payment_status: patch.payment_status ?? payment,
            // Preserve fields that this action does not change (update() nulls missing ones).
            tracking_number: patch.tracking_number !== undefined ? patch.tracking_number : (order.trackingNumber ?? null),
            notes: order.notes ?? null,
        };
        router.put(route('orders.update', order.id), payload, {
            preserveScroll: true,
            onStart: () => setBusy(key),
            onFinish: () => setBusy(null),
            onSuccess: () => setDialog(null),
            onError: (errors) => {
                const first = Object.values(errors)[0];
                onError(first ? String(first) : t('The order could not be updated. Please try again.'));
                setDialog(null);
            },
        });
    };

    const destroy = () => {
        onError(null);
        router.delete(route('orders.destroy', order.id), {
            onStart: () => setBusy('delete'),
            onFinish: () => setBusy(null),
            onError: () => {
                onError(t('The order could not be deleted. Please try again.'));
                setDialog(null);
            },
        });
    };

    const openShip = () => {
        setTracking(order.trackingNumber ?? '');
        setDialog('ship');
    };

    // The single most useful next step for this order.
    const primary: { key: ActionKey; label: string; run: () => void } | null = !canEdit
        ? null
        : status === 'pending'
          ? { key: 'processing', label: t('Mark as processing'), run: () => submit('processing', { status: 'processing' }) }
          : status === 'processing'
            ? { key: 'ship', label: t('Mark as shipped'), run: openShip }
            : status === 'shipped'
              ? { key: 'deliver', label: t('Mark as delivered'), run: () => submit('deliver', { status: 'delivered' }) }
              : null;

    const statusCandidates: MenuOption[] = [
        { key: 'processing', label: t('Mark as processing'), show: status === 'pending', run: () => submit('processing', { status: 'processing' }) },
        { key: 'ship', label: t('Mark as shipped'), show: status === 'pending' || status === 'processing', run: openShip },
        { key: 'deliver', label: t('Mark as delivered'), show: status === 'shipped', run: () => submit('deliver', { status: 'delivered' }) },
        { key: 'reopen', label: t('Reopen as pending'), show: isCancelled, run: () => submit('reopen', { status: 'pending' }) },
    ];
    const statusOptions = statusCandidates.filter((o) => o.show && o.key !== primary?.key);

    const paymentCandidates: MenuOption[] = [
        { key: 'paid', label: t('Mark as paid'), show: payment === 'pending' || payment === 'failed', run: () => setDialog('paid') },
        { key: 'refund', label: t('Mark as refunded'), show: payment === 'paid', run: () => setDialog('refund') },
    ];
    const paymentOptions = paymentCandidates.filter((o) => o.show);

    const canCancel = canEdit && !isCancelled && status !== 'delivered';
    const hasMenu = canEdit || canDelete;

    return (
        <>
            {primary && (
                <Button size="sm" className="h-9" onClick={primary.run} disabled={busy !== null}>
                    {busy === primary.key && <Loader2 className="animate-spin" aria-hidden />}
                    {primary.label}
                </Button>
            )}
            {hasMenu && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9" disabled={busy !== null}>
                            {busy && busy !== primary?.key ? <Loader2 className="animate-spin" aria-hidden /> : <MoreHorizontal aria-hidden />}
                            {canEdit ? t('Update status') : t('More')}
                            <ChevronDown className="size-3.5 opacity-60" aria-hidden />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-52">
                        {canEdit && statusOptions.length > 0 && (
                            <>
                                <DropdownMenuLabel className="text-muted-foreground text-xs font-medium">{t('Fulfillment')}</DropdownMenuLabel>
                                {statusOptions.map((o) => (
                                    <DropdownMenuItem key={o.key} onSelect={o.run}>
                                        {o.label}
                                    </DropdownMenuItem>
                                ))}
                            </>
                        )}
                        {canEdit && paymentOptions.length > 0 && (
                            <>
                                {statusOptions.length > 0 && <DropdownMenuSeparator />}
                                <DropdownMenuLabel className="text-muted-foreground text-xs font-medium">{t('Payment')}</DropdownMenuLabel>
                                {paymentOptions.map((o) => (
                                    <DropdownMenuItem key={o.key} onSelect={o.run}>
                                        {o.label}
                                    </DropdownMenuItem>
                                ))}
                            </>
                        )}
                        {canEdit && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href={route('orders.edit', order.id)}>
                                        <Pencil aria-hidden />
                                        {t('Edit order')}
                                    </Link>
                                </DropdownMenuItem>
                            </>
                        )}
                        {(canCancel || canDelete) && <DropdownMenuSeparator />}
                        {canCancel && (
                            <DropdownMenuItem onSelect={() => setDialog('cancel')} className="text-danger-fg focus:text-danger-fg">
                                {t('Cancel order')}
                            </DropdownMenuItem>
                        )}
                        {canDelete && (
                            <DropdownMenuItem onSelect={() => setDialog('delete')} className="text-danger-fg focus:text-danger-fg">
                                <Trash2 aria-hidden />
                                {t('Delete order')}
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            <Dialog open={dialog !== null} onOpenChange={(open) => !open && busy === null && setDialog(null)}>
                <DialogContent className="sm:max-w-md">
                    {dialog === 'ship' && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                submit('ship', { status: 'shipped', tracking_number: tracking.trim() || null });
                            }}
                            className="space-y-4"
                        >
                            <DialogHeader>
                                <DialogTitle>{t('Mark order as shipped')}</DialogTitle>
                                <DialogDescription>{t('Add the carrier tracking number if you have one. You can add it later from the edit page.')}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-1.5">
                                <Label htmlFor="ship-tracking">{t('Tracking number')}</Label>
                                <Input id="ship-tracking" dir="ltr" value={tracking} onChange={(e) => setTracking(e.target.value)} maxLength={255} autoFocus />
                            </div>
                            <DialogFooter className="gap-2">
                                <Button type="button" variant="outline" onClick={() => setDialog(null)} disabled={busy !== null}>
                                    {t('Cancel')}
                                </Button>
                                <Button type="submit" disabled={busy !== null}>
                                    {busy === 'ship' && <Loader2 className="animate-spin" aria-hidden />}
                                    {t('Mark as shipped')}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                    {dialog && dialog !== 'ship' && (
                        <ConfirmBody
                            kind={dialog}
                            orderNumber={order.orderNumber}
                            busy={busy !== null}
                            onCancel={() => setDialog(null)}
                            onConfirm={() => {
                                if (dialog === 'paid') submit('paid', { payment_status: 'paid' });
                                else if (dialog === 'refund') submit('refund', { payment_status: 'refunded' });
                                else if (dialog === 'cancel') submit('cancel', { status: 'cancelled' });
                                else if (dialog === 'delete') destroy();
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

function ConfirmBody({
    kind,
    orderNumber,
    busy,
    onCancel,
    onConfirm,
}: {
    kind: Exclude<DialogKind, 'ship' | null>;
    orderNumber: string;
    busy: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    const { t } = useTranslation();
    const copy = {
        paid: {
            title: t('Mark order as paid?'),
            body: t('Only do this after you have received the money, for example cash on delivery or a bank transfer. No payment is collected by this action.'),
            cta: t('Mark as paid'),
            destructive: false,
        },
        refund: {
            title: t('Mark order as refunded?'),
            body: t('This records the refund on the order only. It does not send money back to the customer — issue the refund with your payment provider first.'),
            cta: t('Mark as refunded'),
            destructive: true,
        },
        cancel: {
            title: t('Cancel this order?'),
            body: t('The order will be marked as cancelled. Payment status is not changed and no refund is issued automatically.'),
            cta: t('Cancel order'),
            destructive: true,
        },
        delete: {
            title: t('Delete this order?'),
            body: t('The order and its items will be permanently removed. This action cannot be undone.'),
            cta: t('Delete order'),
            destructive: true,
        },
    }[kind];

    return (
        <>
            <DialogHeader>
                <DialogTitle>{copy.title}</DialogTitle>
                <DialogDescription>
                    <bdi dir="ltr" className="text-foreground font-medium">
                        {orderNumber}
                    </bdi>
                    {' — '}
                    {copy.body}
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
                    {t('Keep order as is')}
                </Button>
                <Button type="button" variant={copy.destructive ? 'destructive' : 'default'} onClick={onConfirm} disabled={busy}>
                    {busy && <Loader2 className="animate-spin" aria-hidden />}
                    {copy.cta}
                </Button>
            </DialogFooter>
        </>
    );
}
