"use server";

const CROSSMINT_SERVER_SIDE_API_KEY = process.env.CROSSMINT_SERVER_SIDE_API_KEY as string;
const CROSSMINT_ENV = process.env.CROSSMINT_ENV || "staging";
const USDC_LOCATOR = `${process.env.NEXT_PUBLIC_CHAIN_ID}:${process.env.NEXT_PUBLIC_USDC_MINT}:${process.env.NEXT_PUBLIC_USDC_MINT}`;

type CreateOrderParams = {
  amount: string;
  receiptEmail: string;
  walletAddress: string;
};

type CreateOrderResponse = {
  order: {
    orderId: string;
  };
  clientSecret: string;
};

type CreateOrderResult =
  | { success: true; data: CreateOrderResponse }
  | { success: false; error: string };

export async function createOrder({
  amount,
  receiptEmail,
  walletAddress,
}: CreateOrderParams): Promise<CreateOrderResult> {
  try {
    if (!CROSSMINT_SERVER_SIDE_API_KEY) {
      return {
        success: false,
        error: "Server misconfiguration: CROSSMINT_SERVER_SIDE_API_KEY missing",
      };
    }

    const response = await fetch(`https://${CROSSMINT_ENV}.crossmint.com/api/2022-06-09/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CROSSMINT_SERVER_SIDE_API_KEY,
      },
      body: JSON.stringify({
        lineItems: [
          {
            tokenLocator: USDC_LOCATOR,
            executionParameters: {
              mode: "exact-in",
              amount,
            },
          },
        ],
        payment: {
          method: "checkoutcom-flow",
          receiptEmail,
        },
        recipient: {
          walletAddress,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: data?.error || "Failed to create order",
      };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unexpected error creating order",
    };
  }
}
