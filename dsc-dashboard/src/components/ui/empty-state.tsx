"use client";

import { makeStyles, tokens, Text, Button } from "@fluentui/react-components";
import type { FluentIcon } from "@fluentui/react-icons";

interface EmptyStateProps {
  icon: FluentIcon | React.ElementType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: "64px",
    paddingBottom: "64px",
    textAlign: "center",
  },
  iconWrapper: {
    borderRadius: "9999px",
    backgroundColor: `${tokens.colorNeutralStroke1}30`,
    padding: "16px",
    marginBottom: "16px",
  },
  icon: {
    fontSize: "32px",
    color: tokens.colorNeutralForeground3,
  },
  title: {
    marginBottom: "4px",
  },
  description: {
    maxWidth: "384px",
    marginBottom: "24px",
    color: tokens.colorNeutralForeground3,
  },
});

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const styles = useStyles();
  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>
        <Icon className={styles.icon} />
      </div>
      <Text size={500} weight="semibold" block className={styles.title}>{title}</Text>
      <Text size={300} block className={styles.description}>{description}</Text>
      {actionLabel && onAction && (
        <Button appearance="primary" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
