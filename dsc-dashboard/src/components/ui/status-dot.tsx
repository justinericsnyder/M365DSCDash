"use client";

import { makeStyles, mergeClasses } from "@fluentui/react-components";

const statusColors: Record<string, string> = {
  COMPLIANT: "#7ECC9A",
  DRIFTED: "#E8D07A",
  ERROR: "#F28B8B",
  UNKNOWN: "#D4A0B480",
  OFFLINE: "#D4A0B450",
  ACTIVE: "#B89ADA",
  DRAFT: "#D4A0B480",
  ARCHIVED: "#D4A0B450",
  PENDING: "#E8D07A",
  APPLYING: "#B89ADA",
  APPLIED: "#7ECC9A",
  FAILED: "#F28B8B",
  DISABLED: "#D4A0B460",
  MISSING: "#F28B8B99",
  EXTRA: "#E8D07A99",
  LOW: "#B89ADA",
  MEDIUM: "#E8D07A",
  HIGH: "#F28B8BCC",
  CRITICAL: "#F28B8B",
};

const useStyles = makeStyles({
  dot: {
    display: "inline-block",
    height: "8px",
    width: "8px",
    borderRadius: "9999px",
  },
});

export function StatusDot({ status, pulse = false }: { status: string; pulse?: boolean }) {
  const styles = useStyles();
  const color = statusColors[status] || "#D4A0B480";

  return (
    <span
      className={mergeClasses(styles.dot, pulse ? "pulse-dot" : undefined)}
      style={{ backgroundColor: color }}
    />
  );
}
