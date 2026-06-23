import { useEffect, useRef, useState } from "react";

const LOADING_TIMEOUT_MS = 5000;
const ESTIMATED_FEE_RATE = 0.05; // ~5% estimated fee for sandbox display

interface BreakdownElementProps {
  label: string;
  value: string | number;
  isLoading?: boolean;
  isEstimate?: boolean;
}

function BreakdownElement({ label, value, isLoading, isEstimate }: BreakdownElementProps) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-900">{label}</span>
      <span className="flex items-center gap-1 font-medium text-gray-900">
        {isLoading ? (
          <div className="border-primary h-3 w-3 animate-spin rounded-full border-2 border-t-transparent" />
        ) : (
          <>
            {isEstimate && <span className="text-xs font-normal text-gray-400">~</span>}
            {`$${typeof value === "number" ? value.toFixed(2) : value}`}
          </>
        )}
      </span>
    </div>
  );
}

interface AmountBreakdownProps {
  quote?: {
    status: "valid" | "item-unavailable" | "expired" | "requires-recipient";
    quantityRange?: {
      lowerBound: string;
      upperBound: string;
    };
    totalPrice?: {
      currency: string;
      amount: string;
    };
  };
  inputAmount: number;
  isAmountValid: boolean;
}

export function AmountBreakdown({ quote, inputAmount, isAmountValid }: AmountBreakdownProps) {
  const [timedOut, setTimedOut] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const quoteAmount =
    quote?.totalPrice?.amount && isAmountValid ? Number.parseFloat(quote?.totalPrice?.amount) : 0;
  const quoteTotal =
    quoteAmount && quote?.quantityRange?.upperBound && isAmountValid
      ? Number.parseFloat(quote?.quantityRange?.upperBound)
      : 0;

  const isWaitingForQuote = inputAmount !== quoteAmount && isAmountValid;

  useEffect(() => {
    if (isWaitingForQuote) {
      setTimedOut(false);
      timeoutRef.current = setTimeout(() => setTimedOut(true), LOADING_TIMEOUT_MS);
    } else {
      setTimedOut(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isWaitingForQuote, inputAmount]);

  // Use quote values if available, otherwise fall back to estimates after timeout.
  // In sandbox the quote may resolve but return zero fees (totalPrice == upperBound),
  // which is unrealistic for a demo — apply estimated fees in that case too.
  const useEstimates = timedOut && isWaitingForQuote;
  const quoteFees = quoteAmount ? quoteAmount - quoteTotal : 0;
  const hasRealisticFees = quoteFees > 0;

  const amount = useEstimates ? inputAmount : quoteAmount;
  const fees =
    useEstimates || (quoteAmount > 0 && !hasRealisticFees)
      ? inputAmount * ESTIMATED_FEE_RATE
      : quoteFees;
  const total =
    useEstimates || (quoteAmount > 0 && !hasRealisticFees)
      ? inputAmount * (1 - ESTIMATED_FEE_RATE)
      : quoteTotal;
  const showEstimateMarker = useEstimates || (quoteAmount > 0 && !hasRealisticFees);
  const isLoading = isWaitingForQuote && !timedOut;

  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-gray-200 p-4">
      <BreakdownElement
        label="Amount"
        value={amount}
        isLoading={isLoading}
        isEstimate={showEstimateMarker}
      />
      <BreakdownElement
        label="Trans. Fees"
        value={fees}
        isLoading={isLoading}
        isEstimate={showEstimateMarker}
      />
      <BreakdownElement
        label="Total add to wallet"
        value={total}
        isLoading={isLoading}
        isEstimate={showEstimateMarker}
      />
      {showEstimateMarker && (
        <p className="text-xs text-gray-400">
          Estimated values — final amount determined at checkout
        </p>
      )}
    </div>
  );
}
