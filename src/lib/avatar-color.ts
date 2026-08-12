const AVATAR_COLORS = ["bg-brand-700", "bg-slate-800", "bg-brand-500", "bg-accent-600"];

/** Deterministic color pick so the same company always gets the same avatar color. */
export function avatarColor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
