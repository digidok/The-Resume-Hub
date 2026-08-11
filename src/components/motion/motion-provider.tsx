"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Global reduced-motion handling. Framer Motion applies this internally,
 * post-hydration, to every `motion.*`/`whileInView` component on the page —
 * transform-based animations snap to their end state while opacity can still
 * fade. This must NOT be replicated with manual `useReducedMotion()` branches
 * in individual components: since SSR always resolves that hook to `false`
 * (no `matchMedia` on the server), branching the rendered structure on it
 * causes a hydration mismatch for any visitor who actually has reduced
 * motion enabled.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
