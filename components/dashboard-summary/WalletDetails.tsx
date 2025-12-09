import { useAuth, useWallet } from "@crossmint/client-sdk-react-ui";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "../common/Dialog";
import { Details } from "../common/Details";
import { CopyWrapper } from "../common/CopyWrapper";
import { shortenAddress } from "@/utils/shortenAddress";

export function WalletDetails({ onClose, open }: { onClose: () => void; open: boolean }) {
  const { wallet } = useWallet();
  const { user } = useAuth();

  // Format chain name for display (e.g., "base-sepolia" -> "Base-Sepolia")
  const formatChainName = (chain: string) => {
    return chain
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("-");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="flex h-[580px] max-h-[85vh] flex-col rounded-3xl bg-white sm:max-w-md">
        <DialogTitle className="sr-only">Wallet Details</DialogTitle>
        <div className="flex w-full flex-1 flex-col items-center pt-4">
          <div className="mb-6 flex items-center justify-center">
            <Image src="/wallet-graphic.png" alt="Wallet" width={80} height={80} unoptimized />
          </div>
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">Wallet Details</h2>
          <Details
            values={[
              {
                label: "Address",
                value: (
                  <CopyWrapper toCopy={wallet?.address} iconPosition="right">
                    <span>{shortenAddress(wallet?.address || "")}</span>
                  </CopyWrapper>
                ),
              },
              {
                label: "Chain",
                value: <span>{formatChainName(wallet?.chain || "")}</span>,
              },
              {
                label: "Owner",
                value: user?.email || "",
              },
            ]}
          />
        </div>
        <div className="mt-auto w-full pt-8">
          <button
            onClick={onClose}
            className="w-full rounded-full border border-gray-200 bg-white px-6 py-3.5 text-base font-semibold text-gray-900 transition hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
