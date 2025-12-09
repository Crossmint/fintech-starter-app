import { CrossmintEmbeddedCheckout, useCrossmintCheckout } from "@crossmint/client-sdk-react-ui";
import { useEffect, useState } from "react";
import { AmountBreakdown } from "./AmountBreakdown";
import { cn } from "@/lib/utils";
import { createOrder } from "@/server-actions/createOrder";

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
  const [orderId, setOrderId] = useState<string>("");
  const [clientSecret, setClientSecret] = useState<string>("");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string>("");

  const handleCreateOrder = async () => {
    if (!amount || !isAmountValid || !receiptEmail || !walletAddress) return;

    setIsCreatingOrder(true);
    setOrderError("");

    try {
      const result = await createOrder({
        amount,
        receiptEmail,
        walletAddress,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setOrderId(result.data.order.orderId);
      setClientSecret(result.data.clientSecret);
    } catch (error) {
      console.error("Error creating order:", error);
      setOrderError(error instanceof Error ? error.message : "Failed to create order");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  useEffect(() => {
    if (amount && isAmountValid && receiptEmail && walletAddress && !orderId && !isCreatingOrder) {
      handleCreateOrder();
    }
  }, [amount, isAmountValid, receiptEmail, walletAddress, orderId, isCreatingOrder]);

  useEffect(() => {
    if (order?.phase === "payment") {
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
          {isCreatingOrder && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="border-primary mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2"></div>
                <p className="text-sm text-gray-600">Creating order...</p>
              </div>
            </div>
          )}
          {orderError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">{orderError}</p>
            </div>
          )}
          {orderId && clientSecret && !isCreatingOrder && (
            <div>
              <CrossmintEmbeddedCheckout
                orderId={orderId}
                // @ts-ignore
                clientSecret={clientSecret}
                payment={{
                  receiptEmail,
                  crypto: { enabled: false },
                  fiat: { enabled: true },
                  defaultMethod: "fiat",
                }}
                appearance={CHECKOUT_APPEARANCE}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
