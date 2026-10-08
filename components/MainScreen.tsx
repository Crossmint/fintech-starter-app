import { useState } from "react";
import Image from "next/image";
import { useCrossmintAuth } from "@crossmint/client-sdk-react-ui";
import { DepositModal } from "@/components/deposit";
import { SendFundsModal } from "@/components/send-funds";
import { EarnYieldModal } from "@/components/earn-yield";
import { ActivityFeed } from "@/components/ActivityFeed";
import { NewProducts } from "./NewProducts";
import { DashboardSummary } from "./dashboard-summary";
import QuickSendCard, { type Contact } from "./quick-send/QuickSendCard";
import { AddContactModal } from "./quick-send/AddContactModal";
import RainCardFlow from "./cards/RainCardFlow";
import { CARDS_ENABLED } from "@/lib/config";

interface MainScreenProps {
  walletAddress?: string;
}

export function MainScreen({ walletAddress }: MainScreenProps) {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showEarnYieldModal, setShowEarnYieldModal] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showCardManage, setShowCardManage] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [sendRecipient, setSendRecipient] = useState<string | undefined>();
  const { logout } = useCrossmintAuth();

  return (
    <div className="flex h-full w-full justify-center gap-2 px-4 py-6">
      <div className="h-full w-full max-w-4xl">
        <div className="mb-4 flex h-12 w-full items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              className="h-fit w-12"
              alt="Logo"
              width={48}
              height={48}
              priority
              unoptimized
            />
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
        <NewProducts
          onEarnYieldClick={() => setShowEarnYieldModal(true)}
          onCardClick={() => setShowCardManage(true)}
        />
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <QuickSendCard
            contacts={contacts}
            onSelectContact={(contact) => {
              setSendRecipient(contact.address);
              setShowSendModal(true);
            }}
            onAddContact={() => setShowAddContact(true)}
          />
          {CARDS_ENABLED && (
            <RainCardFlow
              showManage={showCardManage}
              onShowManage={() => setShowCardManage(true)}
              onCloseManage={() => setShowCardManage(false)}
            />
          )}
        </div>
        <ActivityFeed />
        <DepositModal
          open={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          walletAddress={walletAddress || ""}
        />
        <SendFundsModal
          open={showSendModal}
          initialRecipient={sendRecipient}
          onClose={() => {
            setShowSendModal(false);
            setSendRecipient(undefined);
          }}
        />
        <AddContactModal
          open={showAddContact}
          onClose={() => setShowAddContact(false)}
          onAdd={(contact) => setContacts((prev) => [...prev, contact])}
        />
        <EarnYieldModal open={showEarnYieldModal} onClose={() => setShowEarnYieldModal(false)} />
      </div>
    </div>
  );
}
