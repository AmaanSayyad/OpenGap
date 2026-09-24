const LOCAL: Record<string, string> = {
  ANDURIL: "/logos/anduril.png",
  ANTHROPIC: "/logos/anthropic.svg",
  KALSHI: "/logos/kalshi.png",
  "T-KALSHI": "/logos/kalshi.png",
  NEURALINK: "/logos/neuralink.png",
  OPENAI: "/logos/openai.svg",
  "T-OPENAI": "/logos/openai.svg",
  POLYMARKET: "/logos/polymarket.png",
  SPACEX: "/logos/spacex.svg",
  "T-SPACEX": "/logos/spacex.svg",
  AAPL: "/logos/apple.svg",
  AAPLX: "/logos/apple.svg",
  TSLA: "/logos/tesla.svg",
  TSLAX: "/logos/tesla.svg",
  NVDA: "/logos/nvidia.svg",
  NVDAX: "/logos/nvidia.svg",
  SOL: "/logos/sol.png",
  USDC: "/logos/usdc.png",
};

export function logoSrc(symbol: string, image?: string | null) {
  return LOCAL[symbol.trim().toUpperCase()] ?? image ?? null;
}

/** Black-on-transparent official marks that disappear on a dark page. */
const INVERT_ON_DARK = new Set([
  "SPACEX",
  "T-SPACEX",
  "OPENAI",
  "T-OPENAI",
  "ANTHROPIC",
  "ANDURIL",
  "NEURALINK",
  "AAPL",
  "AAPLX",
]);

export function logoNeedsInvert(symbol: string) {
  return INVERT_ON_DARK.has(symbol.trim().toUpperCase());
}
