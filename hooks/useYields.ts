import { useQuery } from "@tanstack/react-query";

// Token type used throughout the yield.xyz API
export interface YieldToken {
  address?: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  coinGeckoId?: string;
  network?: string;
  isPoints?: boolean;
}

// Reward rate component
export interface RewardComponent {
  rate: number;
  rateType: "APY" | "APR";
  token: YieldToken;
  yieldSource?: string;
  description?: string;
}

// Entry/Exit field definition
export interface ArgumentField {
  name: string;
  type: string;
  label: string;
  description: string;
  required: boolean;
  placeholder?: string;
  minimum?: string;
  maximum?: string | null;
  isArray?: boolean;
}

// Full yield opportunity type based on actual API response
export interface YieldOpportunity {
  id: string;
  network: string;
  chainId?: string;
  providerId: string;

  // Token information
  token: YieldToken;
  inputTokens: YieldToken[];
  tokens: YieldToken[];
  outputToken?: YieldToken;

  // Reward information
  rewardRate: {
    total: number;
    rateType: "APY" | "APR";
    components?: RewardComponent[];
  };

  // Status
  status: {
    enter: boolean;
    exit: boolean;
  };

  // Metadata
  metadata: {
    name: string;
    description?: string;
    documentation?: string;
    logoURI?: string;
    underMaintenance?: boolean;
    deprecated?: boolean;
    supportedStandards?: string[];
  };

  // Mechanics
  mechanics: {
    type: "staking" | "restaking" | "lending" | "vault" | "rwa";
    requiresValidatorSelection?: boolean;
    rewardSchedule?: string;
    rewardClaiming?: string;
    gasFeeToken?: YieldToken;
    entryLimits?: {
      minimum?: string;
      maximum?: string | null;
    };
    supportsLedgerWalletApi?: boolean;
    arguments?: {
      enter?: {
        fields: ArgumentField[];
      };
      exit?: {
        fields: ArgumentField[];
      };
    };
    possibleFeeTakingMechanisms?: {
      depositFee?: boolean;
      managementFee?: boolean;
      performanceFee?: boolean;
      validatorRebates?: boolean;
    };
  };

  // Tags for filtering
  tags?: string[];
}

// Transaction within a user action
export interface YieldTransaction {
  id: string;
  title: string;
  network: string;
  status: "CREATED" | "PENDING" | "CONFIRMED" | "FAILED";
  type: string;
  hash: string | null;
  createdAt: string;
  broadcastedAt: string | null;
  signedTransaction: string | null;
  unsignedTransaction: string;
  stepIndex: number;
  gasEstimate?: string;
}

// User's yield action (position)
export interface YieldAction {
  id: string;
  intent: "enter" | "exit";
  type: string;
  yieldId: string;
  address: string;
  amount: string;
  amountRaw: string;
  amountUsd: string;
  transactions: YieldTransaction[];
  executionPattern: string;
  rawArguments: unknown;
  createdAt: string;
  completedAt: string | null;
  status: "CREATED" | "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
}

// Response from GET /v1/actions
export interface YieldActionsResponse {
  items: YieldAction[];
  total: number;
  offset: number;
  limit: number;
}

const YIELD_API_BASE_URL = "https://api.yield.xyz";
export const YIELD_CHAIN_NETWORK = "base";

// Get an API key from https://yield.xyz
const getApiKey = () => process.env.NEXT_PUBLIC_YIELD_API_KEY || "";

async function fetchYields(): Promise<YieldOpportunity[]> {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.warn(
      "Yield.xyz API key not configured. Set NEXT_PUBLIC_YIELD_API_KEY in your .env file."
    );
    return [];
  }

  try {
    const params = new URLSearchParams({
      network: YIELD_CHAIN_NETWORK,
      limit: "10",
      token: "USDC",
    });

    const url = `${YIELD_API_BASE_URL}/v1/yields?${params.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Yield.xyz] API error:", response.status, errorText);
      throw new Error(`Failed to fetch yields: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Handle different possible response formats
    const yields = data.data || data.items || (Array.isArray(data) ? data : []);
    return yields;
  } catch (error) {
    console.error("[Yield.xyz] Error fetching yields:", error);
    return [];
  }
}

// Response type for enter/exit actions
export interface YieldActionResponse {
  transactions: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    unsignedTransaction: string;
    stepIndex: number;
    network?: string;
    gasEstimate?: string;
  }>;
  yieldId?: string;
  address?: string;
}

