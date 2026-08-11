"use client";

import { motion } from "framer-motion";
import { MessageCircle, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { EASE } from "@/components/motion/variants";

export function HumanSupport() {
  return (
    <div className="mx-auto max-w-4xl">
      <ScrollReveal className="mx-auto grid max-w-3xl grid-cols-1 items-center gap-6 sm:grid-cols-[1fr_auto_1fr]">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE }}
          className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm"
        >
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <Sparkles className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-semibold text-slate-900">AI Career Coach</p>
          <p className="mt-1 text-xs text-slate-500">Instant answers, any time of day.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.2 }}
          className="mx-auto text-xs font-semibold uppercase tracking-wide text-slate-400"
        >
          and
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
          className="rounded-2xl border border-brand-200 bg-brand-50 p-6 text-center shadow-sm"
        >
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-white">
            <Users className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-semibold text-slate-900">Real Resume Specialist</p>
          <p className="mt-1 text-xs text-slate-500">Free CV review, on WhatsApp.</p>
        </motion.div>
      </ScrollReveal>

      <ScrollReveal delay={0.2} className="mt-10 text-center">
        <a href="https://wa.me/27693391915" target="_blank" rel="noreferrer">
          <Button size="lg">
            <MessageCircle className="h-4 w-4" />
            Chat with us on WhatsApp
          </Button>
        </a>
        <p className="mt-3 text-sm text-slate-500">069 339 1915</p>
      </ScrollReveal>
    </div>
  );
}
