import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, ArrowRightLeft, Wallet, MoreVertical } from "lucide-react";
import { WalletBalance } from "./WalletBallance";
import { DepositButton } from "../common/DepositButton";
import { Container } from "../common/Container";
import { Dialog, DialogContent, DialogTitle } from "../common/Dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../common/DropdownMenu";
import { WalletDetails } from "./WalletDetails";
import { useWallet, useAuth } from "@crossmint/client-sdk-react-ui";

interface DashboardSummaryProps {
  onDepositClick: () => void;
  onSendClick: () => void;
}

export function DashboardSummary({ onDepositClick, onSendClick }: DashboardSummaryProps) {
  const [showWalletDetails, setShowWalletDetails] = useState(false);
  const { wallet } = useWallet();
  const { user } = useAuth();
  const [openWarningModal, setOpenWarningModal] = useState(false);

  const handleWithdraw = () => {
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
  };

  return (
    <>
      <Container className="flex w-full max-w-5xl flex-col items-center justify-between md:flex-row md:items-center">
        <WalletBalance />
        <div className="flex w-full items-center gap-3 md:w-auto md:justify-end">
          <button
            type="button"
            className="flex h-11 flex-grow items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-5 text-sm font-medium text-gray-900 transition hover:bg-gray-50 md:w-28 md:flex-grow-0"
            onClick={onSendClick}
          >
            <ArrowUpRight className="h-4 w-4" /> Send
          </button>
          <DepositButton onClick={onDepositClick} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full p-2 hover:bg-gray-100">
                <MoreVertical className="text-muted-foreground h-6 w-6" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={handleWithdraw}>
                <ArrowRightLeft className="h-4 w-4" />
                Withdraw
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setShowWalletDetails(true)}>
                <Wallet className="h-4 w-4" />
                Wallet Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Container>

      <WalletDetails onClose={() => setShowWalletDetails(false)} open={showWalletDetails} />

      <Dialog open={openWarningModal} onOpenChange={setOpenWarningModal}>
        <DialogContent className="flex h-[400px] max-h-[85vh] flex-col rounded-3xl bg-white sm:max-w-md">
          <DialogTitle className="sr-only">Withdraw is not enabled</DialogTitle>
          <div className="flex w-full flex-1 flex-col items-center justify-center px-4">
            <div className="mb-6 flex items-center justify-center">
              <Image
                src="/dollar.png"
                className="h-fit w-20"
                alt="Dollar"
                width={80}
                height={80}
                unoptimized
              />
            </div>
            <h2 className="mb-4 text-center text-2xl font-bold text-gray-900">
              Withdraw is not enabled
            </h2>
            <p className="text-center text-base text-gray-600">
              Withdraw is a production-only feature. Read about how to move to production{" "}
              <a
                className="text-primary hover:underline"
                href="https://github.com/Crossmint/fintech-starter-app?tab=readme-ov-file#enabling-withdrawals"
                target="_blank"
              >
                here
              </a>
            </p>
          </div>
          <div className="mt-auto w-full pt-8">
            <button
              onClick={() => setOpenWarningModal(false)}
              className="w-full rounded-full border border-gray-200 bg-white px-6 py-3.5 text-base font-semibold text-gray-900 transition hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
