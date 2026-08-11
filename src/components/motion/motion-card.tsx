"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { fadeUp } from "./variants";

/**
 * Wraps pre-rendered (server) content so it can participate in a parent
 * ScrollStagger's variant propagation. Children must already be rendered —
 * never pass a component reference across this boundary, only JSX/ReactNode.
 */
export function MotionCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={fadeUp} className={className}>
      {children}
    </motion.div>
  );
}
