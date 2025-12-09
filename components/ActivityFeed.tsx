import React from "react";
import Image from "next/image";
import { useWallet } from "@crossmint/client-sdk-react-ui";
import { ArrowUpRight, Plus, Percent, Ban } from "lucide-react";
import { useActivityFeed } from "../hooks/useActivityFeed";
import { Container } from "./common/Container";
import { cn } from "@/lib/utils";

// Helper to get icon based on event type
const getActivityIcon = (eventType: string, isOutgoing: boolean) => {
  // Check for yield events
  if (eventType?.toLowerCase().includes("yield")) {
    return <Percent className="text-primary h-5 w-5" />;
  }
  // Check for canceled/failed events
  if (eventType?.toLowerCase().includes("cancel") || eventType?.toLowerCase().includes("fail")) {
    return <Ban className="text-muted-foreground h-5 w-5" />;
  }
  // Sent vs Received
  if (isOutgoing) {
    return <ArrowUpRight className="text-primary h-5 w-5" />;
  }
  return <Plus className="text-primary h-5 w-5" />;
};

// Helper to format activity title
const getActivityTitle = (eventType: string | undefined, isOutgoing: boolean) => {
  if (eventType?.toLowerCase().includes("yield")) return "Yield";
  if (eventType?.toLowerCase().includes("cancel")) return "Transfer canceled";
  if (eventType?.toLowerCase().includes("fail")) return "Transfer failed";
  return isOutgoing ? "Sent" : "Deposit";
};

// Helper to format date
const formatActivityDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Moments ago";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export function ActivityFeed() {
  const { data, isLoading, error } = useActivityFeed();

  const { wallet } = useWallet();
  return (
    <Container className="mt-3 flex h-[420px] w-full max-w-5xl flex-col">
      <div className="mb-4 text-base font-semibold text-gray-900">Last activity</div>
      <div className="flex w-full flex-1 flex-col items-center justify-start overflow-y-auto">
        {!isLoading && !data?.events?.length && (
          <div className="mt-6 flex flex-col items-center">
            <Image src="/activity-graphic.png" alt="No transactions" width={80} height={80} />
            <div className="mb-2 text-center font-semibold text-gray-900">No transactions yet</div>
            <div className="text-muted-foreground max-w-xs text-center text-xs">
              Your transactions will show here once you've made your first deposit
            </div>
          </div>
        )}
        {isLoading && (
          <div className="flex flex-1 items-center justify-center">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          </div>
        )}
        {error && <div className="text-center text-red-500">{error.message}</div>}
        {!isLoading && !error && data?.events?.length && data?.events?.length > 0 ? (
          <ul className="flex w-full flex-col gap-4">
            {data?.events.slice(0, 10).map((event) => {
              const isOutgoing = event.from_address.toLowerCase() === wallet?.address.toLowerCase();
              const isCanceledOrFailed =
                event.type?.toLowerCase().includes("cancel") ||
                event.type?.toLowerCase().includes("fail");
              return (
                <li key={event.transaction_hash} className="flex items-center gap-4">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full",
                      isCanceledOrFailed ? "bg-gray-100" : "bg-green-50"
                    )}
                  >
                    {getActivityIcon(event.type, isOutgoing)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">
                      {getActivityTitle(event.type, isOutgoing)}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {formatActivityDate(event.timestamp)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={cn(
                        "text-sm font-semibold",
                        isCanceledOrFailed
                          ? "text-gray-500"
                          : isOutgoing
                            ? "text-gray-900"
                            : "text-primary"
                      )}
                    >
                      {isOutgoing ? "-" : "+"}${Number(event.amount).toFixed(2)}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {event.token_symbol ? event.token_symbol : "USD"}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </Container>
  );
}
