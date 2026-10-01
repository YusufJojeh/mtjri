import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import React from 'react';

interface PublicButtonProps {
    href: string;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'inverse' | 'ghost-dark';
    arrow?: boolean;
    className?: string;
}

const variants: Record<NonNullable<PublicButtonProps['variant']>, string> = {
    primary: 'public-btn-primary text-white',
    secondary: 'border border-slate-200 bg-white text-slate-900 shadow-sm hover:border-slate-300 hover:bg-slate-50',
    inverse: 'bg-white text-slate-900 shadow-sm hover:bg-slate-100',
    'ghost-dark': 'border border-white/20 text-white hover:border-white/40 hover:bg-white/10',
};

/**
 * Marketing call-to-action. Presses scale down slightly for tactile feedback;
 * the trailing arrow nudges forward on hover (mirrored in RTL).
 */
export default function PublicButton({ href, children, variant = 'primary', arrow = false, className = '' }: PublicButtonProps) {
    return (
        <Link
            href={href}
            className={`public-press group inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-[background-color,border-color,box-shadow,transform] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)] focus-visible:ring-offset-2 ${variants[variant]} ${className}`}
        >
            {children}
            {arrow && <ArrowRight className="public-arrow h-4 w-4 rtl:-scale-x-100" aria-hidden />}
        </Link>
    );
}
