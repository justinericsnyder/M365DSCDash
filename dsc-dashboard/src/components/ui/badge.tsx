import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-800",
        compliant: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        drifted: "bg-amber-50 text-amber-700 border border-amber-200",
        error: "bg-red-50 text-red-700 border border-red-200",
        unknown: "bg-gray-50 text-gray-600 border border-gray-200",
        offline: "bg-gray-100 text-gray-500 border border-gray-200",
        active: "bg-blue-50 text-blue-700 border border-blue-200",
        draft: "bg-gray-50 text-gray-600 border border-gray-200",
        archived: "bg-gray-100 text-gray-500 border border-gray-200",
        low: "bg-blue-50 text-blue-700",
        medium: "bg-yellow-50 text-yellow-700",
        high: "bg-orange-50 text-orange-700",
        critical: "bg-red-50 text-red-700",
        windows: "bg-blue-50 text-blue-700",
        linux: "bg-green-50 text-green-700",
        macos: "bg-gray-50 text-gray-700",
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
