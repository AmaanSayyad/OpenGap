import {
  DEFAULT_SLIPPAGE_BPS,
  JUPITER_QUOTE_API,
  JUPITER_SWAP_API,
} from "@/lib/constants";

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
};

export async function getJupiterQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps?: number;
}) {
  const search = new URLSearchParams({
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: String(params.amount),
    slippageBps: String(params.slippageBps ?? DEFAULT_SLIPPAGE_BPS),
    restrictIntermediateTokens: "true",
  });

  const response = await fetch(`${JUPITER_QUOTE_API}?${search.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Jupiter quote failed (${response.status})`);
  }

  return (await response.json()) as JupiterQuote;
}

export async function getJupiterSwap(params: {
  quoteResponse: JupiterQuote;
  userPublicKey: string;
}) {
  const response = await fetch(JUPITER_SWAP_API, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      quoteResponse: params.quoteResponse,
      userPublicKey: params.userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: "auto",
    }),
  });

  if (!response.ok) {
    throw new Error(`Jupiter swap failed (${response.status})`);
  }

  return (await response.json()) as { swapTransaction: string };
}
