import { useState } from "react";
import Image from "next/image";
import { useCrossmintAuth, useWallet } from "@crossmint/client-sdk-react-ui";
import { DepositModal } from "@/components/deposit";
import { SendFundsModal } from "@/components/send-funds";
import { EarnYieldModal } from "@/components/earn-yield";
import { ActivityFeed } from "@/components/ActivityFeed";
import { NewProducts } from "./NewProducts";
import { DashboardSummary } from "./dashboard-summary";
import { AddContactModal } from "./quick-send/AddContactModal";
import { useContacts } from "@/hooks/useContacts";
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
  const [hasCard, setHasCard] = useState(false);
  const { wallet } = useWallet();
  const { contacts, addContact } = useContacts(wallet?.address);
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
          contacts={contacts}
          onSelectContact={(contact) => {
            setSendRecipient(contact.address);
            setShowSendModal(true);
          }}
          onAddContact={() => setShowAddContact(true)}
        />
        <NewProducts
          onEarnYieldClick={() => setShowEarnYieldModal(true)}
          onCardClick={() => setShowCardManage(true)}
          hasCard={hasCard}
        />
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
        {CARDS_ENABLED && (
          <RainCardFlow
            showManage={showCardManage}
            onCloseManage={() => setShowCardManage(false)}
            onCardStatusChange={setHasCard}
          />
        )}
        <AddContactModal
          open={showAddContact}
          onClose={() => setShowAddContact(false)}
          onAdd={addContact}
        />
        <EarnYieldModal open={showEarnYieldModal} onClose={() => setShowEarnYieldModal(false)} />
      </div>
    </div>
  );
}
