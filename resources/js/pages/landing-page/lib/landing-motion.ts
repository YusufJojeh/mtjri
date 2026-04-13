import type { Transition, Variants } from 'framer-motion';

const easeOut = [0.22, 1, 0.36, 1] as const;

/** Shared viewport — one rhythm site-wide */
export const LANDING_VIEWPORT = { once: true, amount: 0.18, margin: '0px 0px -10% 0px' } as const;

export function landingTransition(reduce: boolean, delay = 0): Transition {
    if (reduce) {
        return { duration: 0.001 };
    }
    return { duration: 0.66, delay, ease: easeOut };
}

/** Grids and cards — slightly quicker than hero copy */
export function landingRevealTransition(reduce: boolean, index = 0): Transition {
    if (reduce) {
        return { duration: 0.001 };
    }
    return { duration: 0.52, delay: index * 0.056, ease: easeOut };
}

/** Section headers (badge → title → subtitle) */
export const landingContainer: Variants = {
    hidden: {},
    visible: (reduce: boolean) => ({
        transition: reduce
            ? { staggerChildren: 0, delayChildren: 0 }
            : { staggerChildren: 0.072, delayChildren: 0.06 },
    }),
};

/** Hero — slower, more deliberate */
export const landingHeroContainer: Variants = {
    hidden: {},
    visible: (reduce: boolean) => ({
        transition: reduce
            ? { staggerChildren: 0, delayChildren: 0 }
            : { staggerChildren: 0.098, delayChildren: 0.16 },
    }),
};

export const landingFadeUp: Variants = {
    hidden: (reduce: boolean) => ({
        opacity: reduce ? 1 : 0,
        y: reduce ? 0 : 10,
    }),
    visible: (reduce: boolean) => ({
        opacity: 1,
        y: 0,
        transition: landingTransition(reduce),
    }),
};
