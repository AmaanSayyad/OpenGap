import { JUPITER_PRICE_API } from "@/lib/constants";
import { logoSrc } from "@/lib/logos";
import { premium } from "@/lib/metrics";
import type { JupiterPrice, TapeRow } from "@/lib/types";

const TESSERA_API = "https://rest-api.tessera.pe/v1/public/token-details";

type TesseraRaw = {
  id: string;
  name: string;
  symbol: string;
  sector: string;
  mint: string;
  markPrice: number;
  holders: number;
  markValuation: number;
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Tessera failed ${response.status}`);
  return (await response.json()) as T;
}

export async function getTesseraRows(): Promise<TapeRow[]> {
  const raw = await fetchJson<TesseraRaw[]>(TESSERA_API);
  const allowed = raw.filter((item) =>
    ["T-OpenAI", "T-Kalshi", "T-SpaceX"].includes(item.symbol),
  );
  const mints = allowed.map((item) => item.mint).join(",");
  let prices: Record<string, JupiterPrice> = {};
  try {
    prices = await fetchJson<Record<string, JupiterPrice>>(
      `${JUPITER_PRICE_API}?ids=${mints}`,
    );
  } catch {
    prices = {};
  }

  return allowed.map((item) => {
    const quote = prices[item.mint];
    const execPrice = quote?.usdPrice ?? item.markPrice;
    return {
      symbol: item.symbol,
      name: item.name,
      description: `${item.sector}. Tessera T-token. Loan participation, not equity.`,
      image: logoSrc(item.symbol) ?? "",
      url: `https://app.tessera.pe`,
      mint: item.mint,
      markPrice: item.markPrice,
      tokenPrice: execPrice,
      execPrice,
      premium: premium(execPrice, item.markPrice),
      impliedValuation: item.markValuation,
      markValuation: item.markValuation,
      liquidity: quote?.liquidity ?? null,
      change24h: quote?.priceChange24h ?? null,
      multiplier: 1,
      decimals: quote?.decimals ?? 9,
      issuer: "tessera" as const,
      supply: null,
      holders: item.holders ?? null,
      sector: item.sector ?? null,
    };
  });
}
