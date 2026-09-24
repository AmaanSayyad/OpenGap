"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { RouteHops } from "@/components/route-hops";
import { PriceChart } from "@/components/price-chart";
import { TokenLogo } from "@/components/token-logo";
import { SiteHeader } from "@/components/site-header";
import { TourHint } from "@/components/product-tour";
import { BuySheet } from "@/components/buy-sheet";
import { FillHistory } from "@/components/fill-history";
import { HoldingsBook } from "@/components/holdings-book";
import { useLastFill } from "@/hooks/use-last-fill";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Eyebrow, PageTitle, Panel } from "@/components/ui-kit";
import { useLiveQuote } from "@/hooks/use-live-quote";
import { usePrintHistory } from "@/hooks/use-print-history";
import { DEFAULT_BUY_USDC, USDC_DECIMALS, USDC_MINT } from "@/lib/constants";
import { formatPct, formatPrice, formatUsd, shortAddress } from "@/lib/format";
import type { TapeRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TokenView({ symbol }: { symbol: string }) {
  const [row, setRow] = useState<TapeRow | null>(null);
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [tape, tessera] = await Promise.all([
          fetch("/api/tape", { cache: "no-store" }).then((response) => response.json()),
          fetch("/api/tessera", { cache: "no-store" }).then((response) => response.json()),
        ]);
        const rows = [
          ...((tape as { rows?: TapeRow[] }).rows ?? []),
          ...((tessera as { rows?: TapeRow[] }).rows ?? []),
        ];
        const wanted = decodeURIComponent(symbol).toLowerCase();
        const match = rows.find((item) => item.symbol.toLowerCase() === wanted);
        if (!match) throw new Error("Unknown token");
        if (!cancelled) {
          setRow(match);
          setError(null);
        }
      } catch (next) {
        if (!cancelled) setError(next instanceof Error ? next.message : "Failed");
      }
    }
    load();
    const timer = window.setInterval(load, 12_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [symbol]);

  const printRows = useMemo(() => (row ? [row] : []), [row]);
  const prints = usePrintHistory(printRows);
  const lastFill = useLastFill();
  const [bookRefresh, setBookRefresh] = useState(0);
  const live = useLiveQuote(
    USDC_MINT,
    row?.mint ?? null,
    Math.round(DEFAULT_BUY_USDC * 10 ** USDC_DECIMALS),
    Boolean(row),
  );
  const out =
    live.quote && row
      ? (Number(live.quote.outAmount) / 10 ** row.decimals) * row.multiplier
      : 0;

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-5 py-14 sm:gap-14 sm:px-6 sm:py-16">
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : !row ? (
          <Skeleton className="h-80 rounded-xl" />
        ) : (
          <>
            <div
              data-tour="token"
              className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
            >
              <div className="flex items-start gap-4">
                <TokenLogo symbol={row.symbol} image={row.image} size="lg" className="mt-1" />
                <div>
                <Eyebrow>{row.issuer === "tessera" ? "Tessera T-token" : "PreStock"}</Eyebrow>
                <PageTitle className="mt-2 max-w-none">{row.name}</PageTitle>
                <p className="mt-3 font-mono text-sm text-muted-foreground">{row.symbol}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    setSide("sell");
                    setOpen(true);
                  }}
                >
                  Sell
                </Button>
                <Button
                  size="lg"
                  onClick={() => {
                    setSide("buy");
                    setOpen(true);
                  }}
                >
                  Buy {row.symbol}
                </Button>
              </div>
            </div>

            <TourHint />

            <div className="grid min-w-0 gap-8 md:grid-cols-2 md:items-start">
              <HoldingsBook refresh={bookRefresh} />
              <FillHistory
                fills={lastFill.fills.filter((fill) => fill.symbol === row.symbol)}
                limit={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Metric label="Tape" value={formatPrice(row.execPrice)} />
              <Metric label="Mark" value={formatPrice(row.markPrice)} />
              <Metric
                label="To mark"
                value={formatPct(row.premium)}
                tone={row.premium < 0 ? "gain" : "loss"}
              />
              <Metric
                label="24h"
                value={
                  row.change24h == null
                    ? "—"
                    : `${row.change24h > 0 ? "+" : ""}${row.change24h.toFixed(1)}%`
                }
              />
            </div>

            <PriceChart
              symbol={row.symbol}
              values={prints.series[row.symbol] ?? [row.execPrice]}
            />

            <div className="grid gap-8 md:grid-cols-2 md:items-start">
            <Panel className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Eyebrow>Live $25 Jupiter</Eyebrow>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Refresh {live.left}s</span>
                  <button
                    type="button"
                    onClick={live.refresh}
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    Retry
                  </button>
                </div>
              </div>
              <p className="font-mono text-sm">
                {live.loading && !out
                  ? "Quoting…"
                  : out
                    ? `${out.toFixed(5)} ${row.symbol}`
                    : live.error ?? "—"}
              </p>
              <RouteHops hops={live.hops} loading={live.loading} />
              <Button className="self-start" onClick={() => setOpen(true)}>
                Continue to buy
              </Button>
            </Panel>

            <Panel className="flex flex-col gap-4">
            <article className="space-y-4 text-sm leading-7 text-muted-foreground">
              {row.description.split("\n").filter(Boolean).map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </article>

            <dl className="grid gap-1 text-sm">
              <Pair label="Implied valuation" value={formatUsd(row.impliedValuation)} />
              <Pair label="Mark valuation" value={formatUsd(row.markValuation)} />
              <Pair label="Scaled UI" value={`${row.multiplier.toFixed(4)}×`} />
              <Pair label="Mint" value={shortAddress(row.mint, 6)} />
              {row.holders != null ? (
                <Pair label="Holders" value={row.holders.toLocaleString()} />
              ) : null}
              {row.sector ? <Pair label="Sector" value={row.sector} /> : null}
              {row.supply != null ? (
                <Pair label="Supply" value={row.supply.toLocaleString()} />
              ) : null}
            </dl>

            <a
              href={row.url}
              className="text-sm underline underline-offset-4"
              target="_blank"
              rel="noreferrer"
            >
              Issuer page
            </a>
            </Panel>
            </div>
          </>
        )}
      </main>
      <BuySheet
        row={row}
        open={open}
        onOpenChange={setOpen}
        initialSide={side}
        onFill={(fill) => {
          lastFill.save(fill);
          setBookRefresh((value) => value + 1);
        }}
      />
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
  children,
}: {
  label: string;
  value?: string;
  tone?: "gain" | "loss";
  children?: ReactNode;
}) {
  return (
    <Panel className="px-4 py-3">
      <Eyebrow>{label}</Eyebrow>
      {children ? (
        <div className="mt-2">{children}</div>
      ) : (
        <div
          className={cn(
            "mt-1 font-mono text-sm",
            tone === "gain" && "text-gain",
            tone === "loss" && "text-loss",
          )}
        >
          {value}
        </div>
      )}
    </Panel>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono">{value}</dd>
    </div>
  );
}
