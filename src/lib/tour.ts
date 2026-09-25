export type Desk = "prestocks" | "tessera" | "basis" | "launch";

export type TourStep = {
  id: string;
  title: string;
  body: string;
  target?: string;
  desk?: Desk;
  href?: string;
  waitForWallet?: boolean;
};

export const TOUR_STORAGE_KEY = "opengap.tour.v1";
export const TOUR_WALLET_KEY = "opengap.tour.wallet.v1";
export const TOUR_WALLET_START = "wallet-book";
export const TOUR_STEP_KEY = "opengap.tour.step.v1";
export const TOUR_TOKEN_KEY = "opengap.tour.token.v1";
export const TOUR_DESK_EVENT = "opengap-desk";

export function pathMatches(pathname: string, href: string) {
  return pathname.toLowerCase() === href.toLowerCase();
}

export async function resolveStepHref(step: TourStep): Promise<string | null> {
  if (step.href === "/token/$cheap") {
    const cached =
      typeof window !== "undefined" ? window.sessionStorage.getItem(TOUR_TOKEN_KEY) : null;
    if (cached) return `/token/${cached}`;
    const symbol = await fetchCheapestSymbol();
    window.sessionStorage.setItem(TOUR_TOKEN_KEY, symbol);
    return `/token/${symbol}`;
  }
  if (step.href) return step.href;
  if (step.desk) return "/";
  return null;
}

async function fetchCheapestSymbol() {
  try {
    const data = (await fetch("/api/tape", { cache: "no-store" }).then((response) =>
      response.json(),
    )) as { rows?: { symbol: string; premium: number }[] };
    const cheap = [...(data.rows ?? [])].sort((a, b) => a.premium - b.premium)[0];
    return (cheap?.symbol ?? "kalshi").toLowerCase();
  } catch {
    return "kalshi";
  }
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "why",
    title: "Tape vs mark",
    body: "Tape is the live price on Jupiter — what you actually pay if you buy right now. Mark is the official reference from the issuer (PreStocks, or Yahoo on listed names). It is not a quote you can lift. Green means tape is cheaper than mark. That gap is the trade.",
  },
  {
    id: "discount",
    title: "Cheapest name",
    body: "This card is the widest green gap right now. After the tour, Buy here if you want that lot.",
    target: "discount",
    desk: "prestocks",
  },
  {
    id: "trade",
    title: "Buy and sell",
    body: "Pick a name. Jupiter quotes a live route — hops often land on Meteora. Buy, or Sell with Max of what you hold. OpenGap takes 1% on every fill.",
    target: "trade",
    desk: "prestocks",
  },
  {
    id: "table",
    title: "Read a row",
    body: "Tape is what you pay on Jupiter. Mark is the issuer, not a quote you can lift. Green means tape is cheaper — that gap is the trade. Red is a premium. Discount hides rich names.",
    target: "table",
    desk: "prestocks",
  },
  {
    id: "book",
    title: "Your portfolio",
    body: "Book is the old name for this panel. It is your portfolio now: SOL, USDC, and any lots you hold, with live dollar values. Header Portfolio opens the full page.",
    target: "book",
    desk: "prestocks",
  },
  {
    id: "history",
    title: "Fills stay here",
    body: "Every buy or sell you sign in this browser lands in History, with a Solscan link. It is not stored in the cloud.",
    target: "history",
    desk: "prestocks",
  },
  {
    id: "desks",
    title: "Four desks",
    body: "PreStocks is the main tape. Tessera and Listed are other rooms. ClawPump is the agent — it can buy a cheap name for you.",
    target: "desks",
    desk: "prestocks",
  },
  {
    id: "tessera",
    title: "T-OpenAI is not OPENAI",
    body: "Tessera T-tokens track a loan, not a share. Same Buy button, different claim. Do not mix them with PreStocks of the same name.",
    target: "tessera",
    desk: "tessera",
  },
  {
    id: "basis",
    title: "Listed evidence",
    body: "Yahoo cash versus the xStock tape for names like AAPL. The dollar gap is the evidence. You do not buy from this table.",
    target: "basis",
    desk: "basis",
  },
  {
    id: "launch",
    title: "The agent room",
    body: "ClawPump is not another tape. This is the OpenGap bot. It watches the same names you just saw, and it can buy when a name is cheap.",
    target: "launch",
    desk: "launch",
  },
  {
    id: "launch-agent",
    title: "On or off",
    body: "On means it is watching. Send latest prices hands it the live list. Pause stops it. Each buy is $5, and only if a name is at least 3% cheaper than the official price.",
    target: "launch-agent",
    desk: "launch",
  },
  {
    id: "launch-watch",
    title: "What it watches",
    body: "Same gap as the tape: live price versus official price. Green is cheaper — that is when it may buy. Last decision is what it did last time.",
    target: "launch-watch",
    desk: "launch",
  },
  {
    id: "launch-quote",
    title: "The OpenGap token",
    body: "$OPENGAP graduated to PumpSwap (OPENGAP/SOL). The stock-paired pool is still OPENGAP/SPACEX on Meteora. The agent does not mint another.",
    target: "launch-quote",
    desk: "launch",
  },
  {
    id: "connect",
    title: "Connect, then trade",
    body: "Connect a Solana wallet. The tour continues after you sign in — your portfolio, then a first buy.",
    target: "connect",
    desk: "prestocks",
    waitForWallet: true,
  },
  {
    id: "wallet-book",
    title: "This is your portfolio",
    body: "The wallet you just connected. Book used to mean this — the app now says Portfolio: SOL, USDC, and any lots, with live dollar values.",
    target: "book",
    desk: "prestocks",
    href: "/",
  },
  {
    id: "wallet-token",
    title: "One name",
    body: "A live token page. Tape vs mark, then Buy or Sell. Sell defaults to Max of what you hold.",
    target: "token",
    href: "/token/$cheap",
  },
  {
    id: "wallet-portfolio",
    title: "Full portfolio",
    body: "The portfolio page — cash, lots, history, and P&L. Book was the old name for this. Header Portfolio opens it anytime.",
    target: "portfolio-page",
    href: "/portfolio",
  },
  {
    id: "stake",
    title: "Lock $OPENGAP",
    body: "Pick 30, 90, 180, or 360 days. APY matches the term. You send $OPENGAP to the staking address; the lock and reward show in Portfolio on this device.",
    target: "stake",
    href: "/stake",
  },
];
