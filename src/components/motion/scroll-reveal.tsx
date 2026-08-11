"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUp } from "./variants";

/**
 * Reveals children once as they scroll into view. Reduced-motion handling
 * comes from the global <MotionConfig reducedMotion="user"> in the root
 * layout — do NOT branch this component's structure on useReducedMotion()
 * here, since SSR always resolves it to false and doing so causes a
 * hydration mismatch for visitors who actually have it enabled.
 */
export function ScrollReveal({
  children,
  variants = fadeUp,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  variants?: Variants;
  delay?: number;
  className?: string;
  as?: "div" | "span";
}) {
  const Component = motion[as];

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={variants}
      transition={{ delay }}
    >
      {children}
    </Component>
  );
}

/** Stagger a group of ScrollReveal-style children as the parent enters view. */
export function ScrollStagger({
  children,
  className,
  staggerChildren = 0.12,
}: {
  children: ReactNode;
  className?: string;
  staggerChildren?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren } } }}
    >
      {children}
    </motion.div>
  );
}
