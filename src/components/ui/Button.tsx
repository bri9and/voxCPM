import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-emerald-700 text-white hover:bg-emerald-800":
              variant === "primary",
            "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50":
              variant === "secondary",
            "bg-rose-600 text-white hover:bg-rose-700": variant === "danger",
            "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900":
              variant === "ghost",
          },
          {
            "h-8 px-3 text-sm": size === "sm",
            "h-10 px-4 text-sm": size === "md",
            "h-12 px-6 text-base": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