export async function enterYield(
  yieldId: string,
  address: string,
  amount: string
): Promise<YieldActionResponse> {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error("Yield.xyz API key not configured");
  }

  console.log("[Yield.xyz] Entering yield:", { yieldId, address, amount });

  const response = await fetch(`${YIELD_API_BASE_URL}/v1/actions/enter`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({
      yieldId,
      address,
      arguments: { amount },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Yield.xyz] Enter error:", response.status, errorText);
    let errorMessage = "Failed to create enter transaction";
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorMessage;
    } catch {
      // ignore parse error
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// Get balance for a yield position
export async function getYieldBalance(yieldId: string, address: string): Promise<string> {
  const apiKey = getApiKey();

  if (!apiKey) {
    return "0";
  }

  const response = await fetch(
    `${YIELD_API_BASE_URL}/v1/yields/${yieldId}/balances?address=${address}`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    }
  );

  if (!response.ok) {
    return "0";
  }

  const data = await response.json();
  const activeBalance = data.balances?.find((b: { type: string }) => b.type === "active");
  return activeBalance?.amount || "0";
}

export async function exitYield(
  yieldId: string,
  address: string,
  amount?: string
): Promise<YieldActionResponse> {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error("Yield.xyz API key not configured");
  }

  console.log("[Yield.xyz] Exiting yield:", { yieldId, address, amount });

  const response = await fetch(`${YIELD_API_BASE_URL}/v1/actions/exit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({
      yieldId,
      address,
      arguments: {
        amount,
        useMaxAmount: true,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Yield.xyz] Exit error:", response.status, errorText);
    let errorMessage = "Failed to create exit transaction";
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorMessage;
    } catch {
      // ignore parse error
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// Fetch user's yield actions (positions)
export async function getUserYieldActions(address: string): Promise<YieldAction[]> {
  const apiKey = getApiKey();

  if (!apiKey || !address) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      address,
      offset: "0",
      limit: "20",
    });

    const url = `${YIELD_API_BASE_URL}/v1/actions?${params.toString()}`;
    console.log("[Yield.xyz] Fetching user actions from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Yield.xyz] Actions error:", response.status, errorText);
      return [];
    }

    const data: YieldActionsResponse = await response.json();
    console.log("[Yield.xyz] User actions:", data.items?.length || 0, "positions found");

    return data.items || [];
  } catch (error) {
    console.error("[Yield.xyz] Error fetching user actions:", error);
    return [];
  }
}

// Hook to get user's active yield positions
export function useYieldPositions(address: string | undefined) {
  const {
    data: actions = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["yieldPositions", address],
    queryFn: () => getUserYieldActions(address!),
    staleTime: 30 * 1000, // Cache for 30 seconds
    enabled: !!address && !!getApiKey(),
  });

  // Determine active positions by checking if there's no "exit" after the "enter" for each yieldId
  // A position is active if:
  // 1. There's an "enter" action
  // 2. There's no "exit" action with a createdAt date after the enter action
  const activePositions = (() => {
    // Group actions by yieldId
    const actionsByYield = new Map<string, YieldAction[]>();
    for (const action of actions) {
      const existing = actionsByYield.get(action.yieldId) || [];
      existing.push(action);
      actionsByYield.set(action.yieldId, existing);
    }

    const active: YieldAction[] = [];

    for (const [yieldId, yieldActions] of actionsByYield) {
      // Sort by createdAt descending (most recent first)
      const sorted = [...yieldActions].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Find the most recent enter action
      const lastEnter = sorted.find((a) => a.intent === "enter");
      if (!lastEnter) continue;

      // Check if there's an exit action after the enter
      const exitAfterEnter = sorted.find(
        (a) =>
          a.intent === "exit" &&
          new Date(a.createdAt).getTime() > new Date(lastEnter.createdAt).getTime()
      );

      // If no exit after enter (or exit failed), position is still active
      if (!exitAfterEnter || exitAfterEnter.status === "FAILED") {
        active.push(lastEnter);
      }
    }

    return active;
  })();

  return {
    positions: activePositions,
    positionCount: activePositions.length,
    allActions: actions,
    isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    refetch,
  };
}

export function useYields() {
  const {
    data: yields = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["yields-testnet"],
    queryFn: () => fetchYields(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    enabled: !!getApiKey(),
  });

  // Sort by APY descending
  const sortedYields = [...yields].sort(
    (a, b) => (b.rewardRate?.total || 0) - (a.rewardRate?.total || 0)
  );

  // Get the best APY for display
  const bestApy = sortedYields.length > 0 ? sortedYields[0].rewardRate?.total : 0;

  return {
    yields: sortedYields,
    bestApy,
    isLoading,
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    refetch,
  };
}
