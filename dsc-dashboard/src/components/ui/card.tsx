"use client";

import {
  Card as FluentCard,
  CardHeader as FluentCardHeader,
  makeStyles,
  tokens,
  Text,
  mergeClasses,
} from "@fluentui/react-components";
import type { ReactNode } from "react";

const useStyles = makeStyles({
  card: {
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusXLarge,
    padding: "24px",
    boxShadow: tokens.shadow2,
  },
  cardHover: {
    cursor: "pointer",
    transitionProperty: "box-shadow, transform",
    transitionDuration: "200ms",
    ":hover": {
      boxShadow: tokens.shadow8,
      transform: "translateY(-2px)",
    },
    ":active": {
      transform: "translateY(0)",
      boxShadow: tokens.shadow2,
    },
  },
  header: {
    marginBottom: "16px",
  },
  title: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  description: {
    marginTop: "4px",
    color: tokens.colorNeutralForeground3,
  },
});

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ className, hover = false, children, style, ...props }: CardProps) {
  const styles = useStyles();
  return (
    <div
      className={mergeClasses(styles.card, hover && styles.cardHover, className)}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const styles = useStyles();
  return <div className={mergeClasses(styles.header, className)} {...props}>{children}</div>;
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const styles = useStyles();
  return <h3 className={mergeClasses(styles.title, className)} {...props}>{children}</h3>;
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  const styles = useStyles();
  return <p className={mergeClasses(styles.description, className)} {...props}>{children}</p>;
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props}>{children}</div>;
}
