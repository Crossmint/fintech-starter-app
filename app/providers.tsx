"use client";

import {
  CrossmintProvider,
  CrossmintAuthProvider,
  CrossmintWalletProvider,
} from "@crossmint/client-sdk-react-ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

if (!process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY || !process.env.NEXT_PUBLIC_CHAIN_ID) {
  throw new Error("NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY or NEXT_PUBLIC_CHAIN_ID is not set");
}

const queryClient = new QueryClient();
const chain = process.env.NEXT_PUBLIC_CHAIN_ID as any;

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <CrossmintProvider apiKey={process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY || ""}>
        <CrossmintAuthProvider
          authModalTitle="Fintech Starter App"
          loginMethods={["email", "google"]}
        >
          <CrossmintWalletProvider
            showPasskeyHelpers={chain !== "solana"}
            createOnLogin={{
              chain: process.env.NEXT_PUBLIC_CHAIN_ID as any,
              signer: { type: "email" },
            }}
          >
            {children}
          </CrossmintWalletProvider>
        </CrossmintAuthProvider>
      </CrossmintProvider>
    </QueryClientProvider>
  );
}
