import React, { useState } from "react";
import { useWallet } from "@crossmint/client-sdk-react-ui";
import { Check, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "../common/Dialog";
import { ScrollArea } from "../common/ScrollArea";
import { YieldList } from "./YieldList";
import { DepositYield } from "./DepositYield";
import { PositionsList } from "./PositionsList";
import { useYields, useYieldPositions, YieldOpportunity } from "@/hooks/useYields";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { cn } from "@/lib/utils";

interface EarnYieldModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = "list" | "deposit" | "processing" | "success";
type Tab = "opportunities" | "positions";

export function EarnYieldModal({ open, onClose }: EarnYieldModalProps) {
  const { wallet } = useWallet();
  const { yields, isLoading: yieldsLoading, error: yieldsError } = useYields();
  const {
    positions,
    positionCount,
    isLoading: positionsLoading,
    refetch: refetchPositions,
  } = useYieldPositions(wallet?.address);
  const { refetch: refetchActivityFeed } = useActivityFeed();

  const [step, setStep] = useState<Step>("list");
  const [activeTab, setActiveTab] = useState<Tab>("opportunities");
  const [selectedYield, setSelectedYield] = useState<YieldOpportunity | null>(null);

  const handleSelectYield = (yieldOpp: YieldOpportunity) => {
    setSelectedYield(yieldOpp);
    setStep("deposit");
  };

  const handleBack = () => {
    if (step === "deposit") {
      setStep("list");
      setSelectedYield(null);
    } else {
      handleDone();
    }
  };

  const handleDone = () => {
    setStep("list");
    setSelectedYield(null);
    onClose();
  };

  const handleExitSuccess = () => {
    refetchPositions();
    refetchActivityFeed();
  };

  const handleDepositSuccess = () => {
    setStep("success");
    refetchPositions();
    refetchActivityFeed();
  };

  const getTitle = () => {
    switch (step) {
      case "list":
        return "Earn Yield";
      case "deposit":
        return selectedYield?.metadata.name || "Deposit";
      case "processing":
        return "Processing...";
      case "success":
        return "Success!";
      default:
        return "Earn Yield";
    }
  };

  const showBackButton = step === "deposit";
  const showCloseButton = step === "list";

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleDone()}>
      <DialogContent className="flex h-[85vh] max-h-[700px] flex-col rounded-3xl bg-white sm:max-w-md">
        {showBackButton && (
          <button
            onClick={handleBack}
            className="absolute left-6 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
            aria-label="Back"
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        {showCloseButton && <DialogClose />}
        <DialogTitle className={cn("text-center", showBackButton && "px-10")}>
          {getTitle()}
        </DialogTitle>

        {step === "list" && (
          <div className="flex w-full flex-1 flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex w-full rounded-xl border border-gray-200 bg-gray-100 p-1">
              <button
                onClick={() => setActiveTab("opportunities")}
                className={cn(
                  "flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition",
                  activeTab === "opportunities"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                Opportunities
              </button>
              <button
                onClick={() => setActiveTab("positions")}
                className={cn(
                  "flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition",
                  activeTab === "positions"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                My Positions
              </button>
            </div>

            {/* Tab content */}
            <ScrollArea className="h-0 flex-1">
              {activeTab === "opportunities" && (
                <YieldList
                  yields={yields}
                  isLoading={yieldsLoading}
                  error={yieldsError}
                  onSelectYield={handleSelectYield}
                />
              )}

              {activeTab === "positions" && (
                <div className="mt-4 w-full">
                  <PositionsList
                    positions={positions}
                    yields={yields}
                    isLoading={positionsLoading}
                    onExitSuccess={handleExitSuccess}
                  />
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {step === "deposit" && selectedYield && (
          <DepositYield
            yieldOpportunity={selectedYield}
            onSuccess={handleDepositSuccess}
            onProcessing={() => setStep("processing")}
          />
        )}

        {step === "processing" && (
          <div className="flex flex-1 flex-col items-center justify-center py-12">
            <div className="border-primary mb-4 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
            <p className="text-lg font-medium">Processing your deposit...</p>
            <p className="text-muted-foreground mt-2 text-sm">
              Please wait while your transaction is being confirmed.
            </p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-1 flex-col items-center justify-center py-12">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-lg font-medium">Deposit Successful!</p>
            <p className="text-muted-foreground mt-2 text-center text-sm">
              Your USDC is now earning yield. Check back to see your earnings grow.
            </p>
            <button
              onClick={handleDone}
              className="bg-primary hover:bg-primary-hover mt-6 rounded-full px-8 py-3 font-semibold text-white transition"
            >
              Done
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
