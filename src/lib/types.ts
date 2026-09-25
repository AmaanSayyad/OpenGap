export type PreStockRaw = {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url: string;
  contract_address: string;
  markPrice: number;
  markValuation: number;
  tokenPrice: number;
  impliedValuation: number;
  supply: number;
};

export type JupiterPrice = {
  usdPrice: number;
  decimals: number;
  liquidity?: number;
  priceChange24h?: number;
  stockData?: {
    id?: string;
    price: number;
    mcap: number;
    updatedAt: string;
  };
  scaledUiConfig?: {
    multiplier: number;
    newMultiplier?: number;
    usdPricePrescaled?: number;
  };
};

export type Issuer = "prestocks" | "tessera" | "xstock" | "ondo";

export type TapeRow = {
  issuer?: Issuer;
  symbol: string;
  name: string;
  description: string;
  image: string;
  url: string;
  mint: string;
  markPrice: number;
  tokenPrice: number;
  execPrice: number;
  premium: number;
  impliedValuation: number;
  markValuation: number;
  liquidity: number | null;
  change24h: number | null;
  multiplier: number;
  decimals: number;
  supply?: number | null;
  holders?: number | null;
  sector?: string | null;
};

export type TapeResponse = {
  rows: TapeRow[];
  updatedAt: string;
  pre8: {
    premium: number;
    execValue: number;
    markValue: number;
  };
};

export type BasisRow = {
  symbol: string;
  name: string;
  image?: string | null;
  cashPrice: number | null;
  xPrice: number | null;
  onPrice: number | null;
  xMint: string;
  onMint: string | null;
  xDex: string | null;
  xPremium: number | null;
  onPremium: number | null;
  xDiff: number | null;
  onDiff: number | null;
  cashSource: string | null;
  xSource: string | null;
  venue: string;
};

export type MeteoraPool = {
  name: string;
  dex: string;
  pairAddress: string;
  base: string;
  quote: string;
  priceUsd: number | null;
  tvl: number | null;
  volume24h: number | null;
};

export type MarketsResponse = {
  prestocks: TapeRow[];
  tessera: TapeRow[];
  basis: BasisRow[];
  meteora: MeteoraPool[];
  updatedAt: string;
};
