import React from "react";
import { Info } from "lucide-react";
import Image from "next/image";
import { YieldOpportunity } from "@/hooks/useYields";

interface YieldListProps {
  yields: YieldOpportunity[];
  isLoading: boolean;
  error: string | null;
  onSelectYield: (yieldOpp: YieldOpportunity) => void;
}

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
        <div className="border-primary mb-4 h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" />
        <p className="text-muted-foreground">Loading yield opportunities...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-12">
        <div className="mb-4 rounded-full bg-red-100 p-3">
          <Info className="h-6 w-6 text-red-500" />
        </div>
        <p className="text-gray-700">{error}</p>
      </div>
    );
  }

  if (yields.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-12">
        <div className="mb-4 rounded-full bg-gray-100 p-3">
          <Info className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-muted-foreground">No yield opportunities available for this network.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 flex w-full flex-col gap-3">
      {/* Info banner */}
      <div className="rounded-xl bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
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

      {/* Yield list */}
      {yields.map((yieldOpp) => {
        const canEnter = yieldOpp.status?.enter !== false;

        return (
          <button
            key={yieldOpp.id}
            onClick={() => canEnter && onSelectYield(yieldOpp)}
            disabled={!canEnter}
            className={`group w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition ${
              canEnter ? "hover:border-primary/30 hover:shadow-md" : "cursor-not-allowed opacity-60"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image src={"/usdc.svg"} alt={yieldOpp.metadata.name} width={36} height={36} />

                {/* Protocol Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {formatProviderName(yieldOpp.providerId)}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                      {getMechanicLabel(yieldOpp.mechanics?.type || "vault")}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm">{yieldOpp.metadata.name}</p>
                </div>
              </div>

              {/* APY */}
              <div className="text-right">
                <div className="text-lg font-semibold text-green-500">
                  {formatApy(yieldOpp.rewardRate?.total || 0)}
                </div>
                <div className="text-muted-foreground text-xs">APY</div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
