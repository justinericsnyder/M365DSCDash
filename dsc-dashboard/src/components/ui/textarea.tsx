import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-dsc-text">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(
          "flex min-h-[120px] w-full rounded-lg border border-dsc-border bg-white px-3 py-2 text-sm shadow-sm transition-colors",
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
Textarea.displayName = "Textarea";
