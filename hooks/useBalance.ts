import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@crossmint/client-sdk-react-ui";

export function useBalance() {
  const { wallet } = useWallet();
  const {
    data: balances = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["balances", wallet?.address],
    queryFn: async () => (await wallet?.balances(["usdc"])) ?? null,
  });

  return {
    balances,
    displayableBalance: parseFloat(balances?.usdc?.amount ?? "0").toFixed(2),
    error: error ? (error instanceof Error ? error.message : String(error)) : null,
    isLoading,
    refetch,
  };
}
