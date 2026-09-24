import { JUPITER_PRICE_API } from "@/lib/constants";
import { premium } from "@/lib/metrics";
import type { BasisRow, JupiterPrice } from "@/lib/types";

export const PUBLIC_NAMES = [
  { symbol: "AAPL", name: "Apple", yahoo: "AAPL", xMint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp", onMint: "123mYEnRLM2LLYsJW3K6oyYh8uP1fngj732iG638ondo", xSymbol: "AAPLx" },
  { symbol: "MSFT", name: "Microsoft", yahoo: "MSFT", xMint: "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX", onMint: "", xSymbol: "MSFTx" },
  { symbol: "GOOGL", name: "Alphabet", yahoo: "GOOGL", xMint: "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN", onMint: "", xSymbol: "GOOGLx" },
  { symbol: "AMZN", name: "Amazon", yahoo: "AMZN", xMint: "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg", onMint: "", xSymbol: "AMZNx" },
  { symbol: "META", name: "Meta", yahoo: "META", xMint: "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu", onMint: "", xSymbol: "METAx" },
  { symbol: "NVDA", name: "Nvidia", yahoo: "NVDA", xMint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh", onMint: "", xSymbol: "NVDAx" },
  { symbol: "TSLA", name: "Tesla", yahoo: "TSLA", xMint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB", onMint: "", xSymbol: "TSLAx" },
  { symbol: "PLTR", name: "Palantir", yahoo: "PLTR", xMint: "XsoBhf2ufR8fTyNSjqfU71DYGaE6Z3SUGAidpzriAA4", onMint: "", xSymbol: "PLTRx" },
  { symbol: "COIN", name: "Coinbase", yahoo: "COIN", xMint: "Xs7ZdzSHLU9ftNJsii5fCeJhoRWSC32SQGzGQtePxNu", onMint: "", xSymbol: "COINx" },
  { symbol: "MSTR", name: "Strategy", yahoo: "MSTR", xMint: "XsP7xzNPvEHS1m6qfanPUGjNmdnmsLKEoNAnHjdxxyZ", onMint: "", xSymbol: "MSTRx" },
  { symbol: "HOOD", name: "Robinhood", yahoo: "HOOD", xMint: "XsvNBAYkrDRNhA7wPHQfX3ZUXZyZLdnCQDfHZ56bzpg", onMint: "", xSymbol: "HOODx" },
  { symbol: "SPY", name: "S&P 500", yahoo: "SPY", xMint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W", onMint: "", xSymbol: "SPYx" },
  { symbol: "QQQ", name: "Nasdaq 100", yahoo: "QQQ", xMint: "Xs8S1uUs1zvS2p7iwtsG3b6fkhpvmwz4GYU3gWAmWHZ", onMint: "", xSymbol: "QQQx" },
  { symbol: "AVGO", name: "Broadcom", yahoo: "AVGO", xMint: "XsgSaSvNSqLTtFuyWPBhK9196Xb9Bbdyjj4fH3cPJGo", onMint: "", xSymbol: "AVGOx" },
  { symbol: "INTC", name: "Intel", yahoo: "INTC", xMint: "XshPgPdXFRWB8tP1j82rebb2Q9rPgGX37RuqzohmArM", onMint: "", xSymbol: "INTCx" },
  { symbol: "AMD", name: "AMD", yahoo: "AMD", xMint: "XsXcJ6GZ9kVnjqGsjBnktRcuwMBmvKWh8S93RefZ1rF", onMint: "", xSymbol: "AMDx" },
] as const;

let basisCache: { at: number; rows: BasisRow[] } | null = null;
const BASIS_TTL_MS = 20_000;

async function fetchJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { accept: "application/json", "user-agent": "Opengap/1.0" },
  });
  if (!response.ok) return null;
  return (await response.json()) as T;
}

async function yahooQuotes(tickers: string[]) {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${tickers.join(",")}`;
  const data = await fetchJson<{
    quoteResponse?: {
      result?: Array<{ symbol?: string; regularMarketPrice?: number }>;
    };
  }>(url);
  const map = new Map<string, number>();
  for (const row of data?.quoteResponse?.result ?? []) {
    if (row.symbol && row.regularMarketPrice) {
      map.set(row.symbol.toUpperCase(), row.regularMarketPrice);
    }
  }
  if (map.size) return map;

  const fallback = new Map<string, number>();
  await Promise.all(
    tickers.map(async (ticker) => {
      const chart = await fetchJson<{
        chart?: { result?: Array<{ meta?: { regularMarketPrice?: number } }> };
      }>(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`);
      const price = chart?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (price) fallback.set(ticker.toUpperCase(), price);
    }),
  );
  return fallback;
}

