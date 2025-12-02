import React, { useState } from "react";
import { YieldAction, YieldOpportunity, exitYield } from "@/hooks/useYields";
import { EVMWallet, useWallet } from "@crossmint/client-sdk-react-ui";

interface PositionsListProps {
  positions: YieldAction[];
  yields: YieldOpportunity[];
  isLoading: boolean;
  onExitSuccess: () => void;
}

// Format provider ID to display name
const formatProviderName = (yieldId: string) => {
  // Extract provider from yieldId like "base-usdc-aave-v3-lending"
  const parts = yieldId.split("-");
  if (parts.length >= 3) {
    const provider = parts[2]; // Usually the third part is the provider
    return provider.charAt(0).toUpperCase() + provider.slice(1);
  }
  return "Unknown";
};

// Format USD amount for display
const formatUsdAmount = (amountUsd: string | undefined, amount: string | undefined) => {
  // Prefer amountUsd if available, otherwise use amount
  if (amountUsd) {
    const num = Number(amountUsd);
    if (!isNaN(num)) {
      return num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  }
  if (amount) {
    const num = Number(amount);
    if (!isNaN(num)) {
      return num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  }
  return "0.00";
};

// Format APY for display
const formatApy = (apy: number) => {
  return `${(apy * 100).toFixed(2)}%`;
};

export function PositionsList({ positions, yields, isLoading, onExitSuccess }: PositionsListProps) {
  const { wallet } = useWallet();
  const [exitingId, setExitingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Find the yield opportunity for a position to get APY
  const getYieldForPosition = (yieldId: string) => {
    return yields.find((y) => y.id === yieldId);
  };

  const handleExit = async (position: YieldAction) => {
    if (!wallet?.address) {
      setError("No wallet connected");
      return;
    }

    setError(null);
    setExitingId(position.id);

    try {
      // Note: yield.xyz API expects human-readable amount
      // Use position.amount (not amountRaw) for consistency
      console.log("[Yield] Starting exit:", {
        yieldId: position.yieldId,
        address: wallet.address,
      });

      // Get unsigned transactions for exit
      const response = await exitYield(position.yieldId, wallet.address);

      console.log("[Yield] Got exit transactions:", response.transactions?.length || 0);

      // Sort transactions by stepIndex to ensure correct order
      const sortedTransactions = [...(response.transactions || [])].sort(
        (a: any, b: any) => (a.stepIndex || 0) - (b.stepIndex || 0)
      );

      // Execute each transaction through Crossmint wallet
      const evmWallet = EVMWallet.from(wallet);

      for (let i = 0; i < sortedTransactions.length; i++) {
        const tx = sortedTransactions[i];
        const unsignedTx = JSON.parse(tx.unsignedTransaction);

        console.log(`[Yield] Executing exit transaction ${i + 1}/${sortedTransactions.length}:`, {
          title: tx.title,
          type: tx.type,
          to: unsignedTx.to,
          stepIndex: tx.stepIndex,
        });

        // Send the transaction with all relevant parameters
        const txResult = await evmWallet.sendTransaction({
          to: unsignedTx.to,
          data: unsignedTx.data,
          value: unsignedTx.value || "0x0",
          ...(unsignedTx.gasLimit && { gas: unsignedTx.gasLimit }),
        });

        console.log(`[Yield] Exit transaction ${i + 1} result:`, txResult);

        // Small delay between transactions
        if (i < sortedTransactions.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      console.log("[Yield] All exit transactions completed successfully");
      onExitSuccess();
    } catch (err: any) {
      console.error("[Yield] Exit error:", err);
      setError(err.message || "Failed to exit position");
    } finally {
      setExitingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="border-t-primary mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200" />
        <p className="text-sm text-gray-500">Loading your positions...</p>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-3 rounded-full bg-gray-100 p-3">
          <svg
            className="h-6 w-6 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-gray-600">No active yield positions</p>
        <p className="mt-1 text-sm text-gray-400">
          Deposit USDC into a yield opportunity to start earning
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {/* Testnet disclaimer */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
        <p className="text-xs text-amber-700">
          ⚠️ <strong>Demo Mode:</strong> This wallet uses testnet tokens to interact with mainnet
          yield protocols. Testnet deposits won&apos;t actually earn yield — this is for
          demonstration purposes only.
        </p>
      </div>

      {positions.map((position) => {
        const yieldOpp = getYieldForPosition(position.yieldId);
        const apy = yieldOpp?.rewardRate?.total;
        const isExiting = exitingId === position.id;
        const displayAmount = formatUsdAmount(position.amountUsd, position.amount);

        // Calculate estimated yearly earnings
        const estimatedYearlyEarnings = apy
          ? (Number(position.amountUsd || position.amount || 0) * apy).toFixed(2)
          : null;

        return (
          <div
            key={position.id}
            className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {/* Token logo */}
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500">
                  <span className="text-lg font-bold text-white">$</span>
                </div>

                {/* Position info */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {formatProviderName(position.yieldId)}
                    </span>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Earning
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">${displayAmount} USDC</p>
                </div>
              </div>

              {/* APY */}
              {apy !== undefined && (
                <div className="text-right">
                  <div className="text-primary text-lg font-bold">{formatApy(apy)}</div>
                  <div className="text-xs text-gray-500">APY</div>
                </div>
              )}
            </div>

            {/* Earnings info */}
            <div className="mt-3 rounded-lg bg-green-50 p-2">
              {estimatedYearlyEarnings ? (
                <p className="text-xs text-green-700">
                  💰 Earning ~${estimatedYearlyEarnings} USDC/year at{" "}
                  {apy ? formatApy(apy) : "current"} rate
                </p>
              ) : (
                <p className="text-xs text-green-700">📈 Position active - earning yield</p>
              )}
            </div>

            {/* Exit button */}
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => handleExit(position)}
                disabled={isExiting}
                className="rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isExiting ? "Exiting..." : "Exit Position"}
              </button>
            </div>

            {/* Created date */}
            <p className="mt-2 text-xs text-gray-400">
              Enrolled {new Date(position.createdAt).toLocaleDateString()}
            </p>
          </div>
        );
      })}
    </div>
  );
}
