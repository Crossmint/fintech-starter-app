import { CrossmintEmbeddedCheckout, useCrossmintCheckout } from "@crossmint/client-sdk-react-ui";
import { useEffect } from "react";
import { AmountBreakdown } from "./AmountBreakdown";
import { cn } from "@/lib/utils";

const USDC_MINT = process.env.NEXT_PUBLIC_USDC_MINT;
const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID;
const USDC_LOCATOR = `${CHAIN_ID}:${USDC_MINT}${CHAIN_ID === "solana" ? "" : `:${USDC_MINT}`}`;

// Get CSS variables
const primaryColor =
  typeof window !== "undefined"
    ? window.getComputedStyle(document.documentElement).getPropertyValue("--primary").trim()
    : "#000000"; // fallback color
const primaryHoverColor =
  typeof window !== "undefined"
    ? window.getComputedStyle(document.documentElement).getPropertyValue("--primary-hover").trim()
    : "#333333"; // fallback color

const CHECKOUT_APPEARANCE = {
  rules: {
    Label: {
      font: {
        family: "Inter, sans-serif",
        size: "14px",
        weight: "500",
      },
      colors: {
        text: "#374151",
      },
    },
    Input: {
      borderRadius: "8px",
      font: {
        family: "Inter, sans-serif",
        size: "16px",
        weight: "400",
      },
      colors: {
        text: "#000000",
        background: "#FFFFFF",
        border: "#E0E0E0",
        boxShadow: "none",
        placeholder: "#999999",
      },
      hover: {
        colors: {
          border: "#0074D9",
        },
      },
      focus: {
        colors: {
          border: "#0074D9",
          boxShadow: "none",
        },
      },
    },
    PrimaryButton: {
      font: {
        family: "Inter, sans-serif",
      },
      colors: {
        background: primaryColor,
      },
      hover: {
        colors: {
          background: primaryHoverColor,
        },
      },
      disabled: {
        colors: {
          background: "#F1F5F9",
        },
      },
    },
    DestinationInput: {
      display: "hidden",
    },
    ReceiptEmailInput: {
      display: "hidden",
    },
  },
  variables: {
    colors: {
      accent: primaryColor,
    },
  },
} as const;

type CheckoutProps = {
  amount: string;
  walletAddress: string;
  onPaymentCompleted: () => void;
  receiptEmail: string;
  onProcessingPayment: () => void;
  isAmountValid: boolean;
  step: "options" | "processing" | "completed";
  goBack: () => void;
};

export function Checkout({
  amount,
  walletAddress,
  onPaymentCompleted,
  receiptEmail,
  onProcessingPayment,
  isAmountValid,
  step,
  goBack,
}: CheckoutProps) {
  const { order } = useCrossmintCheckout();
  console.log("order", order);

  useEffect(() => {
    if (order?.phase === "completed") {
      onPaymentCompleted();
    }
    if (order?.phase === "delivery") {
      onProcessingPayment();
    }
  }, [order, onPaymentCompleted, onProcessingPayment]);

  return (
    <div
      className={cn(
        "w-full flex-grow space-y-4",
        step !== "options" && "flex items-center justify-center"
      )}
    >
      {step === "options" && (
        <AmountBreakdown
          quote={order?.lineItems[0].quote}
          inputAmount={amount ? Number.parseFloat(amount) : 0}
          isAmountValid={isAmountValid}
        />
      )}
      {amount && isAmountValid && (
        <div>
          <div>
            <CrossmintEmbeddedCheckout
              recipient={{ walletAddress }}
              lineItems={{
                tokenLocator: USDC_LOCATOR,
                executionParameters: {
                  mode: "exact-in",
                  amount: amount || "0.00",
                  maxSlippageBps: "500",
                },
              }}
              payment={{
                crypto: { enabled: false },
                fiat: {
                  enabled: true,
                  allowedMethods: {
                    card: true,
                    applePay: false,
                    googlePay: false,
                  },
                },
                receiptEmail,
              }}
              appearance={CHECKOUT_APPEARANCE}
            />
          </div>
        </div>
      )}
    </div>
  );
}
