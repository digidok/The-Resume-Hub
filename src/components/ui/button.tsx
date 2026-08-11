import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "outline" | "outlineInverse" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-700 text-white shadow-sm shadow-brand-900/10 hover:bg-brand-600 hover:-translate-y-px hover:shadow-md hover:shadow-brand-900/15 focus-visible:outline-brand-600 disabled:bg-brand-300 disabled:shadow-none disabled:translate-y-0",
  secondary:
    "bg-brand-950 text-white hover:bg-brand-800 focus-visible:outline-brand-700 disabled:bg-slate-400",
  outline:
    "border border-slate-300 bg-white text-slate-900 hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-brand-600 disabled:text-slate-400",
  // For use on dark/brand-colored backgrounds (e.g. the landing hero), where the
  // default `outline` variant's white fill would blend in or clash.
  outlineInverse:
    "border border-white/25 bg-white/5 text-white hover:bg-white/15 focus-visible:outline-white disabled:text-white/50",
  ghost:
    "text-slate-700 hover:bg-slate-100 focus-visible:outline-brand-600 disabled:text-slate-400",
  danger:
    "bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600 disabled:bg-red-300",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-base",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(({ className = "", variant = "primary", size = "md", ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
});
Button.displayName = "Button";
