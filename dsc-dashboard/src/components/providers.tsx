"use client";

import { FluentProvider, Toaster, useId } from "@fluentui/react-components";
import { crimsonDarkTheme } from "@/lib/theme";

export function Providers({ children }: { children: React.ReactNode }) {
  const toasterId = useId("toaster");

  return (
    <FluentProvider theme={crimsonDarkTheme}>
      <Toaster toasterId={toasterId} position="top-end" />
      {children}
    </FluentProvider>
  );
}

/** Export a consistent toaster ID so pages can dispatch toasts */
export const TOASTER_ID = "global-toaster";
