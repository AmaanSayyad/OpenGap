import { HIDDEN_SYMBOLS, JUPITER_PRICE_API, PRESTOCKS_API } from "@/lib/constants";
import { pre8Index, premium } from "@/lib/metrics";
import type { JupiterPrice, PreStockRaw, TapeResponse, TapeRow } from "@/lib/types";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Request failed ${response.status} for ${url}`);
  }
  return (await response.json()) as T;
}

let tapeCache: { at: number; tape: TapeResponse } | null = null;
const TAPE_TTL_MS = 10_000;

export async function getTape(): Promise<TapeResponse> {
  if (tapeCache && Date.now() - tapeCache.at < TAPE_TTL_MS) {
    return tapeCache.tape;
  }

  try {
    const tape = await loadTape();
    tapeCache = { at: Date.now(), tape };
    return tape;
  } catch (error) {
    if (tapeCache) return tapeCache.tape;
    throw error;
  }
}

async function loadTape(): Promise<TapeResponse> {
  const raw = (await fetchJson<PreStockRaw[]>(PRESTOCKS_API)).filter(
    (item) => !HIDDEN_SYMBOLS.has(item.symbol.toUpperCase()),
  );
  const mints = raw.map((item) => item.contract_address).join(",");
  let prices: Record<string, JupiterPrice> = {};

  try {
    prices = await fetchJson<Record<string, JupiterPrice>>(
      `${JUPITER_PRICE_API}?ids=${mints}`,
    );
  } catch {
    prices = {};
  }

  const rows: TapeRow[] = raw.map((item) => {
    const quote = prices[item.contract_address];
    const execPrice = quote?.usdPrice ?? item.tokenPrice;
    const markPrice = item.markPrice;
    const multiplier =
      quote?.scaledUiConfig?.newMultiplier ??
      quote?.scaledUiConfig?.multiplier ??
      1;

    return {
      symbol: item.symbol,
      name: item.name.replace(/ PreStocks$/i, ""),
      description: item.description,
      image: item.image,
      url: item.external_url,
      mint: item.contract_address,
      markPrice,
      tokenPrice: item.tokenPrice,
      execPrice,
      premium: premium(execPrice, markPrice),
      impliedValuation: item.impliedValuation,
      markValuation: item.markValuation,
      liquidity: quote?.liquidity ?? null,
      change24h: quote?.priceChange24h ?? null,
      multiplier,
      decimals: quote?.decimals ?? 9,
      issuer: "prestocks" as const,
      supply: item.supply ?? null,
      holders: null,
      sector: null,
    };
  });

  rows.sort((a, b) => a.premium - b.premium);

  return {
    rows,
    updatedAt: new Date().toISOString(),
    pre8: pre8Index(rows),
  };
}
