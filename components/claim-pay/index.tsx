import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { AmountInput } from "../common/AmountInput";
import { useAuth } from "@crossmint/client-sdk-react-ui";

interface ClaimPayModalProps {
  open: boolean;
  onClose: () => void;
  onClaimSuccess?: () => void;
}

const MAX_CLAIM_AMOUNT = 5000;

export function ClaimPayModal({ open, onClose, onClaimSuccess }: ClaimPayModalProps) {
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();

  const handleClaim = async () => {
    if (!user?.email) {
      setError("User email not found");
      return;
    }

    const amountNum = Number(amount);
    if (amountNum <= 0 || isNaN(amountNum)) {
      setError("Please enter a valid amount");
      return;
    }

    if (amountNum > MAX_CLAIM_AMOUNT) {
      setError(`Amount exceeds maximum claim limit of $${MAX_CLAIM_AMOUNT}`);
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const response = await fetch("/api/claims", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userEmail: user.email,
          amountUSD: amountNum,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to claim pay");
      }

      setSuccess(true);
      setAmount("");
      
      setTimeout(() => {
        setSuccess(false);
        onClose();
        onClaimSuccess?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to claim pay");
    } finally {
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
      title="Claim Contractor Pay"
      showBackButton={!isProcessing && !success}
      onBack={handleClose}
    >
      <div className="flex w-full flex-col gap-4">
        {success ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="text-green-600 text-6xl">✓</div>
            <div className="text-center text-lg font-medium">
              Successfully claimed ${amount}!
            </div>
            <div className="text-secondary text-center text-sm">
              Your available balance has been updated.
            </div>
          </div>
        ) : (
          <>
            <div className="text-secondary mb-2 text-sm">
              Claim your contractor payment. This simulates receiving RAIN (USDC) tokens from the
              company treasury.
            </div>

            <AmountInput amount={amount} onChange={setAmount} />

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            {Number(amount) > MAX_CLAIM_AMOUNT && (
              <div className="text-center text-sm text-red-600">
                Amount exceeds maximum claim limit of ${MAX_CLAIM_AMOUNT}
              </div>
            )}

            <button
              onClick={handleClaim}
              disabled={
                isProcessing ||
                !amount ||
                Number(amount) <= 0 ||
                Number(amount) > MAX_CLAIM_AMOUNT
              }
              className="bg-primary hover:bg-primary/90 disabled:bg-secondary/50 mt-4 flex h-12 w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processing..." : "Claim Pay"}
            </button>

            <div className="text-secondary mt-2 text-center text-xs">
              Demo mode: Claims are tracked in the company ledger for CEO visibility
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
