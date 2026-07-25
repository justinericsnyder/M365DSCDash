"use client";

import {
  Input as FluentInput,
  Field,
  type InputProps as FluentInputProps,
} from "@fluentui/react-components";
import { forwardRef } from "react";

export interface InputProps extends Omit<FluentInputProps, "onChange"> {
  label?: string;
  error?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, onChange, ...props }, ref) => {
    const handleChange: FluentInputProps["onChange"] = (ev, data) => {
      if (onChange) {
        // Create a synthetic event compatible with standard onChange
        onChange(ev as unknown as React.ChangeEvent<HTMLInputElement>);
      }
    };

    const input = (
      <FluentInput
        ref={ref}
        id={id}
        appearance="filled-darker"
        onChange={handleChange}
        style={{ width: "100%" }}
        {...props}
      />
    );

    if (label || error) {
      return (
        <Field
          label={label}
          validationMessage={error}
          validationState={error ? "error" : undefined}
        >
          {input}
        </Field>
      );
    }

    return input;
  }
);
Input.displayName = "Input";
