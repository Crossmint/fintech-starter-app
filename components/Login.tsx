"use client";

import { useCrossmintAuth } from "@crossmint/client-sdk-react-ui";
import { useEffect } from "react";

export function Login() {
  const { login, status } = useCrossmintAuth();
  useEffect(() => {
    if (status === "logged-out") {
      login();
    }
  }, [login, status]);
  return null;
}
