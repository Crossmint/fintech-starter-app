import { cn } from "@/lib/utils";
import { XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import React, { ReactNode, useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  className?: string;
  title?: string;
  showCloseButton?: boolean;
}

export function Modal({
  open,
  onClose,
  children,
  showBackButton,
  onBack,
  className,
  title,
  showCloseButton,
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [open]);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-0 flex items-center justify-center bg-black/30 py-2">
      <div
        className={cn(
          "relative mx-4 flex h-fit w-full max-w-md flex-col items-center overflow-y-auto rounded-2xl bg-white p-6 shadow-xl md:h-fit md:max-h-[calc(100dvh-32px)]",
          className
        )}
      >
        <div className="relative flex h-9 w-full items-center justify-between gap-2">
          {showBackButton && (
            <button
              onClick={onBack || onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
              aria-label="Back"
              type="button"
            >
              <span className="text-2xl">←</span>
            </button>
          )}
          {title && (
            <div className="flex flex-1">
              <div className="text-lg font-semibold">{title}</div>
            </div>
          )}
          {showCloseButton && (
            <button onClick={onClose} className="absolute right-0">
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
