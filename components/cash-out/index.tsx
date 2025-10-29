import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import { AmountInput } from "../common/AmountInput";
import { useAuth } from "@crossmint/client-sdk-react-ui";

interface CashOutDemoModalProps {
  open: boolean;
  onClose: () => void;
  onCashOutSuccess?: () => void;
}

export function CashOutDemoModal({ open, onClose, onCashOutSuccess }: CashOutDemoModalProps) {
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (open && user?.email) {
      fetchAvailableBalance();
    }
  }, [open, user?.email]);

  const fetchAvailableBalance = async () => {
    if (!user?.email) return;

    setIsLoadingBalance(true);
    try {
      const response = await fetch(`/api/me/liability?userEmail=${encodeURIComponent(user.email)}`);
      const data = await response.json();

      if (response.ok && data.liability) {
        setAvailableBalance(data.liability.availableToWithdraw);
      }
    } catch (err) {
      console.error("Error fetching balance:", err);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleCashOut = async () => {
    if (!user?.email) {
      setError("User email not found");
      return;
    }

    const amountNum = Number(amount);
    if (amountNum <= 0 || isNaN(amountNum)) {
      setError("Please enter a valid amount");
      return;
    }

    if (availableBalance !== null && amountNum > availableBalance) {
      setError(`Insufficient balance. You have $${availableBalance.toFixed(2)} available to cash out.`);
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const response = await fetch("/api/withdrawals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userEmail: user.email,
          amountUSD: amountNum,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process cash out");
      }

      setSuccess(true);
      setAmount("");

      setTimeout(() => {
        setSuccess(false);
        onClose();
        onCashOutSuccess?.();
      }, 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process cash out");
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setAmount("");
      setError("");
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Cash Out (Demo)"
      showBackButton={!isProcessing && !success}
      onBack={handleClose}
    >
      <div className="flex w-full flex-col gap-4">
        {success ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="text-6xl text-blue-600">⏳</div>
            <div className="text-center text-lg font-medium">Processing cash out...</div>
            <div className="text-secondary text-center text-sm">
              Your withdrawal of ${amount} is being processed.
            </div>
            <div className="text-secondary text-center text-xs">
              This typically completes in a few seconds in demo mode.
            </div>
          </div>
        ) : (
          <>
            <div className="text-secondary mb-2 text-sm">
              Cash out your available contractor pay to your bank account. This simulates the
              offramp process where RAIN (USDC) is converted to fiat currency.
            </div>

            {isLoadingBalance ? (
              <div className="text-secondary text-center text-sm">Loading available balance...</div>
            ) : availableBalance !== null ? (
              <div className="rounded-lg bg-blue-50 p-3">
                <div className="text-sm font-medium text-blue-900">Available to Cash Out</div>
                <div className="text-2xl font-bold text-blue-600">
                  ${availableBalance.toFixed(2)}
                </div>
              </div>
            ) : null}

            <AmountInput amount={amount} onChange={setAmount} />

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <button
              onClick={handleCashOut}
              disabled={
                isProcessing ||
                isLoadingBalance ||
                !amount ||
                Number(amount) <= 0 ||
                (availableBalance !== null && Number(amount) > availableBalance)
              }
              className="bg-primary hover:bg-primary/90 disabled:bg-secondary/50 mt-4 flex h-12 w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processing..." : "Cash Out"}
            </button>

            <div className="text-secondary mt-2 text-center text-xs">
              Demo mode: Withdrawals are tracked and CEO can see company liabilities
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
