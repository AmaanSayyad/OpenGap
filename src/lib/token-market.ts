import { PUMP_POOL, TOKEN_MINT } from "@/lib/company";

export type TokenMarket = {
  volumeAll: number | null;
  txns: number | null;
  traders: number | null;
  fdv: number | null;
  marketCap: number | null;
  holders: number | null;
  price: number | null;
};

function num(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : typeof value === "number" ? value : NaN;
  return Number.isFinite(n) ? n : null;
}

async function readJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getTokenMarket(mint = TOKEN_MINT): Promise<TokenMarket> {
  const [claw, dex, geckoInfo, geckoPool] = await Promise.all([
    readJson<{
      tokens?: Array<{
        mintAddress?: string;
        volumeAllTime?: number;
        marketCap?: number;
        price?: number;
      }>;
    }>(`https://clawpump.tech/api/tokens?q=OPENGAP&limit=8`),
    readJson<{
      pairs?: Array<{
        pairAddress?: string;
        fdv?: number;
        marketCap?: number;
        priceUsd?: string;
        txns?: { h24?: { buys?: number; sells?: number } };
      }>;
    }>(`https://api.dexscreener.com/latest/dex/tokens/${mint}`),
    readJson<{
      data?: { attributes?: { holders?: { count?: number } } };
    }>(`https://api.geckoterminal.com/api/v2/networks/solana/tokens/${mint}/info`),
    readJson<{
      data?: {
        attributes?: {
          fdv_usd?: string;
          market_cap_usd?: string;
          transactions?: {
            h24?: {
              buys?: number;
              sells?: number;
              buyers?: number;
              sellers?: number;
            };
          };
        };
      };
    }>(`https://api.geckoterminal.com/api/v2/networks/solana/pools/${PUMP_POOL.pairAddress}`),
  ]);

  const clawRow = claw?.tokens?.find((row) => row.mintAddress === mint) ?? null;
  const pair =
    dex?.pairs?.find((row) => row.pairAddress === PUMP_POOL.pairAddress) ??
    dex?.pairs?.[0] ??
    null;
  const h24 = geckoPool?.data?.attributes?.transactions?.h24;
  const buys = num(h24?.buys) ?? num(pair?.txns?.h24?.buys) ?? 0;
  const sells = num(h24?.sells) ?? num(pair?.txns?.h24?.sells) ?? 0;

  return {
    volumeAll: num(clawRow?.volumeAllTime),
    txns: buys + sells > 0 ? buys + sells : null,
    traders:
      num(h24?.buyers) != null || num(h24?.sellers) != null
        ? (num(h24?.buyers) ?? 0) + (num(h24?.sellers) ?? 0)
        : null,
    fdv: num(pair?.fdv) ?? num(geckoPool?.data?.attributes?.fdv_usd),
    marketCap:
      num(clawRow?.marketCap) ??
      num(pair?.marketCap) ??
      num(geckoPool?.data?.attributes?.market_cap_usd),
    holders: num(geckoInfo?.data?.attributes?.holders?.count),
    price: num(clawRow?.price) ?? num(pair?.priceUsd),
  };
}