async function binancePrice(symbol: string) {
  const data = await fetchJson<{ price?: string }>(
    `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`,
  );
  const value = Number(data?.price);
  return Number.isFinite(value) ? value : null;
}

async function dexPrice(mint: string) {
  const data = await fetchJson<{
    pairs?: Array<{
      chainId: string;
      dexId: string;
      priceUsd?: string;
      pairAddress: string;
      liquidity?: { usd?: number };
    }>;
  }>(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
  const sol = (data?.pairs ?? [])
    .filter((pair) => pair.chainId === "solana" && pair.priceUsd)
    .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
  return {
    price: sol ? Number(sol.priceUsd) : null,
    dex: sol?.dexId ?? null,
  };
}

async function jupiterUsd(mints: string[]) {
  const data = await fetchJson<Record<string, JupiterPrice>>(
    `${JUPITER_PRICE_API}?ids=${mints.join(",")}`,
  );
  return data ?? {};
}

export async function getBasis(): Promise<BasisRow[]> {
  if (basisCache && Date.now() - basisCache.at < BASIS_TTL_MS) {
    return basisCache.rows;
  }

  const [usdc, btc, cash, jup] = await Promise.all([
    binancePrice("USDCUSDT"),
    binancePrice("BTCUSDT"),
    yahooQuotes(PUBLIC_NAMES.map((item) => item.yahoo)),
    jupiterUsd(PUBLIC_NAMES.map((item) => item.xMint)),
  ]);

  const missing = PUBLIC_NAMES.filter((item) => !jup[item.xMint]?.usdPrice);
  const dexByMint = new Map<string, { price: number | null; dex: string | null }>();
  await Promise.all(
    missing.map(async (item) => {
      dexByMint.set(item.xMint, await dexPrice(item.xMint));
    }),
  );

  const ondo = PUBLIC_NAMES.find((item) => item.onMint);
  const onDex = ondo?.onMint ? await dexPrice(ondo.onMint) : { price: null, dex: null };

  const rows: BasisRow[] = PUBLIC_NAMES.map((item) => {
    const cashPrice = cash.get(item.yahoo) ?? null;
    const xJup = jup[item.xMint]?.usdPrice ?? null;
    const xDex = dexByMint.get(item.xMint);
    const xPrice = xJup ?? xDex?.price ?? null;
    const onPrice = item.onMint ? onDex.price : null;
    const xSource = xJup
      ? "Jupiter"
      : xDex?.dex
        ? `DexScreener · ${xDex.dex}`
        : null;
    return {
      symbol: item.symbol,
      name: item.name,
      image: `https://xstocks-metadata.backed.fi/logos/tokens/${item.xSymbol}.png`,
      cashPrice,
      xPrice,
      onPrice,
      xMint: item.xMint,
      onMint: item.onMint || null,
      xDex: xDex?.dex ?? null,
      xPremium: cashPrice && xPrice ? premium(xPrice, cashPrice) : null,
      onPremium: cashPrice && onPrice ? premium(onPrice, cashPrice) : null,
      xDiff: cashPrice && xPrice ? xPrice - cashPrice : null,
      onDiff: cashPrice && onPrice ? onPrice - cashPrice : null,
      cashSource: cashPrice ? "Yahoo Finance" : null,
      xSource,
      venue: xSource ?? "—",
    };
  });

  const next = rows.map((row) => ({ ...row, usdcUsd: usdc, btcUsd: btc }));
  basisCache = { at: Date.now(), rows: next };
  return next;
}
