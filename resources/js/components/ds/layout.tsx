import { Link } from '@inertiajs/react';
import { ArrowUpRight, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

/* ----------------------------------------------------------------------------
 * PageHeader — compact title row with optional description, meta and actions.
 * ------------------------------------------------------------------------- */
interface PageHeaderProps {
    title: React.ReactNode;
    description?: React.ReactNode;
    meta?: React.ReactNode;
    actions?: React.ReactNode;
    back?: { href: string; label: string };
    className?: string;
}

export function PageHeader({ title, description, meta, actions, back, className }: PageHeaderProps) {
    return (
        <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
            <div className="min-w-0 space-y-1">
                {back && (
                    <Link href={back.href} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs font-medium">
                        <span aria-hidden className="rtl:rotate-180">←</span>
                        {back.label}
                    </Link>
                )}
                <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-foreground truncate text-xl font-semibold tracking-tight sm:text-[1.375rem]">{title}</h1>
                    {meta}
                </div>
                {description && <p className="text-muted-foreground max-w-2xl text-sm">{description}</p>}
            </div>
            {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
}

/* ----------------------------------------------------------------------------
 * Panel — the one card surface. Avoid nesting panels inside panels.
 * ------------------------------------------------------------------------- */
interface PanelProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
    title?: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
    icon?: React.ReactNode;
    flush?: boolean;
    as?: 'section' | 'div';
}

export function Panel({ title, description, action, icon, flush, className, children, as = 'section', ...rest }: PanelProps) {
    const Comp = as;
    const headingId = rest.id ? `${rest.id}-title` : undefined;
    return (
        <Comp
            aria-labelledby={title && headingId ? headingId : undefined}
            className={cn('bg-card text-card-foreground rounded-xl border shadow-card', className)}
            {...rest}
        >
            {(title || action) && (
                <header className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5">
                    <div className="flex min-w-0 items-start gap-2">
                        {icon && <span className="text-muted-foreground mt-0.5 [&_svg]:size-4">{icon}</span>}
                        <div className="min-w-0">
                            {title && (
                                <h2 id={headingId} className="text-sm font-semibold leading-6">
                                    {title}
                                </h2>
                            )}
                            {description && <p className="text-muted-foreground text-xs">{description}</p>}
                        </div>
                    </div>
                    {action && <div className="shrink-0">{action}</div>}
                </header>
            )}
            <div className={cn(flush ? 'pt-3' : 'px-4 pb-4 pt-3 sm:px-5 sm:pb-5')}>{children}</div>
        </Comp>
    );
}

/* ----------------------------------------------------------------------------
 * MetricCard — KPI with honest comparison (hidden when no baseline exists).
 * ------------------------------------------------------------------------- */
interface MetricCardProps {
    label: string;
    value: React.ReactNode;
    change?: number | null;
    changeLabel?: string;
    hint?: React.ReactNode;
    href?: string;
    icon?: React.ReactNode;
    /** When true, a decrease is good (e.g. refunds). */
    invert?: boolean;
    emphasis?: 'default' | 'warning' | 'danger';
    loading?: boolean;
    className?: string;
}

export function MetricCard({ label, value, change, changeLabel, hint, href, icon, invert, emphasis = 'default', loading, className }: MetricCardProps) {
    const { t, i18n } = useTranslation();
    const hasChange = change !== undefined && change !== null && Number.isFinite(change);
    const positive = hasChange && (invert ? change! < 0 : change! > 0);
    const negative = hasChange && (invert ? change! > 0 : change! < 0);
    const TrendIcon = !hasChange || change === 0 ? Minus : change! > 0 ? TrendingUp : TrendingDown;
    const pct = hasChange
        ? new Intl.NumberFormat(i18n.language?.startsWith('ar') ? 'ar-u-nu-latn' : i18n.language, {
              style: 'percent',
              maximumFractionDigits: 1,
              signDisplay: 'exceptZero',
          }).format(change! / 100)
        : null;

    const body = (
        <>
            <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground truncate text-xs font-medium">{label}</span>
                {icon && <span className="text-muted-foreground/70 [&_svg]:size-4">{icon}</span>}
            </div>
            {loading ? (
                <Skeleton className="mt-2 h-7 w-24" />
            ) : (
                <div
                    className={cn(
                        'mt-1.5 truncate text-xl font-semibold tabular-nums tracking-tight sm:text-2xl',
                        emphasis === 'warning' && 'text-warning-fg',
                        emphasis === 'danger' && 'text-danger-fg',
                    )}
                >
                    {value}
                </div>
            )}
            <div className="mt-1 flex min-h-4 items-center gap-1.5 text-xs">
                {hasChange && (
                    <span
                        className={cn(
                            'inline-flex items-center gap-0.5 font-medium tabular-nums',
                            positive && 'text-success-fg',
                            negative && 'text-danger-fg',
                            !positive && !negative && 'text-muted-foreground',
                        )}
                    >
                        <TrendIcon className="size-3" aria-hidden />
                        <span>{pct}</span>
                        <span className="sr-only">{positive ? t('improvement') : negative ? t('decline') : ''}</span>
                    </span>
                )}
                {(changeLabel || hint) && <span className="text-muted-foreground truncate">{hasChange ? changeLabel : hint}</span>}
            </div>
        </>
    );

    const cls = cn('bg-card group relative block min-w-0 rounded-xl border p-3.5 shadow-card transition-colors sm:p-4', className);
    if (href) {
        return (
            <Link href={href} className={cn(cls, 'hover:border-foreground/20 focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]')}>
                {body}
                <ArrowUpRight className="text-muted-foreground absolute end-3 top-3 size-3.5 opacity-0 transition-opacity group-hover:opacity-100 rtl:-scale-x-100" aria-hidden />
            </Link>
        );
    }
    return <div className={cls}>{body}</div>;
}

/* ----------------------------------------------------------------------------
 * EmptyState — every empty surface explains what to do next.
 * ------------------------------------------------------------------------- */
interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: React.ReactNode;
    action?: React.ReactNode;
    compact?: boolean;
    className?: string;
}

export function EmptyState({ icon, title, description, action, compact, className }: EmptyStateProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'gap-2 px-4 py-8' : 'gap-3 px-6 py-14', className)}>
            {icon && (
                <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full [&_svg]:size-5" aria-hidden>
                    {icon}
                </div>
            )}
            <div className="space-y-1">
                <p className="text-sm font-semibold">{title}</p>
                {description && <p className="text-muted-foreground mx-auto max-w-sm text-sm">{description}</p>}
            </div>
            {action && <div className="mt-1 flex flex-wrap justify-center gap-2">{action}</div>}
        </div>
    );
}

/* ----------------------------------------------------------------------------
 * DescriptionList — label/value pairs for detail screens.
 * ------------------------------------------------------------------------- */
export function DescriptionList({ items, className }: { items: Array<{ label: string; value: React.ReactNode; hidden?: boolean }>; className?: string }) {
    return (
        <dl className={cn('divide-border divide-y text-sm', className)}>
            {items
                .filter((i) => !i.hidden)
                .map((item) => (
                    <div key={item.label} className="flex items-start justify-between gap-4 py-2 first:pt-0 last:pb-0">
                        <dt className="text-muted-foreground shrink-0">{item.label}</dt>
                        <dd className="min-w-0 text-end font-medium break-words">{item.value ?? '—'}</dd>
                    </div>
                ))}
        </dl>
    );
}

/* ----------------------------------------------------------------------------
 * SectionLabel — small overline used to group content inside a panel.
 * ------------------------------------------------------------------------- */
export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
    return <h3 className={cn('text-muted-foreground text-[11px] font-semibold tracking-wide uppercase', className)}>{children}</h3>;
}
