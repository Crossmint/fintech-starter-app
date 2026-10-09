"use server";

import { BASE_SEPOLIA_CHAIN_ID, RUSD_CONTRACT_ADDRESS } from "@/lib/config";
import crypto from "crypto";
import { verifyCaller } from "@/lib/verifyCaller";

interface RainConsumerApplication {
  firstName: string;
  lastName: string;
  birthDate: string;
  nationalId: string;
  countryOfIssue: string;
  email: string;
  address: {
    line1: string;
    city: string;
    region: string;
    postalCode: string;
    countryCode: string;
  };
  ipAddress: string;
  phoneCountryCode: string;
  phoneNumber: string;
  annualSalary: string;
  accountPurpose: string;
  expectedMonthlyVolume: string;
  isTermsOfServiceAccepted: true;
}

interface RainCardRequest {
  type: "virtual" | "physical";
  limit: { frequency: "allTime"; amount: number };
  displayName?: string;
  status?: "notActivated" | "active";
}

interface RainToken {
  address: string;
  balance: string;
  exchangeRate: number;
  advanceRate: number;
}

interface RainContract {
  id: string;
  chainId: number;
  depositAddress: string;
  proxyAddress: string;
  controllerAddress: string;
  tokens: RainToken[];
  contractVersion: string;
}

interface RainUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  walletAddress: string;
  applicationStatus: string;
  isActive: boolean;
  applicationExternalVerificationLink?: {
    url: string;
    params: { userId: string; signature: string };
  };
  kycRedirectUrl?: string;
}

const RAIN_API_URL = "https://api-dev.raincards.xyz/v1";

