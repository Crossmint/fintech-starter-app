import React from "react";
import { Details } from "../common/Details";
import { PrimaryButton } from "../common/PrimaryButton";
import { isEmail } from "@/lib/utils";
import { shortenAddress } from "@/utils/shortenAddress";

interface OrderPreviewProps {
  userEmail: string;
  recipient: string;
  amount: string;
  error: string | null;
  isLoading: boolean;
  onConfirm: () => void;
}

export function OrderPreview({
  userEmail,
  recipient,
  amount,
  error,
  isLoading,
  onConfirm,
}: OrderPreviewProps) {
  return (
    <div className="flex w-full flex-grow flex-col justify-between">
      <div>
        <div className="text-foreground mt-6 text-sm font-semibold uppercase">Details</div>
        <Details
          values={[
            { label: "From", value: userEmail },
            { label: "To", value: isEmail(recipient) ? recipient : shortenAddress(recipient) },
            { label: "Amount", value: `$ ${amount}` },
          ]}
        />
        {error && <div className="mb-2 text-center text-red-500">{error}</div>}
      </div>
      <div>
        <PrimaryButton onClick={onConfirm} disabled={isLoading}>
          {isLoading ? "Sending..." : `Send $ ${amount}`}
        </PrimaryButton>
      </div>
    </div>
  );
}
