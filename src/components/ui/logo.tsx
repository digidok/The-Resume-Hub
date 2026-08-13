export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md bg-brand-700 text-lg font-black leading-none text-white ${className}`}
      aria-hidden="true"
    >
      R
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
      <span className="flex flex-col leading-tight">
        <span className={`text-xl font-bold tracking-tight ${textColor}`}>Resume Hub</span>
        {tagline && (
          <span className={`text-xs font-medium ${taglineColor}`}>Helping people get hired</span>
        )}
      </span>
    </span>
  );
}
