import React, { useState } from "react";
import { useWallet } from "@crossmint/client-sdk-react-ui";
import { Modal } from "../common/Modal";
import { YieldList } from "./YieldList";
import { DepositYield } from "./DepositYield";
import { PositionsList } from "./PositionsList";
import { useYields, useYieldPositions, YieldOpportunity } from "@/hooks/useYields";

interface EarnYieldModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = "list" | "deposit" | "processing" | "success";
type Tab = "opportunities" | "positions";

export function EarnYieldModal({ open, onClose }: EarnYieldModalProps) {
  const { wallet } = useWallet();
  const { yields, isLoading: yieldsLoading, error: yieldsError } = useYields("base");
  const {
    positions,
    positionCount,
    isLoading: positionsLoading,
    refetch: refetchPositions,
  } = useYieldPositions(wallet?.address);

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
  };

  const handleDepositSuccess = () => {
    setStep("success");
    refetchPositions();
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      showBackButton={step !== "processing"}
      onBack={handleBack}
      title={getTitle()}
      className="min-h-[400px] md:min-h-[500px]"
    >
      {step === "list" && (
        <>
          {/* Tabs */}
          <div className="mt-2 flex w-full gap-1 rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setActiveTab("opportunities")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                activeTab === "opportunities"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Opportunities
            </button>
            <button
              onClick={() => setActiveTab("positions")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                activeTab === "positions"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              My Positions
              {positionCount > 0 && (
                <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-xs text-white">
                  {positionCount}
                </span>
              )}
            </button>
          </div>

          {/* Tab content */}
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
        </>
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
          <div className="border-t-primary mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200" />
          <p className="text-lg font-medium">Processing your deposit...</p>
          <p className="mt-2 text-sm text-gray-500">
            Please wait while your transaction is being confirmed.
          </p>
        </div>
      )}

      {step === "success" && (
        <div className="flex flex-1 flex-col items-center justify-center py-12">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-lg font-medium">Deposit Successful!</p>
          <p className="mt-2 text-center text-sm text-gray-500">
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
    </Modal>
  );
}
