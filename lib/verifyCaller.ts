const CLIENT_API_KEY = process.env.NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY ?? "";
const CROSSMINT_HOST = CLIENT_API_KEY.startsWith("ck_production")
  ? "https://www.crossmint.com"
  : "https://staging.crossmint.com";
const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID ?? "";
const CHAIN_TYPE = CHAIN_ID.startsWith("solana")
  ? "solana"
  : CHAIN_ID.startsWith("stellar")
    ? "stellar"
    : "evm";

export interface VerifiedCaller {
  walletAddress: string;
  email?: string;
}

/**
 * Resolves the caller's identity from their Crossmint session JWT. Crossmint rejects
 * tokens it didn't issue for this project, so server actions can trust the returned
 * wallet/email instead of client-supplied values.
 */
export async function verifyCaller(jwt: string | undefined): Promise<VerifiedCaller> {
  if (!jwt || !CLIENT_API_KEY) throw new Error("Unauthorized");

  const response = await fetch(`${CROSSMINT_HOST}/api/2025-06-09/wallets/me:${CHAIN_TYPE}`, {
    headers: { "X-API-KEY": CLIENT_API_KEY, Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Unauthorized");

  const wallet = await response.json();
  if (typeof wallet?.address !== "string") throw new Error("Unauthorized");

  const owner: unknown = wallet.owner;
  return {
    walletAddress: wallet.address,
    email:
      typeof owner === "string" && owner.startsWith("email:")
        ? owner.slice("email:".length)
        : undefined,
  };
}
