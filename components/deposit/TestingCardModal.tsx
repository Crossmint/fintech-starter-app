"use client";

import { CreditCard } from "lucide-react";
import { createPortal } from "react-dom";
import { CopyWrapper } from "../common/CopyWrapper";
import { useEffect, useState } from "react";

export function TestingCardModal() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      data-testing-card
      className="fixed left-4 right-4 top-4 z-[9999] space-y-3 rounded-2xl bg-white p-4 shadow-lg lg:left-auto lg:right-6 lg:top-6 lg:w-[380px]"
    >
      <div className="flex items-center gap-3 text-base font-medium text-gray-900">
        <CreditCard className="h-5 w-5 text-gray-600" />
        <span>Test payments</span>
      </div>
      <p className="text-muted-foreground hidden text-sm lg:block">
        Use the following test card to complete your payment
      </p>
      <div className="w-full">
        <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 py-2 pl-3 pr-2">
          <span className="truncate text-sm text-gray-900">4242 4242 4242 4242</span>
          <CopyWrapper
            toCopy="4242424242424242"
            className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium transition hover:bg-gray-100"
            iconPosition="right"
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
