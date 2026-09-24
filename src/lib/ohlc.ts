import { getTape } from "@/lib/prestocks";

export type OhlcPoint = { time: number; value: number };

type DexPair = {
  chainId?: string;
  pairAddress?: string;
  priceUsd?: string;
};

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

function closeSeries(rows: number[][], closeIndex: number): OhlcPoint[] {
  return rows
    .map((row) => {
      const time = Number(row[0]);
      const value = Number(row[closeIndex]);
      if (!Number.isFinite(time) || !Number.isFinite(value) || value <= 0) {
        return null;
      }
      return { time: time > 1e12 ? Math.floor(time / 1000) : time, value };
    })
    .filter((point): point is OhlcPoint => point !== null)
    .sort((a, b) => a.time - b.time);
}

async function geckoOhlc(mint: string): Promise<OhlcPoint[]> {
  const dex = await fetchJson<{ pairs?: DexPair[] }>(
    `https://api.dexscreener.com/latest/dex/tokens/${mint}`,
  );
  const pair = dex.pairs?.find((item) => item.chainId === "solana" && item.pairAddress);
  if (!pair?.pairAddress) return [];

  const gecko = await fetchJson<{
    data?: { attributes?: { ohlcv_list?: number[][] } };
  }>(
    `https://api.geckoterminal.com/api/v2/networks/solana/pools/${pair.pairAddress}/ohlcv/hour?aggregate=4&limit=42`,
  );
  return closeSeries(gecko.data?.attributes?.ohlcv_list ?? [], 4);
}

export async function getOhlc(symbol: string, mint?: string): Promise<OhlcPoint[]> {
  let address = mint;
  if (!address) {
    try {
      const tape = await getTape();
      address = tape.rows.find(
        (row) => row.symbol.toUpperCase() === symbol.toUpperCase(),
      )?.mint;
    } catch {
      address = undefined;
    }
  }
  if (!address) return [];
  try {
    return await geckoOhlc(address);
  } catch {
    return [];
  }
}
