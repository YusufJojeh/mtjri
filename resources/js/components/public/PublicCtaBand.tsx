import PublicButton from '@/components/public/PublicButton';
import { RevealGroup, RevealItem } from '@/components/public/motion';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface PublicCtaBandProps {
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    primaryLabel?: React.ReactNode;
    primaryHref?: string;
    secondaryLabel?: React.ReactNode;
    secondaryHref?: string;
}

/** Closing call to action shared by the standalone public pages. */
export default function PublicCtaBand({ title, subtitle, primaryLabel, primaryHref, secondaryLabel, secondaryHref }: PublicCtaBandProps) {
    const { t } = useTranslation();

    return (
        <section className="px-4 pb-20 md:pb-28">
            <RevealGroup className="relative isolate container mx-auto max-w-6xl overflow-hidden rounded-3xl bg-zinc-950 px-6 py-14 text-center text-white shadow-2xl shadow-slate-900/20 md:px-16 md:py-20">
                <div
                    className="pointer-events-none absolute inset-0 -z-10 opacity-90"
                    style={{
                        background:
                            'radial-gradient(ellipse 60% 80% at 50% 120%, color-mix(in srgb, var(--primary-color) 55%, transparent), transparent 70%), radial-gradient(ellipse 30% 40% at 85% 0%, color-mix(in srgb, var(--accent-color) 22%, transparent), transparent 70%)',
                    }}
                    aria-hidden
                />
                <RevealItem as="h2" className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-balance md:text-4xl">
                    {title ?? t('public.cta.title')}
                </RevealItem>
                <RevealItem as="p" className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-pretty text-zinc-300 md:text-lg">
                    {subtitle ?? t('public.cta.subtitle')}
                </RevealItem>
                <RevealItem className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <PublicButton href={primaryHref ?? route('register')} variant="inverse" arrow>
                        {primaryLabel ?? t('public.cta.primary')}
                    </PublicButton>
                    <PublicButton href={secondaryHref ?? route('pricing')} variant="ghost-dark">
                        {secondaryLabel ?? t('public.cta.secondary')}
                    </PublicButton>
                </RevealItem>
            </RevealGroup>
        </section>
    );
}
