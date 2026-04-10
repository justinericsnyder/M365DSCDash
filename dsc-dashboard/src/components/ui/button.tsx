import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-dsc-blue text-white hover:bg-dsc-blue/90 focus-visible:ring-dsc-blue shadow-sm",
        danger: "bg-dsc-red text-white hover:bg-dsc-red/90 focus-visible:ring-dsc-red shadow-sm",
        success: "bg-dsc-green text-white hover:bg-dsc-green/90 focus-visible:ring-dsc-green shadow-sm",
        warning: "bg-dsc-yellow text-white hover:bg-dsc-yellow/90 focus-visible:ring-dsc-yellow shadow-sm",
        outline: "border border-dsc-border bg-white text-dsc-text hover:bg-gray-50 focus-visible:ring-dsc-blue",
        ghost: "text-dsc-text-secondary hover:bg-gray-100 hover:text-dsc-text",
        link: "text-dsc-blue underline-offset-4 hover:underline",
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
