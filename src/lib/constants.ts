export const PRESTOCKS_API = "https://prestocks.com/api/prestocks";
export const JUPITER_PRICE_API = "https://lite-api.jup.ag/price/v3";
export const JUPITER_QUOTE_API = "https://lite-api.jup.ag/swap/v1/quote";
export const JUPITER_SWAP_API = "https://lite-api.jup.ag/swap/v1/swap";

export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const USDC_DECIMALS = 6;
export const WSOL_MINT = "So11111111111111111111111111111111111111112";
export const WSOL_DECIMALS = 9;

export const SOLANA_RPC =
  process.env.NEXT_PUBLIC_SOLANA_RPC ?? "https://solana-rpc.publicnode.com";

export const HIDDEN_SYMBOLS = new Set(["FIGUREAI"]);

export const DEFAULT_BUY_USDC = 25;
export const DEFAULT_BASKET_USDC = 80;
export const DEFAULT_SLIPPAGE_BPS = 100;
