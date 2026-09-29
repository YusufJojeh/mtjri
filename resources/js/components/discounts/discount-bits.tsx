import { Check, Circle, Clock, Copy, Pause, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ToneBadge } from '@/components/ds/status-badge';
import { cn } from '@/lib/utils';
import type { DiscountState } from './discount-utils';

/** Lifecycle badge: icon + text, never colour alone. */
export function DiscountStateBadge({ state, daysLeft, className }: { state: DiscountState; daysLeft?: number | null; className?: string }) {
    const { t } = useTranslation();
    if (state === 'active' && daysLeft !== null && daysLeft !== undefined && daysLeft >= 0 && daysLeft <= 7) {
        return (
            <ToneBadge tone="warning" icon={<Clock aria-hidden />} className={className}>
                {daysLeft === 0 ? t('Ends today') : t('Ends in {{count}} days', { count: daysLeft })}
            </ToneBadge>
        );
    }
    switch (state) {
        case 'active':
            return (
                <ToneBadge tone="success" icon={<Circle aria-hidden className="fill-current !size-1.5" />} className={className}>
                    {t('Active')}
                </ToneBadge>
            );
        case 'scheduled':
            return (
                <ToneBadge tone="info" icon={<Clock aria-hidden />} className={className}>
                    {t('Scheduled')}
                </ToneBadge>
            );
        case 'expired':
            return (
                <ToneBadge tone="neutral" icon={<X aria-hidden />} className={className}>
                    {t('Expired')}
                </ToneBadge>
            );
        default:
            return (
                <ToneBadge tone="neutral" icon={<Pause aria-hidden />} className={className}>
                    {t('Paused')}
                </ToneBadge>
            );
    }
}

/** Monospace, LTR discount code with a copy button. */
export function DiscountCode({ code, size = 'sm', className }: { code: string; size?: 'sm' | 'lg'; className?: string }) {
    const { t } = useTranslation();
    const [copied, setCopied] = useState(false);
    const copy = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* clipboard unavailable; the code is still selectable */
        }
    };
    return (
        <span className={cn('inline-flex max-w-full items-center gap-0.5 rounded-md border bg-muted/60 ps-2', className)} data-no-row-click>
            <code dir="ltr" className={cn('truncate font-mono font-medium tracking-wide select-all', size === 'lg' ? 'text-base' : 'text-xs')}>
                {code}
            </code>
            <button
                type="button"
                onClick={copy}
                className={cn(
                    'text-muted-foreground hover:text-foreground focus-visible:ring-ring/40 inline-flex shrink-0 items-center justify-center rounded-md outline-none focus-visible:ring-[3px]',
                    size === 'lg' ? 'size-9' : 'size-7',
                )}
                aria-label={copied ? t('Copied') : t('Copy code {{code}}', { code })}
                title={copied ? t('Copied') : t('Copy code')}
            >
                {copied ? <Check className="text-success-fg size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
            </button>
            <span className="sr-only" aria-live="polite">
                {copied ? t('Copied') : ''}
            </span>
        </span>
    );
}

/** Usage against a limit. Unlimited codes show text only (no meter). */
export function UsageMeter({ used, limit, compact }: { used: number; limit: number | null; compact?: boolean }) {
    const { t, i18n } = useTranslation();
    const nf = new Intl.NumberFormat(i18n.language?.startsWith('ar') ? 'ar-u-nu-latn' : i18n.language);
    if (!limit) {
        return (
            <div className="text-sm">
                <span className="tabular-nums font-medium">{nf.format(used)}</span>
                <span className="text-muted-foreground"> · {t('Unlimited')}</span>
            </div>
        );
    }
    const pct = Math.min(100, (used / limit) * 100);
    const tone = pct >= 100 ? 'bg-danger' : pct >= 80 ? 'bg-warning' : 'bg-primary';
    return (
        <div className={cn('min-w-0', compact ? 'w-28' : 'w-full')}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="tabular-nums">
                    <span className="font-medium">{nf.format(used)}</span>
                    <span className="text-muted-foreground"> / {nf.format(limit)}</span>
                </span>
                {pct >= 100 && <span className="text-danger-fg text-xs font-medium">{t('Limit reached')}</span>}
            </div>
            <div
                className="bg-muted mt-1 h-1.5 w-full overflow-hidden rounded-full"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={limit}
                aria-valuenow={used}
                aria-label={t('{{used}} of {{limit}} uses', { used, limit })}
            >
                <div className={cn('h-full rounded-full', tone)} style={{ width: `${Math.max(pct, used > 0 ? 3 : 0)}%` }} />
            </div>
        </div>
    );
}
