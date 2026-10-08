"use server";

import { BASE_SEPOLIA_CHAIN_ID, RUSD_CONTRACT_ADDRESS } from "@/lib/config";
import crypto from "crypto";

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
  walletAddress: string;
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

export async function createRainUserApplication(params: RainConsumerApplication) {
  const response = await fetch(`${RAIN_API_URL}/issuing/applications/user`, {
    method: "POST",
    headers: rainHeaders(true),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Rain application failed: ${error.message || response.statusText}`);
  }

  const result = await response.json();
  let kycRedirectUrl = "";
  if (result.applicationExternalVerificationLink) {
    const link = result.applicationExternalVerificationLink;
    kycRedirectUrl = `${link.url}?userId=${link.params.userId}&signature=${link.params.signature}`;
  }

  return {
    userId: result.id,
    applicationStatus: result.applicationStatus,
    email: result.email,
    walletAddress: result.walletAddress,
    kycRedirectUrl,
  };
}

export async function getRainUserStatus(userId: string) {
  const response = await fetch(`${RAIN_API_URL}/issuing/applications/user/${userId}`, {
    headers: rainHeaders(),
  });

  if (!response.ok) throw new Error(`Failed to get user status: ${response.statusText}`);
  const result = await response.json();

  return {
    userId: result.id,
    applicationStatus: result.applicationStatus,
    firstName: result.firstName,
    lastName: result.lastName,
    email: result.email,
    walletAddress: result.walletAddress,
    isActive: result.isActive,
  };
}

export async function getRainUserByWalletAddress(walletAddress: string) {
  const response = await fetch(`${RAIN_API_URL}/issuing/users?limit=100`, {
    headers: rainHeaders(),
  });

  if (!response.ok) throw new Error(`Failed to get user by wallet: ${response.statusText}`);
  const json = await response.json();
  const filtered = json.filter((user: RainUser) => user.walletAddress === walletAddress);

  if (filtered.length > 0 && filtered[0].applicationExternalVerificationLink) {
    const link = filtered[0].applicationExternalVerificationLink;
    filtered[0].kycRedirectUrl = `${link.url}?userId=${link.params.userId}&signature=${link.params.signature}`;
  }

  return filtered;
}

export async function createRainUserContract(userId: string, chainId: number) {
  await fetch(`${RAIN_API_URL}/issuing/users/${userId}/contracts`, {
    method: "POST",
    headers: rainHeaders(true),
    body: JSON.stringify({ chainId }),
  });
}

export async function getRainUserContracts(userId: string, maxRetries = 10) {
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

export async function issueRainCard(userId: string, cardParams: RainCardRequest) {
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
    lastFour: result.lastFour,
    displayName: result.displayName,
  };
}

export async function getRainUserCards(userId: string) {
  const response = await fetch(`${RAIN_API_URL}/issuing/cards?userId=${userId}&limit=20`, {
    headers: rainHeaders(),
  });
  if (!response.ok) throw new Error(`Failed to get cards: ${response.statusText}`);
  return response.json();
}

export async function getRainUserCreditBalances(userId: string) {
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

export async function getDecryptedCardData(cardId: string) {
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
