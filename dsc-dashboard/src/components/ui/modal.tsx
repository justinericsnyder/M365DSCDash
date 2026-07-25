"use client";

import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogTrigger,
  Button,
} from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}

export function Modal({ open, onClose, title, children, className, wide }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={(_, data) => { if (!data.open) onClose(); }}>
      <DialogSurface style={{ maxWidth: wide ? "768px" : "512px", width: "90vw" }}>
        <DialogBody>
          {title && (
            <DialogTitle
              action={
                <DialogTrigger action="close">
                  <Button
                    appearance="subtle"
                    aria-label="Close"
                    icon={<Dismiss24Regular />}
                    onClick={onClose}
                  />
                </DialogTrigger>
              }
            >
              {title}
            </DialogTitle>
          )}
          <DialogContent className={className}>
            {children}
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
