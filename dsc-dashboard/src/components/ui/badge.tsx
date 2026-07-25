"use client";

import { Badge as FluentBadge, makeStyles, mergeClasses, tokens } from "@fluentui/react-components";

type BadgeVariant =
  | "default" | "compliant" | "drifted" | "error" | "unknown" | "offline"
  | "active" | "draft" | "archived"
  | "low" | "medium" | "high" | "critical"
  | "windows" | "linux" | "macos";

const useStyles = makeStyles({
  base: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "9999px",
    paddingLeft: "10px",
    paddingRight: "10px",
    paddingTop: "2px",
    paddingBottom: "2px",
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightMedium,
  },
  default: {
    backgroundColor: `${tokens.colorNeutralStroke1}60`,
    color: tokens.colorNeutralForeground3,
  },
  compliant: {
    backgroundColor: "#18241C",
    color: "#7ECC9A",
    border: `1px solid #7ECC9A50`,
  },
  drifted: {
    backgroundColor: "#2E2010",
    color: "#E8D07A",
    border: `1px solid #E8D07A50`,
  },
  error: {
    backgroundColor: "#3A0E14",
    color: "#F28B8B",
    border: `1px solid #F28B8B50`,
  },
  unknown: {
    backgroundColor: `${tokens.colorNeutralStroke1}30`,
    color: tokens.colorNeutralForeground3,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  offline: {
    backgroundColor: `${tokens.colorNeutralStroke1}20`,
    color: tokens.colorNeutralForeground3,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  active: {
    backgroundColor: "#221830",
    color: "#B89ADA",
    border: `1px solid #B89ADA50`,
  },
  draft: {
    backgroundColor: `${tokens.colorNeutralStroke1}30`,
    color: tokens.colorNeutralForeground3,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  archived: {
    backgroundColor: `${tokens.colorNeutralStroke1}20`,
    color: tokens.colorNeutralForeground3,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  low: {
    backgroundColor: "#221830",
    color: "#B89ADA",
  },
  medium: {
    backgroundColor: "#2E2010",
    color: "#E8D07A",
  },
  high: {
    backgroundColor: "#3A0E1490",
    color: "#F28B8B",
  },
  critical: {
    backgroundColor: "#3A0E14",
    color: "#F28B8B",
  },
  windows: {
    backgroundColor: "#221830",
    color: "#B89ADA",
  },
  linux: {
    backgroundColor: "#18241C",
    color: "#7ECC9A",
  },
  macos: {
    backgroundColor: `${tokens.colorNeutralStroke1}30`,
    color: tokens.colorNeutralForeground3,
  },
});

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  const styles = useStyles();
  const variantStyle = styles[variant] || styles.default;
  return (
    <span className={mergeClasses(styles.base, variantStyle, className)} {...props} />
  );
}
