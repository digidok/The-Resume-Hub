import type { Transition, Variants } from "framer-motion";

/** Premium, unhurried easing — no bounce, no overshoot. */
export const EASE = [0.16, 1, 0.3, 1] as const;

export const TRANSITION_MD: Transition = { duration: 0.6, ease: EASE };
export const TRANSITION_SM: Transition = { duration: 0.4, ease: EASE };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 36, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: TRANSITION_MD },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: TRANSITION_MD },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: TRANSITION_MD },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 48, y: 12 },
  show: { opacity: 1, x: 0, y: 0, transition: TRANSITION_MD },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -48, y: 12 },
  show: { opacity: 1, x: 0, y: 0, transition: TRANSITION_MD },
};

/** Wrap a set of children in a parent to stagger their entrance. */
export const staggerContainer = (staggerChildren = 0.12, delayChildren = 0): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren, delayChildren },
  },
});
