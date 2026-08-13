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

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark />
      <span className="sr-only">Resume Hub</span>
    </span>
  );
}
