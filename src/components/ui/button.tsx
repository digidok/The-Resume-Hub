import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600 disabled:bg-indigo-300",
  secondary:
    "bg-slate-900 text-white hover:bg-slate-700 focus-visible:outline-slate-900 disabled:bg-slate-400",
  outline:
    "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 focus-visible:outline-indigo-600 disabled:text-slate-400",
  ghost:
    "text-slate-700 hover:bg-slate-100 focus-visible:outline-indigo-600 disabled:text-slate-400",
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
