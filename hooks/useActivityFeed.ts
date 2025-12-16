import { useWallet } from "@crossmint/client-sdk-react-ui";
import { useQuery } from "@tanstack/react-query";
import { getUserYieldActions, YieldAction } from "./useYields";

// Unified activity event type
export interface ActivityEvent {
  from_address: string;
  to_address?: string;
  timestamp: number;
  type: string;
  amount: string;
  token_symbol?: string;
}

// Transform yield action to activity event format
function yieldActionToActivityEvent(action: YieldAction): ActivityEvent {
  const isEnter = action.intent === "enter";
  const type = isEnter ? "yield-enter" : "yield-exit";

  return {
    from_address: action.address,
    timestamp: new Date(action.createdAt).getTime(),
    type,
    amount: action.amountUsd || action.amount || "0",
    token_symbol: "USDC",
  };
}

export function useActivityFeed() {
  const { wallet } = useWallet();

  // Fetch wallet activity
  const walletActivityQuery = useQuery({
    queryKey: ["walletActivity", wallet?.address],
    queryFn: async () => await wallet?.experimental_activity(),
    enabled: !!wallet?.address,
  });

  // Fetch yield actions - uses same query key as useYieldPositions for cache sharing
  const yieldActionsQuery = useQuery({
    queryKey: ["yieldPositions", wallet?.address],
    queryFn: () => getUserYieldActions(wallet!.address),
    staleTime: 30 * 1000, // Match useYieldPositions cache time
    enabled: !!wallet?.address,
  });

  // Combine and sort events
  const combinedEvents = (() => {
    const walletEvents: ActivityEvent[] = walletActivityQuery.data?.events || [];

    // Transform yield actions to activity events
    const yieldEvents: ActivityEvent[] = (yieldActionsQuery.data || []).map(
      yieldActionToActivityEvent
    );

    // Combine and sort by timestamp (most recent first)
    const allEvents = [...walletEvents, ...yieldEvents].sort((a, b) => b.timestamp - a.timestamp);

    return allEvents;
  })();

  return {
    data: { events: combinedEvents },
    isLoading: walletActivityQuery.isLoading || yieldActionsQuery.isLoading,
    error: walletActivityQuery.error || yieldActionsQuery.error,
    refetch: async () => {
      await Promise.all([walletActivityQuery.refetch(), yieldActionsQuery.refetch()]);
    },
  };
}
