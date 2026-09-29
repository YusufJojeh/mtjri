import { useTranslation } from 'react-i18next';
import { AlertTriangle, Check, Circle, Clock, Loader, Package, Pause, Truck, Undo2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StatusMeta, Tone } from '@/lib/commerce/status';

export const toneClasses: Record<Tone, string> = {
    neutral: 'bg-neutral-soft text-neutral-fg',
    success: 'bg-success-soft text-success-fg',
    warning: 'bg-warning-soft text-warning-fg',
    danger: 'bg-danger-soft text-danger-fg',
    info: 'bg-info-soft text-info-fg',
    ai: 'bg-ai-soft text-ai-fg',
};

export const toneDot: Record<Tone, string> = {
    neutral: 'bg-muted-foreground/60',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
    ai: 'bg-ai',
};

const icons = {
    clock: Clock,
    loader: Loader,
    truck: Truck,
    check: Check,
    x: X,
    alert: AlertTriangle,
    undo: Undo2,
    package: Package,
    pause: Pause,
    dot: Circle,
};

interface ToneBadgeProps {
    tone?: Tone;
    children: React.ReactNode;
    icon?: React.ReactNode;
    className?: string;
    title?: string;
}

/** Low-level pill. Tone is always paired with visible text. */
export function ToneBadge({ tone = 'neutral', children, icon, className, title }: ToneBadgeProps) {
    return (
        <span
            title={title}
            className={cn(
                'inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 text-xs font-medium leading-none [&_svg]:size-3',
                toneClasses[tone],
                className,
            )}
        >
            {icon}
            {children}
        </span>
    );
}

export function StatusBadge({ meta, className }: { meta: StatusMeta; className?: string }) {
    const { t } = useTranslation();
    const Icon = icons[meta.icon];
    return (
        <ToneBadge tone={meta.tone} className={className} icon={meta.icon === 'dot' ? <span className={cn('size-1.5 rounded-full', toneDot[meta.tone])} aria-hidden /> : <Icon aria-hidden />}>
            {t(meta.label)}
        </ToneBadge>
    );
}
