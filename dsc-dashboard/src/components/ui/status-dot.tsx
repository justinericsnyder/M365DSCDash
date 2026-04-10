import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  COMPLIANT: "bg-dsc-green",
  DRIFTED: "bg-dsc-yellow",
  ERROR: "bg-dsc-red",
  UNKNOWN: "bg-gray-400",
  OFFLINE: "bg-gray-300",
  ACTIVE: "bg-dsc-blue",
  DRAFT: "bg-gray-400",
  ARCHIVED: "bg-gray-300",
  PENDING: "bg-dsc-yellow",
  APPLYING: "bg-dsc-blue",
  APPLIED: "bg-dsc-green",
  FAILED: "bg-dsc-red",
};

export function StatusDot({ status, pulse = false }: { status: string; pulse?: boolean }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        statusColors[status] || "bg-gray-400",
        pulse && "pulse-dot"
      )}
    />
  );
}
