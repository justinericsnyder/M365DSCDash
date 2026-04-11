import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-dsc-text">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "flex h-9 w-full rounded-lg border border-dsc-border bg-dsc-surface px-3 py-1 text-sm shadow-sm transition-colors",
          "placeholder:text-dsc-text-secondary/60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dsc-blue focus-visible:border-dsc-blue",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-dsc-red focus-visible:ring-dsc-red",
          className
        )}
        ref={ref}
        {...props}
      />
      {error && <p className="text-xs text-dsc-red">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";

