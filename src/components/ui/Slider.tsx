"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface SliderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  label?: string;
  showValue?: boolean;
  onChange?: (value: number) => void;
}

const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, showValue = true, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(parseFloat(e.target.value));
    };

    return (
      <div className="space-y-2">
        {(label || showValue) && (
          <div className="flex items-center justify-between">
            {label && (
              <span className="text-sm font-medium text-zinc-700">{label}</span>
            )}
            {showValue && (
              <span className="text-sm text-zinc-500 font-mono">
                {props.value}
              </span>
            )}
          </div>
        )}
        <input
          type="range"
          ref={ref}
          className={cn(
            "w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-600",
            className
          )}
          onChange={handleChange}
          {...props}
        />
        <div className="flex justify-between text-xs text-zinc-400">
          <span>{props.min}</span>
          <span>{props.max}</span>
        </div>
      </div>
    );
  }
);

Slider.displayName = "Slider";

export { Slider };
