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

export function hopHref(hop: RouteHop) {
  if (/meteora/i.test(hop.label) && hop.ammKey) {
    if (/dlmm/i.test(hop.label)) return `https://app.meteora.ag/dlmm/${hop.ammKey}`;
    if (/dbc|dynamic/i.test(hop.label)) return `https://app.meteora.ag/dbc/${hop.ammKey}`;
    return `https://app.meteora.ag/pools/${hop.ammKey}`;
  }
  if (hop.ammKey) return `https://solscan.io/account/${hop.ammKey}`;
  return "https://jup.ag";
}

export function isMeteora(hop: RouteHop) {
  return /meteora/i.test(hop.label);
}

export function poolHref(dex: string, pairAddress: string) {
  if (/dlmm/i.test(dex)) return `https://app.meteora.ag/dlmm/${pairAddress}`;
  if (/dbc|dynamic/i.test(dex)) return `https://app.meteora.ag/dbc/${pairAddress}`;
  if (/damm/i.test(dex)) return `https://app.meteora.ag/pools/${pairAddress}`;
  return `https://app.meteora.ag/pools/${pairAddress}`;
}
