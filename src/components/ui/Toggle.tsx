"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ToggleProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  label?: string;
}

const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, pressed, onPressedChange, label, ...props }, ref) => {
    return (
      <div className="flex items-center gap-3">
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={pressed}
          onClick={() => onPressedChange(!pressed)}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            pressed ? "bg-emerald-600" : "bg-zinc-200",
            className
          )}
          {...props}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform",
              pressed ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
        {label && <span className="text-sm text-zinc-700">{label}</span>}
      </div>
    );
  }
);

Toggle.displayName = "Toggle";

export { Toggle };
