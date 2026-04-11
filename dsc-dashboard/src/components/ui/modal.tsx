"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}

export function Modal({ open, onClose, title, children, className, wide }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className={cn(
        "bg-dsc-surface rounded-xl border border-dsc-border shadow-2xl max-h-[85vh] overflow-hidden flex flex-col animate-fade-scale-in",
        wide ? "w-full max-w-3xl" : "w-full max-w-lg",
        className
      )}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-dsc-border flex-shrink-0">
            <h3 className="text-base font-semibold text-dsc-text">{title}</h3>
            <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 transition-colors">
              <X className="h-4 w-4 text-dsc-text-secondary" />
            </button>
          </div>
        )}
        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
