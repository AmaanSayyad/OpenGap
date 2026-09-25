import { formatPrice } from "@/lib/format";
import { PLATFORM_FEE_BPS, USDC_DECIMALS, WSOL_DECIMALS, WSOL_MINT } from "@/lib/constants";
import type { TapeRow } from "@/lib/types";

type FeeQuote = {
  outputMint?: string;
  platformFee?: { amount: string; feeBps: number } | null;
};

export const PLATFORM_FEE_LABEL = "1% platform fee";

export function platformFeePct() {
  return PLATFORM_FEE_BPS / 100;
}

export function formatPlatformFee(
  quote: FeeQuote,
  row: TapeRow,
  side: "buy" | "sell",
  pay: "usdc" | "sol",
) {
  const raw = Number(quote.platformFee?.amount ?? 0);
  if (!Number.isFinite(raw) || raw <= 0) return `${platformFeePct()}%`;
  if (side === "buy") {
    const tokens = (raw / 10 ** row.decimals) * row.multiplier;
    return `${tokens.toFixed(5)} ${row.symbol}`;
  }
  if (pay === "sol" || quote.outputMint === WSOL_MINT) {
    return `${(raw / 10 ** WSOL_DECIMALS).toFixed(4)} SOL`;
  }
  return formatPrice(raw / 10 ** USDC_DECIMALS);
}
