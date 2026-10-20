export function LogoMark({ className = "h-9 w-11" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md border-b-2 border-accent-400 bg-brand-900 text-[11px] font-bold leading-none tracking-wider text-white ${className}`}
      aria-hidden="true"
    >
      RDH
    </span>
  );
}

export function Logo({
  className = "",
  variant = "default",
  tagline = false,
}: {
  className?: string;
  variant?: "default" | "inverse";
  tagline?: boolean;
}) {
  const textColor = variant === "inverse" ? "text-white" : "text-slate-900";
  const taglineColor = variant === "inverse" ? "text-white/60" : "text-slate-500";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="flex flex-col whitespace-nowrap leading-tight">
        <span className={`text-lg font-bold tracking-tight sm:text-xl ${textColor}`}>Resume Document Hub</span>
        {tagline && (
          <span className={`text-xs font-medium ${taglineColor}`}>Single Point of Contact</span>
        )}
      </span>
    </span>
  );
}
