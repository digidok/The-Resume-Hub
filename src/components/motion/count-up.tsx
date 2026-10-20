"use client";

import { animate } from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * Shows the exact final number on the server and for visitors without motion.
 * When it scrolls into view it counts up from zero once.
 */
export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let controls: { stop: () => void } | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        observer.disconnect();
        controls = animate(0, value, {
          duration: 1.4,
          ease: "easeOut",
          onUpdate: (v) => {
            el.textContent = `${Math.round(v).toLocaleString("en-ZA")}${suffix}`;
          },
        });
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      controls?.stop();
    };
  }, [value, suffix]);

  return (
    <span ref={ref}>
      {value.toLocaleString("en-ZA")}
      {suffix}
    </span>
  );
}
