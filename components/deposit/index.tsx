import React, { useCallback, useState, useEffect } from "react";
import {
  CrossmintCheckoutProvider,
  CrossmintProvider,
  useAuth,
} from "@crossmint/client-sdk-react-ui";
import { Checkout } from "./Checkout";
import { AmountInput } from "../common/AmountInput";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "../common/Dialog";
import { TestingCardModal } from "./TestingCardModal";
import { useActivityFeed } from "../../hooks/useActivityFeed";
import { useBalance } from "@/hooks/useBalance";
import { ArrowLeft } from "lucide-react";

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
  walletAddress: string;
}

const CLIENT_API_KEY_CONSOLE_FUND = process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY;

const MIN_AMOUNT = 1; // Min amount in USD
const MAX_AMOUNT = 50; // Max amount in USD allowed in staging

export function DepositModal({ open, onClose, walletAddress }: DepositModalProps) {
  const [step, setStep] = useState<"options" | "processing" | "completed">("options");
  const { user } = useAuth();
  const receiptEmail = user?.email;
  const [amount, setAmount] = useState("");
  const { refetch: refetchActivityFeed } = useActivityFeed();
  const { refetch: refetchBalance } = useBalance();

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep("options");
      setAmount("");
    }
  }, [open]);

  const restartFlow = () => {
    setStep("options");
    setAmount("");
  };

  const handlePaymentCompleted = useCallback(() => {
    refetchActivityFeed();
    refetchBalance();
    onClose();
  }, [refetchActivityFeed, refetchBalance, onClose]);

  const handleProcessingPayment = useCallback(() => {
    setStep("processing");
  }, []);

  const showBackButton = step !== "options" && step !== "processing";
  const showCloseButton = step === "options";

  const isNonModal = step === "options";

  return (
    <>
      {open && step === "options" && <TestingCardModal />}

      {/* Custom overlay when in non-modal mode (allows clicks through to TestingCardModal) */}
      {open && isNonModal && (
        <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} aria-hidden="true" />
      )}

      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()} modal={!isNonModal}>
        <DialogContent
          className="flex max-h-[85vh] flex-col rounded-3xl bg-white sm:max-w-md"
          onPointerDownOutside={(e) => {
            // Prevent closing when TestingCardModal is visible
            if (step === "options") {
              e.preventDefault();
            }
          }}
        >
          {showBackButton && (
            <button
              onClick={restartFlow}
              className="absolute left-6 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
              aria-label="Back"
              type="button"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          {showCloseButton && <DialogClose />}
          <DialogTitle className="text-center">Deposit</DialogTitle>
          {step === "options" && (
            <div className="mb-6 flex w-full flex-col items-center">
              <AmountInput amount={amount} onChange={setAmount} />
              {Number(amount) > 0 && Number(amount) < MIN_AMOUNT && (
                <div className="mt-1 text-center text-red-600">
                  Minimum deposit amount is ${MIN_AMOUNT}
                </div>
              )}
              {Number(amount) > MAX_AMOUNT && (
                <div className="mt-1 text-center text-red-600">
                  Transaction amount exceeds the maximum allowed deposit limit of ${MAX_AMOUNT}
                </div>
              )}
            </div>
          )}
          <div className="flex w-full flex-grow flex-col">
            <CrossmintProvider apiKey={CLIENT_API_KEY_CONSOLE_FUND as string}>
              <CrossmintCheckoutProvider>
                <Checkout
                  amount={amount}
                  isAmountValid={Number(amount) >= MIN_AMOUNT && Number(amount) <= MAX_AMOUNT}
                  walletAddress={walletAddress}
                  onPaymentCompleted={handlePaymentCompleted}
                  receiptEmail={receiptEmail || ""}
                  onProcessingPayment={handleProcessingPayment}
                  step={step}
                  goBack={restartFlow}
                />
              </CrossmintCheckoutProvider>
            </CrossmintProvider>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
