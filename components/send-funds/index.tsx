import React, { useState } from "react";
import { useAuth, useWallet } from "@crossmint/client-sdk-react-ui";
import { AmountInput } from "../common/AmountInput";
import { OrderPreview } from "./OrderPreview";
import { RecipientInput } from "./RecipientInput";
import { useBalance } from "@/hooks/useBalance";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "../common/Dialog";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { isEmail, isValidAddress } from "@/lib/utils";
import { ArrowLeft, X } from "lucide-react";

interface SendFundsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SendFundsModal({ open, onClose }: SendFundsModalProps) {
  const { wallet } = useWallet();
  const { user } = useAuth();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { displayableBalance, refetch: refetchBalance } = useBalance();
  const { refetch: refetchActivityFeed } = useActivityFeed();

  const isRecipientValid = isValidAddress(recipient) || isEmail(recipient);
  const isAmountValid =
    !!amount &&
    !Number.isNaN(Number(amount)) &&
    Number(amount) > 0 &&
    Number(amount) <= Number(displayableBalance);
  const canContinue = isRecipientValid && isAmountValid;

  async function handleContinue() {
    setError(null);
    if (isEmail(recipient)) {
      if (!recipient) {
        setError("Please enter a recipient");
        return;
      }
      try {
        setIsLoading(true);
        setShowPreview(true);
      } catch (e: unknown) {
        setError((e as Error).message || String(e));
      } finally {
        setIsLoading(false);
      }
    } else {
      setShowPreview(true);
    }
  }

  async function handleSend() {
    setError(null);
    setIsLoading(true);
    try {
      if (!isRecipientValid || !amount || !isAmountValid) {
        setError("Invalid recipient or amount");
        setIsLoading(false);
        return;
      }

      if (!wallet) {
        setError("No wallet connected");
        setIsLoading(false);
        return;
      }

      if (isEmail(recipient)) {
        await wallet.send(`email:${recipient}`, "usdc", amount);
      } else {
        await wallet.send(recipient, "usdc", amount);
      }

      refetchBalance();
      refetchActivityFeed();
      handleDone();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  const resetFlow = () => {
    setShowPreview(false);
    setAmount("");
    setRecipient("");
    setError(null);
  };

  const handleDone = () => {
    resetFlow();
    onClose();
  };

  const displayableAmount = Number(amount).toFixed(2);
  const showBackButton = showPreview && !isLoading;
  const showCloseButton = !showPreview;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleDone()}>
      <DialogContent className="flex h-[580px] max-h-[85vh] flex-col rounded-3xl bg-white sm:max-w-md">
        {showBackButton && (
          <button
            onClick={resetFlow}
            className="absolute left-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
            aria-label="Back"
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        {showCloseButton && <DialogClose />}
        <DialogTitle className="text-center">
          {showPreview ? "Order Confirmation" : "Send"}
        </DialogTitle>
        {!showPreview ? (
          <div className="flex w-full flex-1 flex-col">
            <div className="mb-2 flex w-full flex-col items-center">
              <AmountInput amount={amount} onChange={setAmount} />
              <div
                className={
                  Number(amount) > Number(displayableBalance)
                    ? "text-sm text-red-600"
                    : "text-muted-foreground text-sm"
                }
              >
                Current balance: ${displayableBalance}
              </div>
            </div>
            <div className="mt-4 w-full">
              <RecipientInput recipient={recipient} onChange={setRecipient} error={error} />
            </div>
            <div className="mt-auto w-full pt-8">
              <button
                disabled={!canContinue}
                onClick={handleContinue}
                className="bg-primary hover:bg-primary-hover w-full rounded-full px-6 py-3 text-sm font-medium text-white transition disabled:bg-gray-100 disabled:text-gray-400"
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          <OrderPreview
            userEmail={user?.email || ""}
            recipient={recipient}
            amount={displayableAmount}
            error={error}
            isLoading={isLoading}
            onConfirm={handleSend}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
