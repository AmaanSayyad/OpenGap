import { DynamicBondingCurveClient } from "@meteora-ag/dynamic-bonding-curve-sdk";
import { STOCK_QUOTES } from "@/lib/meteora-quotes";
import { mainnetConnection } from "@/lib/server-wallet";
import type { MeteoraPool } from "@/lib/types";

export { STOCK_QUOTES };

export async function getDbcStatus() {
  try {
    const client = DynamicBondingCurveClient.create(mainnetConnection());
    return {
      ready: true,
      program: client.state.getProgram().programId.toBase58(),
      quoteMints: STOCK_QUOTES,
    };
  } catch (error) {
    return {
      ready: false,
      program: null,
      quoteMints: STOCK_QUOTES,
      error: error instanceof Error ? error.message : "DBC client failed",
    };
  }
}

const WATCH_MINTS = [
  "PresTj4Yc2bAR197Er7wz4UUKSfqt6FryBEdAriBoQB",
  "Pren1FvFX6J3E4kXhJuCiAD5aDmGEb7qJRncwA8Lkhw",
  "PreweJYECqtQwBtpxHL171nL2K6umo692gTm7Q3rpgF",
  "PreANxuXjsy2pvisWWMNB6YaJNzr7681wJJr2rHsfTh",
  "oPAiAikWTaFj9RYoRFD35ccfwhnMcB3ThgBZRHSkjTZ",
  "TKLSidmLVt3cqGaaodG8tyRzoANfQwoh67AccjmubeZ",
  "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
  "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
  "TSPXcLV76s6V2zDiZQ18kBfcbnjaE2ZzNT3ga2Pd99v",
];

export async function getMeteoraPools(): Promise<MeteoraPool[]> {
  const pools: MeteoraPool[] = [];

  for (const mint of WATCH_MINTS) {
    try {
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${mint}`,
        { cache: "no-store" },
      );
      if (!response.ok) continue;
      const data = (await response.json()) as {
        pairs?: Array<{
          chainId: string;
          dexId: string;
          pairAddress: string;
          baseToken: { symbol: string };
          quoteToken: { symbol: string };
          priceUsd?: string;
          liquidity?: { usd?: number };
          volume?: { h24?: number };
        }>;
      };
      for (const pair of data.pairs ?? []) {
        if (pair.chainId !== "solana") continue;
        if (!/meteora|damm|dlmm|dbc/i.test(pair.dexId)) continue;
        pools.push({
          name: `${pair.baseToken.symbol}/${pair.quoteToken.symbol}`,
          dex: pair.dexId,
          pairAddress: pair.pairAddress,
          base: pair.baseToken.symbol,
          quote: pair.quoteToken.symbol,
          priceUsd: pair.priceUsd ? Number(pair.priceUsd) : null,
          tvl: pair.liquidity?.usd ?? null,
          volume24h: pair.volume?.h24 ?? null,
        });
      }
    } catch {
      continue;
    }
  }

  const unique = new Map(pools.map((pool) => [pool.pairAddress, pool]));
  return [...unique.values()].sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0)).slice(0, 12);
}
