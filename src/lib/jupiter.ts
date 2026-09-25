import {
  DEFAULT_SLIPPAGE_BPS,
  JUPITER_QUOTE_API,
  JUPITER_SWAP_API,
  PLATFORM_FEE_BPS,
} from "@/lib/constants";
import { resolvePlatformFeeAccount } from "@/lib/platform-fee";

export type JupiterHop = {
  percent?: number;
  swapInfo?: {
    label?: string;
    ammKey?: string;
    inputMint?: string;
    outputMint?: string;
    inAmount?: string;
    outAmount?: string;
  };
};

export type JupiterQuote = {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: JupiterHop[];
  swapUsdValue?: string;
  platformFee?: {
    amount: string;
    feeBps: number;
  } | null;
};

export async function getJupiterQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps?: number;
  platformFeeBps?: number;
}) {
  const search = new URLSearchParams({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: String(params.amount),
    slippageBps: String(params.slippageBps ?? DEFAULT_SLIPPAGE_BPS),
    platformFeeBps: String(params.platformFeeBps ?? PLATFORM_FEE_BPS),
    restrictIntermediateTokens: "true",
    instructionVersion: "V2",
  });

  const response = await fetch(`${JUPITER_QUOTE_API}?${search.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await jupiterError("quote", response));
  }

  return (await response.json()) as JupiterQuote;
}

export async function getJupiterSwap(params: {
  quoteResponse: JupiterQuote;
  userPublicKey: string;
}) {
  const feeBps = params.quoteResponse.platformFee?.feeBps ?? PLATFORM_FEE_BPS;
  const feeAccount =
    feeBps > 0 ? await resolvePlatformFeeAccount(params.quoteResponse) : undefined;
  const response = await fetch(JUPITER_SWAP_API, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      quoteResponse: params.quoteResponse,
      userPublicKey: params.userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: "auto",
      ...(feeAccount ? { feeAccount } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(await jupiterError("swap", response));
  }

  return (await response.json()) as { swapTransaction: string };
}

async function jupiterError(kind: "quote" | "swap", response: Response) {
  const body = await response.text();
  const detail = body.slice(0, 240).trim();
  return `Jupiter ${kind} failed (${response.status})${detail ? `: ${detail}` : ""}`;
}
