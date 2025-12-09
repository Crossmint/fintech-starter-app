import { useWallet } from "@crossmint/client-sdk-react-ui";
import { useQuery } from "@tanstack/react-query";

export function useActivityFeed() {
  const { wallet } = useWallet();
  return useQuery({
    queryKey: ["walletActivity", wallet?.address],
    queryFn: async () => await wallet?.experimental_activity(),
    enabled: !!wallet?.address,
  });
}
