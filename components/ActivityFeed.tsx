import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useWallet } from "@crossmint/client-sdk-react-ui";
import { ArrowUpRight, Plus, Percent, Ban } from "lucide-react";
import { useActivityFeed } from "../hooks/useActivityFeed";
import { Container } from "./common/Container";
import { ScrollArea } from "./common/ScrollArea";
import { cn } from "@/lib/utils";

const PREVIEW_LIMIT = 8;

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
  if (eventType?.toLowerCase().includes("yield-enter")) return "Yield Deposit";
  if (eventType?.toLowerCase().includes("yield-exit")) return "Yield Withdrawal";
  if (eventType?.toLowerCase().includes("yield")) return "Yield";
  if (eventType?.toLowerCase().includes("cancel")) return "Transfer canceled";
  if (eventType?.toLowerCase().includes("fail")) return "Transfer failed";
  return isOutgoing ? "Sent" : "Deposit";
};

// Check if event is yield-related
const isYieldEvent = (eventType: string | undefined) => {
  return eventType?.toLowerCase().includes("yield");
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
  const [isExpanded, setIsExpanded] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Detect when user scrolls to the bottom of the preview
  useEffect(() => {
    if (!sentinelRef.current || isExpanded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsExpanded(true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [isExpanded, data?.events?.length]);

  const events = data?.events || [];
  const displayedEvents = isExpanded ? events : events.slice(0, PREVIEW_LIMIT);
  const hasMoreEvents = events.length > PREVIEW_LIMIT;

  return (
    <Container className="mt-3 flex h-[420px] w-full max-w-5xl flex-col overflow-hidden">
      <div className="mb-4 text-base font-semibold text-gray-900">Last activity</div>
      <ScrollArea className="h-0 flex-1">
        {!isLoading && !events.length && (
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
        {!isLoading && !error && displayedEvents.length > 0 ? (
          <ul className="flex w-full flex-col gap-4 pr-4">
            {displayedEvents.map((event, index) => {
              const isOutgoing = event.from_address.toLowerCase() === wallet?.address.toLowerCase();
              const isCanceledOrFailed =
                event.type?.toLowerCase().includes("cancel") ||
                event.type?.toLowerCase().includes("fail");
              const isYield = isYieldEvent(event.type);
              const isYieldEnter = event.type?.toLowerCase().includes("yield-enter");

              // For yield events: enter = outgoing (depositing), exit = incoming (withdrawing)
              const showAsOutgoing = isYield ? isYieldEnter : isOutgoing;

              return (
                <li
                  key={"index-" + index + "-" + event.timestamp.toString()}
                  className="flex items-center gap-4"
                >
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full",
                      isCanceledOrFailed ? "bg-gray-100" : "bg-green-50"
                    )}
                  >
                    {getActivityIcon(event.type, showAsOutgoing)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900">
                      {getActivityTitle(event.type, showAsOutgoing)}
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
                          : isYield
                            ? "text-primary"
                            : showAsOutgoing
                              ? "text-gray-900"
                              : "text-primary"
                      )}
                    >
                      {showAsOutgoing ? "-" : "+"}${Number(event.amount).toFixed(2)}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {event.token_symbol ? event.token_symbol : "USD"}
                    </div>
                  </div>
                </li>
              );
            })}
            {/* Sentinel element to detect scroll to bottom */}
            {!isExpanded && hasMoreEvents && (
              <div ref={sentinelRef} className="flex justify-center py-2" />
            )}
          </ul>
        ) : null}
      </ScrollArea>
    </Container>
  );
}
