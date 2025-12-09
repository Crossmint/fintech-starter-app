import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@crossmint/client-sdk-react-ui";
import { DepositModal } from "@/components/deposit";
import { SendFundsModal } from "@/components/send-funds";
import { EarnYieldModal } from "@/components/earn-yield";
import { ActivityFeed } from "@/components/ActivityFeed";
import { NewProducts } from "./NewProducts";
import { DashboardSummary } from "./dashboard-summary";

interface MainScreenProps {
  walletAddress?: string;
}

export function MainScreen({ walletAddress }: MainScreenProps) {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showEarnYieldModal, setShowEarnYieldModal] = useState(false);
  const { logout } = useAuth();

  return (
    <div className="flex h-full w-full items-center justify-center gap-2 px-4 py-6">
      <div className="h-full w-full max-w-3xl">
        <div className="mb-4 flex h-12 w-full items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Logo" width={44} height={44} priority />
            <div className="text-xl font-semibold text-gray-900">Dashboard</div>
          </div>
          <button onClick={logout} className="text-muted-foreground text-sm hover:text-gray-700">
            Log out
          </button>
        </div>
        <DashboardSummary
          onDepositClick={() => setShowDepositModal(true)}
          onSendClick={() => setShowSendModal(true)}
        />
        <NewProducts onEarnYieldClick={() => setShowEarnYieldModal(true)} />
        <ActivityFeed />
        <DepositModal
          open={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          walletAddress={walletAddress || ""}
        />
        <SendFundsModal open={showSendModal} onClose={() => setShowSendModal(false)} />
        <EarnYieldModal open={showEarnYieldModal} onClose={() => setShowEarnYieldModal(false)} />
      </div>
    </div>
  );
}
