import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-dsc-bg disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[#8B3A5C] text-white hover:bg-[#A04870] focus-visible:ring-[#8B3A5C] shadow-sm shadow-[#8B3A5C]/20",
        danger: "bg-[#C53030] text-white hover:bg-[#E53E3E] focus-visible:ring-[#C53030] shadow-sm",
        success: "bg-[#2F855A] text-white hover:bg-[#38A169] focus-visible:ring-[#2F855A] shadow-sm",
        warning: "bg-[#B7791F] text-white hover:bg-[#D69E2E] focus-visible:ring-[#B7791F] shadow-sm",
        outline: "border border-dsc-border bg-dsc-surface text-dsc-text hover:bg-dsc-border/30 hover:border-[#8B3A5C]/50 focus-visible:ring-[#8B3A5C]",
        ghost: "text-dsc-text-secondary hover:bg-dsc-border/30 hover:text-dsc-text",
        link: "text-[#D4789A] underline-offset-4 hover:underline hover:text-[#E8A0B8]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4",
        lg: "h-11 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = "Button";
