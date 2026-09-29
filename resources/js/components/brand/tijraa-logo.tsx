import { cn } from '@/lib/utils';

export const TIJRAA = {
    name: 'Tijraa',
    emerald: '#0B6B5A',
    gold: '#D9AE4E',
} as const;

/** Tijraa mark: a "T" whose crossbar carries a shopping-bag handle. */
export function TijraaMark({ className, title }: { className?: string; title?: string }) {
    return (
        <svg viewBox="0 0 64 64" className={cn('size-6 shrink-0', className)} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
            <rect width="64" height="64" rx="15" fill={TIJRAA.emerald} />
            <path d="M22 21.5c0-5.6 4.5-10 10-10s10 4.4 10 10" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".55" />
            <rect x="14" y="21" width="36" height="7.5" rx="3.75" fill="#fff" />
            <rect x="28.25" y="21" width="7.5" height="31" rx="3.75" fill="#fff" />
            <circle cx="46.5" cy="46.5" r="4" fill={TIJRAA.gold} />
        </svg>
    );
}

/** Mark + wordmark. The wordmark is always Latin "Tijraa" in every locale. */
export function TijraaLogo({ className, markClassName, size = 'md' }: { className?: string; markClassName?: string; size?: 'sm' | 'md' | 'lg' }) {
    const text = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' }[size];
    const mark = { sm: 'size-5', md: 'size-6', lg: 'size-8' }[size];
    return (
        <span className={cn('inline-flex items-center gap-2', className)} dir="ltr">
            <TijraaMark className={cn(mark, markClassName)} />
            <span className={cn('text-foreground font-semibold tracking-tight', text)}>{TIJRAA.name}</span>
        </span>
    );
}
