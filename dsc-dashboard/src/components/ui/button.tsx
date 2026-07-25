"use client";

import {
  Button as FluentButton,
  type ButtonProps as FluentButtonProps,
} from "@fluentui/react-components";
import { forwardRef } from "react";

/**
 * App-level Button that maps legacy variants to Fluent UI appearances.
 */

type AppVariant = "primary" | "danger" | "success" | "warning" | "outline" | "ghost" | "link";
type AppSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps {
  variant?: AppVariant;
  size?: AppSize;
  icon?: FluentButtonProps["icon"];
  appearance?: FluentButtonProps["appearance"];
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  "aria-label"?: string;
}

const variantToAppearance: Record<AppVariant, FluentButtonProps["appearance"]> = {
  primary: "primary",
  danger: "primary",
  success: "primary",
  warning: "primary",
  outline: "outline",
  ghost: "subtle",
  link: "transparent",
};

const variantToStyle: Record<AppVariant, React.CSSProperties | undefined> = {
  primary: undefined,
  danger: { backgroundColor: "#C53030" },
  success: { backgroundColor: "#2F855A" },
  warning: { backgroundColor: "#B7791F" },
  outline: undefined,
  ghost: undefined,
  link: undefined,
};

const sizeMap: Record<AppSize, FluentButtonProps["size"]> = {
  sm: "small",
  md: "medium",
  lg: "large",
  icon: "small",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", style, icon, children, appearance: appearanceProp, ...props }, ref) => {
    const appearance = appearanceProp || variantToAppearance[variant];
    const variantStyle = variantToStyle[variant];
    const fluentSize = sizeMap[size];
    const iconOnly = size === "icon";

    return (
      <FluentButton
        ref={ref}
        appearance={appearance}
        size={fluentSize}
        icon={icon}
        style={{ ...variantStyle, ...style, ...(iconOnly ? { minWidth: "32px", padding: "4px" } : {}) }}
        {...props}
      >
        {children}
      </FluentButton>
    );
  }
);
Button.displayName = "Button";
