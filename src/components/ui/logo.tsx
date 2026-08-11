export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-brand-800" />
      <path
        d="M10 8.5C10 7.67 10.67 7 11.5 7H17.5L22 11.5V23.5C22 24.33 21.33 25 20.5 25H11.5C10.67 25 10 24.33 10 23.5V8.5Z"
        className="fill-white"
      />
      <path d="M17.5 7V10.5C17.5 11.05 17.95 11.5 18.5 11.5H22L17.5 7Z" className="fill-brand-200" />
      <rect x="12.5" y="14" width="7" height="1.4" rx="0.7" className="fill-brand-600" />
      <rect x="12.5" y="17" width="7" height="1.4" rx="0.7" className="fill-brand-600" />
      <rect x="12.5" y="20" width="4.5" height="1.4" rx="0.7" className="fill-accent-500" />
    </svg>
  );
}

export function Logo({
  className = "",
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "inverse";
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark />
      <span
        className={`text-lg font-bold tracking-tight ${
          variant === "inverse" ? "text-white" : "text-slate-900"
        }`}
      >
        Resume Hub
      </span>
    </span>
  );
}
