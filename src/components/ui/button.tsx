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
    "bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus-visible:outline-brand-500",
  // Warm coral — the fun, high-energy counterpart to the turquoise primary.
  secondary:
    "bg-accent-600 text-white shadow-sm hover:bg-accent-700 focus-visible:outline-accent-500",
  outline:
    "border border-brand-200 bg-white text-brand-700 hover:border-brand-400 hover:bg-brand-50 focus-visible:outline-brand-500",
  // For use on colorful/dark backgrounds (e.g. the landing hero), where the
  // default `outline` variant's white fill would blend in or clash.
  outlineInverse:
    "border border-white/30 bg-white/10 text-white hover:bg-white/20 focus-visible:outline-white",
  // Solid white, for the primary CTA on a colorful/dark background.
  solidInverse:
    "bg-white text-brand-700 shadow-sm hover:bg-white/90 focus-visible:outline-white",
  ghost: "text-slate-700 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-brand-500",
  danger:
    "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:outline-red-500",
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
      className={`inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
});
Button.displayName = "Button";
