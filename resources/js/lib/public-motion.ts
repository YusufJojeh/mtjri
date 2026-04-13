import type { Transition, Variants } from 'framer-motion';
import {
    LANDING_VIEWPORT,
    landingContainer,
    landingFadeUp,
    landingRevealTransition,
    landingTransition,
} from '@/pages/landing-page/lib/landing-motion';

export { LANDING_VIEWPORT, landingContainer, landingFadeUp, landingRevealTransition, landingTransition };

const easeOut = [0.22, 1, 0.36, 1] as const;

export function publicTransition(reduce: boolean, delay = 0): Transition {
    return landingTransition(reduce, delay);
}

/** Section title + body stagger — aligned with landing sections */
export const publicSectionContainer: Variants = {
    hidden: {},
    visible: (reduce: boolean) => ({
        transition: reduce
            ? { staggerChildren: 0, delayChildren: 0 }
            : { staggerChildren: 0.072, delayChildren: 0.06 },
    }),
};

export const publicSectionFade: Variants = {
    hidden: (reduce: boolean) => ({
        opacity: reduce ? 1 : 0,
        y: reduce ? 0 : 12,
    }),
    visible: (reduce: boolean) => ({
        opacity: 1,
        y: 0,
        transition: publicTransition(reduce),
    }),
};

export const publicHoverLift = (reduce: boolean) =>
    reduce
        ? {}
        : {
              y: -2,
              transition: { duration: 0.24, ease: easeOut },
          };
