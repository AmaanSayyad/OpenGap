import type { JupiterQuote } from "@/lib/jupiter";

export type RouteHop = {
  label: string;
  percent: number;
  ammKey: string;
};

export function parseRoute(quote: JupiterQuote | null): RouteHop[] {
  if (!quote?.routePlan?.length) return [];
  return quote.routePlan.map((hop) => ({
    label: hop.swapInfo?.label ?? "Venue",
    percent: hop.percent ?? 0,
    ammKey: hop.swapInfo?.ammKey ?? "",
  }));
}

export function meteoraPoolUrl(
  address: string,
  kind: "dammv2" | "dammv1" | "dlmm" | "dbc" = "dammv2",
) {
  if (kind === "dlmm") return `https://app.meteora.ag/dlmm/${address}`;
  if (kind === "dbc") return `https://app.meteora.ag/dbc/${address}`;
  if (kind === "dammv1") return `https://app.meteora.ag/pools/${address}`;
  return `https://app.meteora.ag/dammv2/${address}`;
}

export function hopHref(hop: RouteHop) {
  if (/meteora/i.test(hop.label) && hop.ammKey) {
    if (/dlmm/i.test(hop.label)) return meteoraPoolUrl(hop.ammKey, "dlmm");
    if (/dbc|dynamic/i.test(hop.label)) return meteoraPoolUrl(hop.ammKey, "dbc");
    if (/damm\s*v1|legacy/i.test(hop.label)) return meteoraPoolUrl(hop.ammKey, "dammv1");
    return meteoraPoolUrl(hop.ammKey, "dammv2");
  }
  if (hop.ammKey) return `https://solscan.io/account/${hop.ammKey}`;
  return "https://jup.ag";
}

export function isMeteora(hop: RouteHop) {
  return /meteora/i.test(hop.label);
}

export function poolHref(dex: string, pairAddress: string) {
  if (/pumpswap|pumpfun|pump\.fun/i.test(dex)) {
    return `https://dexscreener.com/solana/${pairAddress}`;
  }
  if (/dlmm/i.test(dex)) return meteoraPoolUrl(pairAddress, "dlmm");
  if (/dbc|dynamic/i.test(dex)) return meteoraPoolUrl(pairAddress, "dbc");
  if (/damm\s*v1|legacy/i.test(dex)) return meteoraPoolUrl(pairAddress, "dammv1");
  return meteoraPoolUrl(pairAddress, "dammv2");
}
