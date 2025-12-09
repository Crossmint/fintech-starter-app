import { useBalance } from "../../hooks/useBalance";

export function WalletBalance() {
  const { displayableBalance } = useBalance();
  return (
    <div className="mb-4 flex w-full flex-col items-start md:mb-0 md:w-auto">
      <span className="text-muted-foreground text-sm">Your balance</span>
      <span className="text-3xl font-semibold">${displayableBalance}</span>
    </div>
  );
}
