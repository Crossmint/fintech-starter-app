interface BreakdownElementProps {
  label: string;
  value: string | number;
  isLoading?: boolean;
}

function BreakdownElement({ label, value, isLoading }: BreakdownElementProps) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-900">{label}</span>
      <span className="flex items-center font-medium text-gray-900">
        {isLoading ? (
          <div className="border-primary h-3 w-3 animate-spin rounded-full border-2 border-t-transparent" />
        ) : (
          `$${typeof value === "number" ? value.toFixed(2) : value}`
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
  const amount =
    quote?.totalPrice?.amount && isAmountValid ? Number.parseFloat(quote?.totalPrice?.amount) : 0;
  const total =
    amount && quote?.quantityRange?.upperBound && isAmountValid
      ? Number.parseFloat(quote?.quantityRange?.upperBound)
      : 0;
  const fees = amount ? amount - total : 0;

  const isLoading = inputAmount !== amount && isAmountValid;

  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-gray-200 p-4">
      <BreakdownElement label="Amount" value={amount} isLoading={isLoading} />
      <BreakdownElement label="Trans. Fees" value={fees} isLoading={isLoading} />
      <BreakdownElement label="Total add to wallet" value={total} isLoading={isLoading} />
    </div>
  );
}
