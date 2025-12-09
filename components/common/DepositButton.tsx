import { Plus } from "lucide-react";

export function DepositButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="hover:bg-primary-hover bg-primary text-primary-foreground flex h-11 flex-grow items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition md:w-28 md:flex-grow-0"
      onClick={onClick}
    >
      <Plus className="h-4 w-4" /> Deposit
    </button>
  );
}
