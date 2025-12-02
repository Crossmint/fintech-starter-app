import React from "react";
import { YieldOpportunity } from "@/hooks/useYields";

interface YieldListProps {
  yields: YieldOpportunity[];
  isLoading: boolean;
  error: string | null;
  onSelectYield: (yieldOpp: YieldOpportunity) => void;
}

// Protocol styling (colors for gradient backgrounds)
const getProtocolStyle = (providerId?: string) => {
  const styleMap: Record<string, { bg: string; text: string; initial: string }> = {
    aave: { bg: "bg-gradient-to-br from-purple-500 to-pink-500", text: "text-white", initial: "A" },
    morpho: { bg: "bg-gradient-to-br from-blue-500 to-cyan-500", text: "text-white", initial: "M" },
    compound: {
      bg: "bg-gradient-to-br from-green-500 to-emerald-500",
      text: "text-white",
      initial: "C",
    },
    gauntlet: {
      bg: "bg-gradient-to-br from-orange-500 to-red-500",
      text: "text-white",
      initial: "G",
    },
    fluid: {
      bg: "bg-gradient-to-br from-indigo-500 to-purple-500",
      text: "text-white",
      initial: "F",
    },
    default: {
      bg: "bg-gradient-to-br from-gray-400 to-gray-600",
      text: "text-white",
      initial: "?",
    },
  };

  return styleMap[providerId?.toLowerCase() || "default"] || styleMap.default;
};

// Format provider ID to display name
const formatProviderName = (providerId?: string) => {
  if (!providerId) return "Unknown";
  // Capitalize first letter
  return providerId.charAt(0).toUpperCase() + providerId.slice(1);
};

// Format APY for display
const formatApy = (apy: number) => {
  return `${(apy * 100).toFixed(2)}%`;
};

// Get mechanic type label
const getMechanicLabel = (type: string) => {
  const labels: Record<string, string> = {
    lending: "Lending",
    vault: "Vault",
    staking: "Staking",
    restaking: "Restaking",
    rwa: "RWA",
  };
  return labels[type] || type;
};

export function YieldList({ yields, isLoading, error, onSelectYield }: YieldListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-12">
        <div className="border-t-primary mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200" />
        <p className="text-gray-500">Loading yield opportunities...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-12">
        <div className="mb-4 rounded-full bg-red-100 p-3">
          <svg
            className="h-6 w-6 text-red-500"
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
        </div>
        <p className="text-gray-700">{error}</p>
      </div>
    );
  }

  if (yields.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-12">
        <div className="mb-4 rounded-full bg-gray-100 p-3">
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
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <p className="text-gray-500">No yield opportunities available for this network.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 flex w-full flex-col gap-3">
      <div className="mb-2 px-1">
        <p className="text-sm text-gray-500">
          Select a yield opportunity to deposit your USDC and start earning.
        </p>
      </div>

      {yields.map((yieldOpp) => {
        const style = getProtocolStyle(yieldOpp.providerId);
        const canEnter = yieldOpp.status?.enter !== false;
        const logoUrl = yieldOpp.token?.logoURI || yieldOpp.metadata?.logoURI;

        return (
          <button
            key={yieldOpp.id}
            onClick={() => canEnter && onSelectYield(yieldOpp)}
            disabled={!canEnter}
            className={`group w-full rounded-xl border border-gray-100 bg-white p-4 text-left shadow-sm transition ${
              canEnter ? "hover:border-primary/30 hover:shadow-md" : "cursor-not-allowed opacity-60"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Protocol Logo */}
                {logoUrl ? (
                  <img src={logoUrl} alt={yieldOpp.providerId} className="h-10 w-10 rounded-full" />
                ) : (
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${style.bg} ${style.text} text-lg font-bold`}
                  >
                    {style.initial}
                  </div>
                )}

                {/* Protocol Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {formatProviderName(yieldOpp.providerId)}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {getMechanicLabel(yieldOpp.mechanics?.type || "vault")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{yieldOpp.metadata.name}</p>
                </div>
              </div>

              {/* APY */}
              <div className="text-right">
                <div className="text-primary text-lg font-bold">
                  {formatApy(yieldOpp.rewardRate?.total || 0)}
                </div>
                <div className="text-xs text-gray-500">APY</div>
              </div>
            </div>

            {/* Description (if available) */}
            {yieldOpp.metadata.description && (
              <p className="mt-2 line-clamp-2 text-xs text-gray-400">
                {yieldOpp.metadata.description}
              </p>
            )}

            {/* Action indicator */}
            {canEnter && (
              <div className="mt-3 flex items-center justify-end opacity-0 transition group-hover:opacity-100">
                <span className="text-primary text-xs font-medium">Select to deposit →</span>
              </div>
            )}
          </button>
        );
      })}

      {/* Info footer */}
      <div className="mt-4 rounded-lg bg-blue-50 p-3">
        <div className="flex items-start gap-2">
          <svg
            className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-xs text-blue-700">
            Yields are provided by trusted DeFi protocols. APY rates are variable and may change
            based on market conditions. Powered by{" "}
            <a
              href="https://yield.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline"
            >
              Yield.xyz
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
