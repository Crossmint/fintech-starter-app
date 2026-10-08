"use client";

import { Login } from "@/components/Login";
import { MainScreen } from "@/components/MainScreen";
import { useCrossmintAuth, useWallet } from "@crossmint/client-sdk-react-ui";
import { useProcessWithdrawal } from "@/hooks/useProcessWithdrawal";
import { hubspotIdentify } from "@/server-actions/hubspotIdentify";
import { useEffect, useRef } from "react";

export function HomeContent() {
  const { wallet, status: walletStatus } = useWallet();
  const { status, status: authStatus, user } = useCrossmintAuth();

  useProcessWithdrawal(user?.id, wallet);

  const identifiedRef = useRef(false);
  useEffect(() => {
    if (status === "logged-in" && user?.email && !identifiedRef.current) {
      identifiedRef.current = true;
      hubspotIdentify({ email: user.email }).catch(() => {});
    }
  }, [status, user?.email]);

  const walletAddress = wallet?.address;
  const isLoggedIn = wallet != null && status === "logged-in";
  const isLoading = walletStatus === "in-progress" || authStatus === "initializing";

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Login />;
  }

  return <MainScreen walletAddress={walletAddress} />;
}
