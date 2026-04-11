import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  COMPLIANT: "bg-dsc-green",
  DRIFTED: "bg-dsc-yellow",
  ERROR: "bg-dsc-red",
  UNKNOWN: "bg-dsc-text-secondary/50",
  OFFLINE: "bg-dsc-text-secondary/30",
  ACTIVE: "bg-dsc-blue",
  DRAFT: "bg-dsc-text-secondary/50",
  ARCHIVED: "bg-dsc-text-secondary/30",
  PENDING: "bg-dsc-yellow",
  APPLYING: "bg-dsc-blue",
  APPLIED: "bg-dsc-green",
  FAILED: "bg-dsc-red",
  DISABLED: "bg-dsc-text-secondary/40",
  MISSING: "bg-dsc-red/60",
  EXTRA: "bg-dsc-yellow/60",
  LOW: "bg-dsc-blue",
  MEDIUM: "bg-dsc-yellow",
  HIGH: "bg-dsc-red/80",
  CRITICAL: "bg-dsc-red",
};

export function StatusDot({ status, pulse = false }: { status: string; pulse?: boolean }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        statusColors[status] || "bg-dsc-text-secondary/50",
        pulse && "pulse-dot"
      )}
    />
  );
}
