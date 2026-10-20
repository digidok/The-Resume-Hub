"use client";

import { useEffect, useState } from "react";

/** Shows the client's logo from /public/clients when the file exists (svg, then png),
 * otherwise a clean text wordmark. The logo is only rendered once it has loaded, so a
 * missing file never produces a broken-image icon. */
export function ClientLogo({ slug, name }: { slug: string; name: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const candidates = [`/clients/${slug}.svg`, `/clients/${slug}.png`];
    (function tryNext(i: number) {
      if (i >= candidates.length || cancelled) return;
      const img = new Image();
      img.onload = () => {
        if (!cancelled) setSrc(candidates[i]);
      };
      img.onerror = () => tryNext(i + 1);
      img.src = candidates[i];
    })(0);
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!src) {
    return (
      <span className="text-center text-sm font-bold uppercase leading-tight tracking-wide text-slate-500">
        {name}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className="h-16 w-full max-w-[9rem] rounded-sm object-contain"
    />
  );
}