function rainHeaders(json = false) {
  const headers: Record<string, string> = {
    accept: "application/json",
    "Api-Key": `${process.env.RAIN_API_KEY}`,
  };
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

async function assertOwnsRainUser(jwt: string | undefined, userId: string) {
  const { walletAddress } = await verifyCaller(jwt);
  const response = await fetch(`${RAIN_API_URL}/issuing/users/${encodeURIComponent(userId)}`, {
    headers: rainHeaders(),
  });
  if (!response.ok) throw new Error("Unauthorized");
  const user = await response.json();
  if (user?.walletAddress?.toLowerCase() !== walletAddress.toLowerCase()) {
    throw new Error("Unauthorized");
  }
}

function withKycRedirectUrl(user: RainUser): RainUser {
  const link = user.applicationExternalVerificationLink;
  return link
    ? {
        ...user,
        kycRedirectUrl: `${link.url}?userId=${link.params.userId}&signature=${link.params.signature}`,
      }
    : user;
}

export async function createRainUserApplication(
  jwt: string | undefined,
  params: RainConsumerApplication
) {
  const caller = await verifyCaller(jwt);
  const response = await fetch(`${RAIN_API_URL}/issuing/applications/user`, {
    method: "POST",
    headers: rainHeaders(true),
    body: JSON.stringify({
      ...params,
      email: caller.email ?? params.email,
      walletAddress: caller.walletAddress,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Rain application failed: ${error.message || response.statusText}`);
  }

  const result = withKycRedirectUrl(await response.json());
  return {
    userId: result.id,
    applicationStatus: result.applicationStatus,
    email: result.email,
    walletAddress: result.walletAddress,
    kycRedirectUrl: result.kycRedirectUrl ?? "",
  };
}

export async function getMyRainUsers(jwt: string | undefined) {
  const { walletAddress } = await verifyCaller(jwt);
  const response = await fetch(`${RAIN_API_URL}/issuing/users?limit=100`, {
    headers: rainHeaders(),
  });

  if (!response.ok) throw new Error(`Failed to get user by wallet: ${response.statusText}`);
  const json: RainUser[] = await response.json();
  return json
    .filter((user) => user.walletAddress?.toLowerCase() === walletAddress.toLowerCase())
    .map(withKycRedirectUrl);
}

export async function createRainUserContract(
  jwt: string | undefined,
  userId: string,
  chainId: number
) {
  await assertOwnsRainUser(jwt, userId);
  await fetch(`${RAIN_API_URL}/issuing/users/${userId}/contracts`, {
    method: "POST",
    headers: rainHeaders(true),
    body: JSON.stringify({ chainId }),
  });
}

export async function getRainUserContracts(
  jwt: string | undefined,
  userId: string,
  maxRetries = 10
) {
  await assertOwnsRainUser(jwt, userId);
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${RAIN_API_URL}/issuing/users/${userId}/contracts`, {
        headers: rainHeaders(),
      });
      if (!response.ok) throw new Error(`Failed to get contracts: ${response.statusText}`);

      const contracts = await response.json();
      const baseSepoliaContract = contracts.find(
        (c: RainContract) => c.chainId === BASE_SEPOLIA_CHAIN_ID
      );

      if (!baseSepoliaContract) {
        if (attempt < maxRetries) {
          await sleep(Math.pow(2, attempt) * 1000);
          continue;
        }
        throw new Error("No Base Sepolia contract found after all retries");
      }

      const rusdToken = baseSepoliaContract.tokens.find(
        (t: RainToken) => t.address === RUSD_CONTRACT_ADDRESS
      );

      return {
        contractId: baseSepoliaContract.id,
        chainId: baseSepoliaContract.chainId,
        depositAddress: baseSepoliaContract.depositAddress,
        proxyAddress: baseSepoliaContract.proxyAddress,
        controllerAddress: baseSepoliaContract.controllerAddress,
        tokens: baseSepoliaContract.tokens,
        contractVersion: baseSepoliaContract.contractVersion,
        rusdToken: rusdToken || {
          address: RUSD_CONTRACT_ADDRESS,
          balance: "0.0",
          exchangeRate: 1,
          advanceRate: 100,
        },
      };
    } catch (error) {
      if (attempt === maxRetries) throw new Error(`Failed to get user contracts: ${error}`);
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
  throw new Error("Failed to get user contracts after all retries");
}

export async function issueRainCard(
  jwt: string | undefined,
  userId: string,
  cardParams: RainCardRequest
) {
  await assertOwnsRainUser(jwt, userId);
  const response = await fetch(`${RAIN_API_URL}/issuing/users/${userId}/cards`, {
    method: "POST",
    headers: rainHeaders(true),
    body: JSON.stringify(cardParams),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Card issuance failed: ${error.message || response.statusText}`);
  }

  const result = await response.json();
  return {
    cardId: result.id,
    status: result.status,
    type: result.type,
    limit: result.limit,
    lastFour: result.last4 ?? result.lastFour,
    displayName: result.displayName,
  };
}

export async function getRainUserCards(jwt: string | undefined, userId: string) {
  await assertOwnsRainUser(jwt, userId);
  const response = await fetch(`${RAIN_API_URL}/issuing/cards?userId=${userId}&limit=20`, {
    headers: rainHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to get cards: ${response.statusText}`);
  return response.json();
}

export async function getRainUserCreditBalances(jwt: string | undefined, userId: string) {
  await assertOwnsRainUser(jwt, userId);
  const response = await fetch(`${RAIN_API_URL}/issuing/users/${userId}/balances`, {
    headers: rainHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to get credit balances: ${response.statusText}`);

  const json = await response.json();
  return {
    creditLimit: json.creditLimit / 100,
    pendingCharges: json.pendingCharges / 100,
    postedCharges: json.postedCharges / 100,
    balanceDue: json.balanceDue / 100,
    spendingPower: json.spendingPower / 100,
  };
}

const RAIN_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCAP192809jZyaw62g/eTzJ3P9H
+RmT88sXUYjQ0K8Bx+rJ83f22+9isKx+lo5UuV8tvOlKwvdDS/pVbzpG7D7NO45c
0zkLOXwDHZkou8fuj8xhDO5Tq3GzcrabNLRLVz3dkx0znfzGOhnY4lkOMIdKxlQb
LuVM/dGDC9UpulF+UwIDAQAB
-----END PUBLIC KEY-----`;

async function generateSessionId(pem: string) {
  const secretKey = crypto.randomUUID().replace(/-/g, "");
  const secretKeyBase64 = Buffer.from(secretKey, "hex").toString("base64");
  const encrypted = crypto.publicEncrypt(
    { key: pem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
    Buffer.from(secretKeyBase64, "utf-8")
  );
  return { secretKey, sessionId: encrypted.toString("base64") };
}

async function decryptSecret(base64Secret: string, base64Iv: string, secretKey: string) {
  const secret = Buffer.from(base64Secret, "base64");
  const iv = Buffer.from(base64Iv, "base64");
  const decipher = crypto.createDecipheriv("aes-128-gcm", Buffer.from(secretKey, "hex"), iv);
  decipher.setAutoPadding(false);
  const decrypted = decipher.update(secret);
  return decrypted.toString("utf-8").trim();
}

export async function getDecryptedCardData(jwt: string | undefined, cardId: string) {
  const cardResponse = await fetch(`${RAIN_API_URL}/issuing/cards/${encodeURIComponent(cardId)}`, {
    headers: rainHeaders(),
  });
  if (!cardResponse.ok) throw new Error("Unauthorized");
  const card = await cardResponse.json();
  await assertOwnsRainUser(jwt, card?.userId);

  const { secretKey, sessionId } = await generateSessionId(RAIN_PUBLIC_KEY);

  const response = await fetch(`${RAIN_API_URL}/issuing/cards/${cardId}/secrets`, {
    headers: { "Api-Key": `${process.env.RAIN_API_KEY}`, SessionId: sessionId },
  });

  if (!response.ok) throw new Error(`Failed to get card secrets: ${response.statusText}`);
  const encrypted = await response.json();

  const cardNumber = await decryptSecret(
    encrypted.encryptedPan.data,
    encrypted.encryptedPan.iv,
    secretKey
  );
  const cvc = await decryptSecret(
    encrypted.encryptedCvc.data,
    encrypted.encryptedCvc.iv,
    secretKey
  );

  return { cardNumber: cardNumber.substring(0, 16), cvc: cvc.substring(0, 3) };
}
