import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "outlineInverse"
  | "solidInverse"
  | "ghost"
  | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/25 hover:from-brand-600 hover:to-brand-700 hover:shadow-lg hover:shadow-brand-500/35 focus-visible:outline-brand-500",
  // Warm coral — the fun, high-energy counterpart to the turquoise primary.
  secondary:
    "bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-md shadow-accent-500/25 hover:from-accent-600 hover:to-accent-700 hover:shadow-lg hover:shadow-accent-500/35 focus-visible:outline-accent-500",
  outline:
    "border-2 border-brand-200 bg-white text-brand-700 hover:border-brand-400 hover:bg-brand-50 focus-visible:outline-brand-500",
  // For use on colorful/dark backgrounds (e.g. the landing hero), where the
  // default `outline` variant's white fill would blend in or clash.
  outlineInverse:
    "border-2 border-white/30 bg-white/10 text-white hover:bg-white/20 focus-visible:outline-white",
  // Solid white, for the primary CTA on a colorful/dark background.
  solidInverse:
    "bg-white text-brand-700 shadow-lg shadow-black/10 hover:bg-white/90 focus-visible:outline-white",
  ghost: "text-slate-700 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-brand-500",
  danger:
    "bg-red-500 text-white shadow-md shadow-red-500/25 hover:bg-red-600 focus-visible:outline-red-500",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3.5 py-1.5 text-sm",
  md: "px-5 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(({ className = "", variant = "primary", size = "md", ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all hover:scale-[1.03] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
});
Button.displayName = "Button";
