"use client";

import {
  Textarea as FluentTextarea,
  Field,
  type TextareaProps as FluentTextareaProps,
} from "@fluentui/react-components";
import { forwardRef } from "react";

export interface TextareaProps extends Omit<FluentTextareaProps, "onChange"> {
  label?: string;
  error?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, id, onChange, ...props }, ref) => {
    const handleChange: FluentTextareaProps["onChange"] = (ev, data) => {
      if (onChange) {
        onChange(ev as unknown as React.ChangeEvent<HTMLTextAreaElement>);
      }
    };

    const textarea = (
      <FluentTextarea
        ref={ref}
        id={id}
        appearance="filled-darker"
        onChange={handleChange}
        resize="vertical"
        style={{ width: "100%", minHeight: 120 }}
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
          {textarea}
        </Field>
      );
    }

    return textarea;
  }
);
Textarea.displayName = "Textarea";
