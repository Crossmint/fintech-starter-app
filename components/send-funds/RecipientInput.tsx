import { cn } from "@/lib/utils";

interface RecipientInputProps {
  recipient: string;
  onChange: (recipient: string) => void;
  error?: string | null;
}

export function RecipientInput({ recipient, onChange, error }: RecipientInputProps) {
  return (
    <div className="w-full">
      <label className="mb-2 block text-sm font-semibold text-gray-900">Receipient</label>
      <input
        type="text"
        placeholder="Enter email or wallet address"
        className={cn(
          "focus:border-primary h-12 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none",
          error && "border-red-600"
        )}
        value={recipient}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <div className="mt-1.5 text-sm text-red-600">{error}</div>}
    </div>
  );
}
