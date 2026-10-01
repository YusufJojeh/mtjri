import { AnimatePresence, motion, useReducedMotion, type Transition, type Variants } from 'framer-motion';
import React from 'react';

/**
 * Motion vocabulary for the public marketing pages.
 *
 * - One strong ease-out curve: things arrive fast and settle softly.
 * - Entrances combine a small lift, a fade and a light blur so content
 *   "focuses in" rather than sliding across the page.
 * - UI feedback (indicators, accordions, presses) stays under ~300ms.
 * - With reduced motion everything still appears, just without movement.
 */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;

/** Springs for shared-layout indicators: quick, almost no overshoot. */
export const INDICATOR_SPRING: Transition = { type: 'spring', bounce: 0.14, duration: 0.42 };

export const REVEAL_VIEWPORT = { once: true, amount: 0.2, margin: '0px 0px -8% 0px' } as const;

export function useReduce(): boolean {
    return useReducedMotion() ?? false;
}

export const revealGroup: Variants = {
    hidden: {},
    visible: (reduce: boolean) => ({
        transition: reduce ? { staggerChildren: 0 } : { staggerChildren: 0.06, delayChildren: 0.04 },
    }),
};

export const revealItem: Variants = {
    hidden: (reduce: boolean) => (reduce ? { opacity: 0 } : { opacity: 0, y: 12, filter: 'blur(6px)' }),
    visible: (reduce: boolean) => ({
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: reduce ? { duration: 0.2 } : { duration: 0.55, ease: EASE_OUT },
    }),
};

type RevealTag = 'div' | 'section' | 'ul' | 'ol' | 'li' | 'article' | 'header' | 'p' | 'span' | 'h1' | 'h2' | 'h3';

interface RevealProps extends React.HTMLAttributes<HTMLElement> {
    as?: RevealTag;
    /** Animate on mount instead of when scrolled into view (above-the-fold content). */
    immediate?: boolean;
    children?: React.ReactNode;
}

/** Container that staggers its <RevealItem> children into view. */
export function RevealGroup({ as = 'div', immediate = false, children, ...rest }: RevealProps) {
    const reduce = useReduce();
    const Tag = motion[as] as React.ElementType;
    const trigger = immediate ? { animate: 'visible' } : { whileInView: 'visible', viewport: REVEAL_VIEWPORT };
    return (
        <Tag initial="hidden" {...trigger} variants={revealGroup} custom={reduce} {...rest}>
            {children}
        </Tag>
    );
}

export function RevealItem({ as = 'div', children, ...rest }: Omit<RevealProps, 'immediate'>) {
    const reduce = useReduce();
    const Tag = motion[as] as React.ElementType;
    return (
        <Tag variants={revealItem} custom={reduce} {...rest}>
            {children}
        </Tag>
    );
}

/* ------------------------------------------------------------------ */
/* Segmented control with a shared sliding indicator                   */
/* ------------------------------------------------------------------ */

interface SegmentedOption<T extends string> {
    value: T;
    label: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
    options: SegmentedOption<T>[];
    value: T;
    onChange: (value: T) => void;
    /** Unique per control on the page so indicators never jump between controls. */
    layoutId: string;
    label: string;
    className?: string;
}

export function SegmentedControl<T extends string>({ options, value, onChange, layoutId, label, className = '' }: SegmentedControlProps<T>) {
    const reduce = useReduce();
    const refs = React.useRef<Array<HTMLButtonElement | null>>([]);

    const onKeyDown = (event: React.KeyboardEvent, index: number) => {
        const dir = document.documentElement.dir === 'rtl' ? -1 : 1;
        const moves: Record<string, number> = {
            ArrowRight: index + dir,
            ArrowLeft: index - dir,
            Home: 0,
            End: options.length - 1,
        };
        const next = moves[event.key];
        if (next === undefined) return;
        event.preventDefault();
        const wrapped = (next + options.length) % options.length;
        onChange(options[wrapped].value);
        refs.current[wrapped]?.focus();
    };

    return (
        <div
            role="radiogroup"
            aria-label={label}
            className={`public-segmented inline-flex max-w-full flex-wrap items-center gap-1 rounded-full border border-slate-200/90 bg-white/80 p-1 shadow-sm backdrop-blur ${className}`}
        >
            {options.map((option, index) => {
                const active = option.value === value;
                return (
                    <button
                        key={option.value}
                        ref={(el) => {
                            refs.current[index] = el;
                        }}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        tabIndex={active ? 0 : -1}
                        onClick={() => onChange(option.value)}
                        onKeyDown={(e) => onKeyDown(e, index)}
                        className={`public-press relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)] focus-visible:ring-offset-2 ${
                            active ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        {active && (
                            <motion.span
                                layoutId={layoutId}
                                className="absolute inset-0 rounded-full shadow-sm"
                                style={{ backgroundColor: 'var(--primary-color)' }}
                                transition={reduce ? { duration: 0 } : INDICATOR_SPRING}
                                aria-hidden
                            />
                        )}
                        <span className="relative z-10 whitespace-nowrap">{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Accordion                                                           */
/* ------------------------------------------------------------------ */

interface AccordionItemProps {
    id: string;
    question: React.ReactNode;
    children: React.ReactNode;
    open: boolean;
    onToggle: () => void;
}

export function AccordionItem({ id, question, children, open, onToggle }: AccordionItemProps) {
    const reduce = useReduce();
    const buttonId = `${id}-trigger`;
    const panelId = `${id}-panel`;

    return (
        <div
            className={`rounded-2xl border bg-white transition-[border-color,box-shadow] duration-200 ${
                open ? 'border-slate-300 shadow-md shadow-slate-900/5' : 'border-slate-200/90 shadow-sm'
            }`}
        >
            <h3>
                <button
                    id={buttonId}
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={onToggle}
                    className="flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-start text-base font-semibold text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-color)] md:px-6 md:py-5"
                >
                    <span>{question}</span>
                    <span
                        className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50"
                        aria-hidden
                    >
                        <span className="absolute h-0.5 w-3 rounded-full bg-slate-600" />
                        <motion.span
                            className="absolute h-3 w-0.5 rounded-full bg-slate-600"
                            animate={{ scaleY: open ? 0 : 1 }}
                            transition={reduce ? { duration: 0 } : { duration: 0.2, ease: EASE_OUT }}
                        />
                    </span>
                </button>
            </h3>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        animate={reduce ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                        exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                        transition={{ duration: reduce ? 0.12 : 0.26, ease: EASE_OUT }}
                        className="overflow-hidden"
                    >
                        <motion.div
                            initial={reduce ? false : { y: -4 }}
                            animate={{ y: 0 }}
                            transition={{ duration: 0.26, ease: EASE_OUT }}
                            className="px-5 pb-5 text-[15px] leading-relaxed text-slate-600 md:px-6 md:pb-6"
                        >
                            {children}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
