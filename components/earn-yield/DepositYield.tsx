import React, { useState } from "react";
import { EVMWallet, useWallet } from "@crossmint/client-sdk-react-ui";
import { AmountInput } from "../common/AmountInput";
import { PrimaryButton } from "../common/PrimaryButton";
import { useBalance } from "@/hooks/useBalance";
import { YieldOpportunity, enterYield } from "@/hooks/useYields";

interface DepositYieldProps {
  yieldOpportunity: YieldOpportunity;
  onSuccess: () => void;
  onProcessing: () => void;
}

// Format APY for display
const formatApy = (apy: number) => {
  return `${(apy * 100).toFixed(2)}%`;
};

export function DepositYield({ yieldOpportunity, onSuccess, onProcessing }: DepositYieldProps) {
  const { wallet } = useWallet();
  const { displayableBalance, refetch: refetchBalance } = useBalance();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAmountValid =
    !!amount &&
    !Number.isNaN(Number(amount)) &&
    Number(amount) > 0 &&
    Number(amount) <= Number(displayableBalance);

  // Calculate estimated yearly earnings
  const estimatedYearlyEarnings = isAmountValid
    ? (Number(amount) * (yieldOpportunity.rewardRate?.total || 0)).toFixed(2)
    : "0.00";

  const handleDeposit = async () => {
    if (!wallet?.address) {
      setError("No wallet connected");
      return;
    }

    if (!isAmountValid) {
      setError("Invalid amount");
      return;
    }

    setError(null);
    setIsLoading(true);
    onProcessing();

    try {
      // Get unsigned transactions from yield.xyz
      const response = await enterYield(yieldOpportunity.id, wallet.address, amount);
      // Sort transactions by stepIndex to ensure correct order (APPROVAL before SUPPLY)
      const sortedTransactions = [...(response.transactions || [])].sort(
        (a: any, b: any) => (a.stepIndex || 0) - (b.stepIndex || 0)
      );

      // Execute each transaction through Crossmint wallet
      const evmWallet = EVMWallet.from(wallet);

      for (let i = 0; i < sortedTransactions.length; i++) {
        const tx = sortedTransactions[i];
        const unsignedTx = JSON.parse(tx.unsignedTransaction);

        // Send the transaction with all relevant parameters
        const txResult = await evmWallet.sendTransaction({
          to: unsignedTx.to,
          data: unsignedTx.data,
          value: unsignedTx.value || "0x0",
          // Include gas parameters if available
          ...(unsignedTx.gasLimit && { gas: unsignedTx.gasLimit }),
        });

        // Small delay between transactions to allow state to update
        if (i < sortedTransactions.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      // Refresh balance after successful deposit
      await refetchBalance();
      onSuccess();
    } catch (err: any) {
      console.error("[Yield] Deposit error:", err);
      setError(err.message || "Failed to deposit. Please try again.");
      setIsLoading(false);
    }
  };

  // Demo mode handler (when API key is not configured)
  const handleDemoDeposit = () => {
    if (!isAmountValid) {
      setError("Invalid amount");
      return;
    }

    setError(null);
    onProcessing();

    // Simulate transaction processing
    setTimeout(() => {
      onSuccess();
    }, 2000);
  };

  const hasApiKey = !!process.env.NEXT_PUBLIC_YIELD_API_KEY;

  return (
    <div className="mt-4 flex w-full flex-col">
      {/* Yield Info Card */}
      <div className="from-primary/5 to-primary/10 mb-6 rounded-xl bg-gradient-to-br p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Current APY</p>
            <p className="text-primary text-2xl font-bold">
              {formatApy(yieldOpportunity.rewardRate?.total || 0)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Protocol</p>
            <p className="font-semibold text-gray-900">
              {yieldOpportunity.providerId
                ? yieldOpportunity.providerId.charAt(0).toUpperCase() +
                  yieldOpportunity.providerId.slice(1)
                : "Unknown"}
            </p>
          </div>
        </div>

        {yieldOpportunity.metadata.description && (
          <p className="mt-3 text-xs text-gray-500">{yieldOpportunity.metadata.description}</p>
        )}
      </div>

      {/* Amount Input */}
      <div className="mb-4 flex w-full flex-col items-center">
        <AmountInput amount={amount} onChange={setAmount} />
        <div
          className={`mt-1 text-sm ${
            Number(amount) > Number(displayableBalance) ? "text-red-600" : "text-gray-400"
          }`}
        >
          ${displayableBalance} available
        </div>
      </div>

      {/* Quick amount buttons */}
      <div className="mb-6 flex justify-center gap-2">
        {[25, 50, 75, 100].map((percent) => (
          <button
            key={percent}
            onClick={() => {
              const newAmount = ((Number(displayableBalance) * percent) / 100).toFixed(2);
              setAmount(newAmount);
            }}
            className="hover:border-primary hover:text-primary rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition"
          >
            {percent}%
          </button>
        ))}
      </div>

      {/* Estimated Earnings */}
      {isAmountValid && (
        <div className="mb-6 rounded-lg bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Estimated yearly earnings</span>
            <span className="text-primary font-semibold">${estimatedYearlyEarnings} USDC</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Based on current APY. Actual earnings may vary.
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {/* Demo Mode Notice */}
      {!hasApiKey && (
        <div className="mb-4 rounded-lg bg-yellow-50 p-3">
          <div className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-xs text-yellow-700">
              <strong>Demo Mode:</strong> Yield.xyz API key not configured. Add{" "}
              <code className="rounded bg-yellow-100 px-1">NEXT_PUBLIC_YIELD_API_KEY</code> to your{" "}
              <code className="rounded bg-yellow-100 px-1">.env</code> file for live transactions.
            </p>
          </div>
        </div>
      )}

      {/* Deposit Button */}
      <PrimaryButton
        onClick={hasApiKey ? handleDeposit : handleDemoDeposit}
        disabled={!isAmountValid || isLoading}
      >
        {isLoading ? "Processing..." : `Deposit ${amount || "0"} USDC`}
      </PrimaryButton>

      {/* Risk Disclaimer */}
      <p className="mt-4 text-center text-xs text-gray-400">
        By depositing, you acknowledge that DeFi protocols carry smart contract risks. Only deposit
        what you can afford to lose.
      </p>
    </div>
  );
}
