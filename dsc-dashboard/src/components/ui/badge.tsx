import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-dsc-border/40 text-dsc-text-secondary",
        compliant: "bg-dsc-green-50 text-dsc-green border border-dsc-green/30",
        drifted: "bg-dsc-yellow-50 text-dsc-yellow border border-dsc-yellow/30",
        error: "bg-dsc-red-50 text-dsc-red border border-dsc-red/30",
        unknown: "bg-dsc-border/30 text-dsc-text-secondary border border-dsc-border",
        offline: "bg-dsc-border/20 text-dsc-text-secondary border border-dsc-border",
        active: "bg-dsc-blue-50 text-dsc-blue border border-dsc-blue/30",
        draft: "bg-dsc-border/30 text-dsc-text-secondary border border-dsc-border",
        archived: "bg-dsc-border/20 text-dsc-text-secondary border border-dsc-border",
        low: "bg-dsc-blue-50 text-dsc-blue",
        medium: "bg-dsc-yellow-50 text-dsc-yellow",
        high: "bg-dsc-red-50/70 text-dsc-red",
        critical: "bg-dsc-red-50 text-dsc-red",
        windows: "bg-dsc-blue-50 text-dsc-blue",
        linux: "bg-dsc-green-50 text-dsc-green",
        macos: "bg-dsc-border/30 text-dsc-text-secondary",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
