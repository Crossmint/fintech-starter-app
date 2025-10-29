import Image from "next/image";
import { WalletBalance } from "./WalletBallance";
import { DepositButton } from "../common/DepositButton";
import { Container } from "../common/Container";
import { ArrowsRightLeftIcon, WalletIcon } from "@heroicons/react/24/outline";
import { Dropdown } from "../common/Dropdown";
import { useState } from "react";
import { WalletDetails } from "./WalletDetails";
import { useWallet, useAuth } from "@crossmint/client-sdk-react-ui";
import { WarningModal } from "./WarningModal";

interface DashboardSummaryProps {
  onDepositClick: () => void;
  onSendClick: () => void;
  onClaimPayClick?: () => void;
  onCashOutClick?: () => void;
}

export function DashboardSummary({ onDepositClick, onSendClick, onClaimPayClick, onCashOutClick }: DashboardSummaryProps) {
  const [showWalletDetails, setShowWalletDetails] = useState(false);
  const { wallet } = useWallet();
  const { user } = useAuth();
  const [openWarningModal, setOpenWarningModal] = useState(false);
  const dropdownOptions = [
    {
      icon: <ArrowsRightLeftIcon className="h-4 w-4" />,
      label: "Withdraw",
      onClick: () => {
        if (process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY?.includes("staging")) {
          setOpenWarningModal(true);
        } else {
          window.location.href = `https://pay.coinbase.com/v3/sell/input?${new URLSearchParams({
            appId: process.env.NEXT_PUBLIC_COINBASE_APP_ID!,
            addresses: JSON.stringify({ [wallet?.address || ""]: [wallet?.chain || ""] }),
            redirectUrl: window.location.origin,
            partnerUserId: user?.id!,
            assets: JSON.stringify(["USDC"]),
          })}`;
        }
      },
    },
    {
      icon: <WalletIcon className="h-4 w-4" />,
      label: "Wallet Details",
      onClick: () => {
        setShowWalletDetails(true);
      },
    },
  ];

  const dropdownTrigger = (
    <button className="bg-secondary hover:bg-secondary/80 rounded-full p-2.5">
      <Image src="/dots-vertical.svg" alt="Settings" width={24} height={24} />
    </button>
  );

  return (
    <Container className="flex w-full max-w-5xl flex-col items-center justify-between gap-4 md:flex-row md:items-stretch">
      <WalletBalance />
      <div className="flex w-full flex-col gap-2 md:w-auto md:justify-end">
        <div className="flex w-full items-center gap-2">
          <DepositButton onClick={onDepositClick} />
          <button
            type="button"
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground flex h-12 flex-grow items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition md:w-40"
            onClick={onSendClick}
          >
            <Image src="/arrow-up-right-icon-white.svg" alt="Add" width={24} height={24} /> Send
          </button>
          <Dropdown trigger={dropdownTrigger} options={dropdownOptions} />
        </div>
        {(onClaimPayClick || onCashOutClick) && (
          <div className="flex w-full items-center gap-2">
            {onClaimPayClick && (
              <button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 flex h-12 flex-grow items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white transition md:flex-1"
                onClick={onClaimPayClick}
              >
                💰 Claim Pay
              </button>
            )}
            {onCashOutClick && (
              <button
                type="button"
                className="bg-green-600 hover:bg-green-700 flex h-12 flex-grow items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white transition md:flex-1"
                onClick={onCashOutClick}
              >
                💵 Cash Out
              </button>
            )}
          </div>
        )}
      </div>
      <WalletDetails onClose={() => setShowWalletDetails(false)} open={showWalletDetails} />
      <WarningModal open={openWarningModal} onClose={() => setOpenWarningModal(false)} />
    </Container>
  );
}
