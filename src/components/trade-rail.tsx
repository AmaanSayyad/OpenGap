"use client";

import { useMemo } from "react";
import { RouteHops } from "@/components/route-hops";
import { TokenLogo } from "@/components/token-logo";
import { Button } from "@/components/ui/button";
import { Eyebrow, Panel } from "@/components/ui-kit";
import { DEFAULT_BUY_USDC, USDC_DECIMALS, USDC_MINT } from "@/lib/constants";
import { formatPct, formatPrice } from "@/lib/format";
import { useLiveQuote } from "@/hooks/use-live-quote";
import type { TapeRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TradeRail({
  rows,
  selected,
  onSelect,
  onBuy,
}: {
  rows: TapeRow[];
  selected: TapeRow | null;
  onSelect: (row: TapeRow) => void;
  onBuy: (row: TapeRow) => void;
}) {
  const picks = useMemo(
    () => [...rows].sort((a, b) => a.premium - b.premium).slice(0, 6),
    [rows],
  );
  const row = selected ?? picks[0] ?? null;
  const amount = Math.round(DEFAULT_BUY_USDC * 10 ** USDC_DECIMALS);
  const live = useLiveQuote(USDC_MINT, row?.mint ?? null, amount, Boolean(row));

  const out =
    live.quote && row
      ? (Number(live.quote.outAmount) / 10 ** row.decimals) * row.multiplier
      : 0;
  const exec =
    live.quote && out
      ? DEFAULT_BUY_USDC / out
      : null;

  return (
    <Panel className="flex flex-col gap-6">
      <div>
        <Eyebrow>Live trade</Eyebrow>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a name, read the gap, watch Jupiter, then buy.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {picks.map((item) => (
          <button
            key={item.mint}
            type="button"
            onClick={() => onSelect(item)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-sm transition-colors",
              row?.mint === item.mint
                ? "border-foreground bg-foreground text-background"
                : "border-border/80 text-muted-foreground hover:text-foreground",
            )}
          >
            <TokenLogo symbol={item.symbol} image={item.image} size="sm" />
            {item.symbol}
            <span
              className={cn(
                "ml-2 font-mono text-xs",
                row?.mint === item.mint
                  ? "text-background/80"
                  : item.premium < 0
                    ? "text-gain"
                    : "text-loss",
              )}
            >
              {formatPct(item.premium)}
            </span>
          </button>
        ))}
      </div>

      {row ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Fact
            label="Gap"
            value={formatPct(row.premium)}
            hint={`${formatPrice(row.execPrice)} tape vs ${formatPrice(row.markPrice)} mark`}
            tone={row.premium < 0 ? "gain" : "loss"}
          />
          <Fact
            label="$25 Jupiter"
            value={out ? `${out.toFixed(4)} ${row.symbol}` : live.loading ? "Quoting…" : "—"}
            hint={
              exec
                ? `Exec ${formatPrice(exec)} · refresh ${live.left}s`
                : live.error
                  ? live.error
                  : "Waiting on Jupiter…"
            }
          />
          <Fact
            label="Impact"
            value={
              live.quote
                ? `${(Number(live.quote.priceImpactPct) * 100).toFixed(2)}%`
                : "—"
            }
            hint={row.issuer === "tessera" ? "T-token · loan, not equity" : "PreStock"}
          />
        </div>
      ) : null}

      <RouteHops hops={live.hops} loading={live.loading} />

      {live.error ? (
        <button
          type="button"
          onClick={live.refresh}
          className="self-start text-xs underline underline-offset-2"
        >
          Retry quote
        </button>
      ) : null}

      {row ? (
        <Button className="self-start" onClick={() => onBuy(row)}>
          Buy {row.symbol}
        </Button>
      ) : null}
    </Panel>
  );
}

function Fact({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "gain" | "loss";
}) {
  return (
    <div className="flex min-h-[5.5rem] flex-col rounded-xl border border-border/70 px-3 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-mono text-sm tabular-nums",
          tone === "gain" && "text-gain",
          tone === "loss" && "text-loss",
        )}
      >
        {value}
      </p>
      <p className="mt-auto pt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
