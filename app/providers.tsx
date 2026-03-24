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
          termsOfServiceText={
            <p>
              By continuing, you accept the{" "}
              <a href="https://www.crossmint.com/legal/terms-of-service" target="_blank">
                Wallet's Terms of Service
              </a>
              , and to recieve marketing communications from Crossmint.
            </p>
          }
        >
          <CrossmintWalletProvider
            createOnLogin={{
              chain,
              recovery: { type: "email" },
              signers: [{ type: "device" }],
            }}
          >
            {children}
          </CrossmintWalletProvider>
        </CrossmintAuthProvider>
      </CrossmintProvider>
    </QueryClientProvider>
  );
}
