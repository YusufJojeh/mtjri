import { RevealGroup, RevealItem } from '@/components/public/motion';
import React from 'react';

interface PublicPageHeroProps {
    eyebrow: React.ReactNode;
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    actions?: React.ReactNode;
    /** Rendered under the copy, still part of the staggered entrance. */
    children?: React.ReactNode;
}

/**
 * Shared opening block for the standalone public pages. Animates on mount
 * (it is always above the fold) and draws a soft brand glow behind the copy.
 */
export default function PublicPageHero({ eyebrow, title, subtitle, actions, children }: PublicPageHeroProps) {
    return (
        <section className="relative isolate overflow-hidden px-4 pt-14 pb-14 md:pt-24 md:pb-20">
            <div className="public-hero-grid pointer-events-none absolute inset-0 -z-10" aria-hidden />
            <div className="public-hero-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem]" aria-hidden />

            <RevealGroup immediate className="container mx-auto max-w-4xl text-center">
                <RevealItem>
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/80 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-slate-700 shadow-sm backdrop-blur">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-color)' }} aria-hidden />
                        {eyebrow}
                    </span>
                </RevealItem>
                <RevealItem as="h1" className="mt-6 text-4xl font-bold tracking-tight text-balance text-slate-900 sm:text-5xl lg:text-6xl">
                    {title}
                </RevealItem>
                {subtitle && (
                    <RevealItem as="p" className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-slate-600 md:text-xl">
                        {subtitle}
                    </RevealItem>
                )}
                {actions && <RevealItem className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">{actions}</RevealItem>}
                {children && <RevealItem className="mt-12">{children}</RevealItem>}
            </RevealGroup>
        </section>
    );
}
