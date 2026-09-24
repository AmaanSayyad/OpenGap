import type { LastFill } from "@/hooks/use-last-fill";

export function fillUsd(fill: LastFill) {
  return Number.isFinite(fill.paidUsd) && fill.paidUsd > 0
    ? fill.paidUsd
    : fill.tokens * fill.fillPrice;
}

type Lot = { tokens: number; cost: number };

function consumeLots(queue: Lot[], tokens: number, proceeds: number) {
  let remaining = tokens;
  let realized = 0;
  let matched = 0;
  while (remaining > 1e-12 && queue.length) {
    const lot = queue[0];
    const take = Math.min(lot.tokens, remaining);
    const cost = lot.cost * (take / lot.tokens);
    realized += proceeds * (take / tokens) - cost;
    lot.tokens -= take;
    lot.cost -= cost;
    remaining -= take;
    matched += take;
    if (lot.tokens < 1e-12) queue.shift();
  }
  return { realized, leftover: remaining, matched };
}

export function realizedPnl(fills: LastFill[]) {
  const lots: Record<string, Lot[]> = {};
  let realized = 0;
  for (const fill of [...fills].sort((a, b) => a.at - b.at)) {
    const paid = fillUsd(fill);
    if (fill.side === "buy") {
      lots[fill.symbol] ??= [];
      lots[fill.symbol].push({ tokens: fill.tokens, cost: paid });
    } else {
      const queue = lots[fill.symbol] ?? [];
      realized += consumeLots(queue, fill.tokens, paid).realized;
    }
  }
  return realized;
}

export function leftoverLots(fills: LastFill[]) {
  const lots: Record<string, Lot[]> = {};
  for (const fill of [...fills].sort((a, b) => a.at - b.at)) {
    if (fill.side === "buy") {
      lots[fill.symbol] ??= [];
      lots[fill.symbol].push({ tokens: fill.tokens, cost: fillUsd(fill) });
    } else {
      consumeLots(lots[fill.symbol] ?? [], fill.tokens, fillUsd(fill));
    }
  }
  return lots;
}

export function averageCost(fills: LastFill[], symbol: string) {
  const queue = leftoverLots(fills)[symbol] ?? [];
  const tokens = queue.reduce((sum, lot) => sum + lot.tokens, 0);
  const cost = queue.reduce((sum, lot) => sum + lot.cost, 0);
  return { tokens, cost, avg: tokens > 0 ? cost / tokens : 0 };
}
