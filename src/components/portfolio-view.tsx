"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FillHistory } from "@/components/fill-history";
import { StakeLocks } from "@/components/stake-locks";
import { useStakes } from "@/hooks/use-stakes";
import { useOpenGapPrice } from "@/hooks/use-opengap-price";
import { SiteHeader } from "@/components/site-header";
import { TokenLogo } from "@/components/token-logo";
import { Button } from "@/components/ui/button";
import { Eyebrow, PageTitle, Panel } from "@/components/ui-kit";
import { useLastFill } from "@/hooks/use-last-fill";
import { useWalletBook } from "@/hooks/use-wallet-book";
import { formatPct, formatSignedUsd, formatUsd, shortAddress } from "@/lib/format";
import { formatUnlockAt } from "@/lib/staking";
import { averageCost, realizedPnl } from "@/lib/pnl";
import type { TapeRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PortfolioView() {
  const { book, error, connectedOwner } = useWalletBook();
  const { fills } = useLastFill();
  const { totals, stakes } = useStakes();
  const openGapPrice = useOpenGapPrice();
  const lockedUsd = openGapPrice ? totals.locked * openGapPrice : 0;
  const [desk, setDesk] = useState<TapeRow[]>([]);
  const tokens = book?.positions.filter((row) => row.issuer !== "cash") ?? [];
  const tokenTape = tokens.reduce((sum, row) => sum + row.tapeValue, 0);
  const tokenMark = tokens.reduce((sum, row) => sum + row.markValue, 0);
  const cash = book?.usdc ?? 0;
  const solPrice = book?.solPrice ?? 0;
  const solValue = book?.solValue ?? (book ? book.sol * solPrice : 0);
  const realized = realizedPnl(fills);
  const total = cash + tokenTape + solValue + lockedUsd;

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
        if (!cancelled) setDesk(rows);
      } catch {
        if (!cancelled) setDesk([]);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const cheap = [...desk].filter((row) => row.premium < 0).sort((a, b) => a.premium - b.premium);

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:gap-10 sm:px-6 sm:py-12">
        <div data-tour="portfolio-page" className="flex flex-col gap-8">
        <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>Portfolio</Eyebrow>
            <PageTitle className="mt-3">Your portfolio</PageTitle>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              {connectedOwner
                ? `On-chain for ${shortAddress(connectedOwner, 4)}. Fills stay on this device.`
                : "Test wallet on mainnet until you connect. Fills stay on this device."}{" "}
              Book was the old name for this page: SOL, USDC, and any lots you
              hold, with live dollar values.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-muted-foreground">SOL + USDC + names + locked</p>
            <p className="mt-1 font-mono text-3xl tracking-tight">
              {book ? formatUsd(total) : "…"}
            </p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {book ? `${book.sol.toFixed(4)} SOL` : ""}
              {solPrice ? ` · ${formatUsd(solPrice)}` : ""}
              {book ? ` · ${shortAddress(book.owner, 4)}` : ""}
            </p>
          </div>
        </section>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <CashStat
            symbol="SOL"
            label="Solana"
            value={book ? formatUsd(solValue) : "…"}
            hint={
              book
                ? `${book.sol.toFixed(4)} SOL${solPrice ? ` · ${formatUsd(solPrice)}` : ""}`
                : undefined
            }
          />
          <CashStat symbol="USDC" label="USD Coin" value={book ? formatUsd(cash) : "…"} />
          <CashStat
            symbol={tokens[0]?.symbol ?? cheap[0]?.symbol ?? "SPACEX"}
            image={tokens[0]?.image ?? cheap[0]?.image}
            label="Holdings tape"
            value={book ? formatUsd(tokenTape) : "…"}
            stacked={(tokens.length ? tokens : desk).slice(0, 4)}
          />
          <CashStat
            symbol="OPENGAP"
            image="/opengap.png"
            label="Locked $OPENGAP"
            value={totals.locked ? formatAmtLocked(totals.locked) : "—"}
            hint={
              totals.locked
                ? `${lockedUsd ? `${formatUsd(lockedUsd)} · ` : ""}${totals.count} lock${totals.count === 1 ? "" : "s"}${
                    stakes[0] ? ` · unlock ${formatUnlockAt(Math.min(...stakes.map((row) => row.unlockAt)))}` : ""
                  }`
                : "Stake to lock"
            }
          />
          <Panel className="flex items-center gap-3">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-muted/80 ring-1 ring-border/70">
              <span
                className={cn(
                  "font-mono text-xs font-semibold",
                  realized > 0 && "text-gain",
                  realized < 0 && "text-loss",
                )}
              >
                P&L
              </span>
            </span>
            <div>
              <Eyebrow>Realized</Eyebrow>
              <p
                className={cn(
                  "mt-1 font-mono text-lg",
                  realized > 0 && "text-gain",
                  realized < 0 && "text-loss",
                )}
              >
                {fills.length ? formatSignedUsd(realized) : "—"}
              </p>
            </div>
          </Panel>
        </section>
        </div>

        <div className="grid min-w-0 gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <Panel className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Eyebrow>Positions</Eyebrow>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tape {formatUsd(tokenTape)} · mark {formatUsd(tokenMark)}
                </p>
              </div>
              <Link
                href="/?desk=prestocks"
                className="text-xs underline underline-offset-4 text-muted-foreground hover:text-foreground"
              >
                Open tape
              </Link>
            </div>

            {!book ? (
              <p className="text-sm text-muted-foreground">Reading balances…</p>
            ) : (
              <ul className="flex flex-col gap-1">
                <CashRow
                  symbol="SOL"
                  name="Solana"
                  amount={`${book.sol.toFixed(4)} SOL${solPrice ? ` · ${formatUsd(solPrice)}` : ""}`}
                  value={solPrice ? formatUsd(solValue) : "—"}
                />
                <CashRow
                  symbol="USDC"
                  name="USD Coin"
                  amount={`${book.usdc.toFixed(2)} USDC`}
                  value={formatUsd(book.usdc)}
                />
                {tokens.map((row) => {
                  const cost = averageCost(fills, row.symbol);
                  const vsMark = row.markValue
                    ? (row.tapeValue - row.markValue) / row.markValue
                    : null;
                  const vsCost =
                    cost.tokens > 0.0001
                      ? row.tapeValue - cost.cost * (row.uiAmount / cost.tokens)
                      : null;
                  return (
                    <li key={row.mint}>
                      <Link
                        href={`/token/${encodeURIComponent(row.symbol)}`}
                        className="flex items-center justify-between gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <TokenLogo
                            symbol={row.symbol}
                            image={row.image}
                            size="lg"
                            framed
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{row.name}</p>
                            <p className="font-mono text-xs text-muted-foreground">
                              {row.uiAmount.toFixed(4)} {row.symbol}
                              {row.issuer === "tessera" ? " · T-token" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-mono text-sm">{formatUsd(row.tapeValue)}</p>
                          {vsMark != null ? (
                            <p
                              className={cn(
                                "font-mono text-xs",
                                vsMark < 0 ? "text-gain" : "text-loss",
                              )}
                            >
                              {formatPct(vsMark)} mark
                            </p>
                          ) : null}
                          {vsCost != null ? (
                            <p
                              className={cn(
                                "font-mono text-xs",
                                vsCost >= 0 ? "text-gain" : "text-loss",
                              )}
                            >
                              {formatSignedUsd(vsCost)} cost
                            </p>
                          ) : null}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            {book && tokens.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 px-4 py-5">
                <p className="text-sm font-medium">No tokenized names yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Buy a name and the lot lands here with its mark.
                </p>
                <DeskLogos rows={desk} />
                <Button asChild size="sm" className="mt-4">
                  <Link href="/?desk=prestocks">Browse PreStocks</Link>
                </Button>
              </div>
            ) : null}
          </Panel>

          <div className="flex flex-col gap-8">
            <StakeLocks compact />
            <FillHistory fills={fills} variant="page" />
            {cheap.length ? (
              <Panel className="flex flex-col gap-4">
                <div>
                  <Eyebrow>Cheap to mark</Eyebrow>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Green names: tape cheaper than mark. That gap is the trade,
                    not locked profit.
                  </p>
                </div>
                <ul className="flex flex-col gap-1">
                  {cheap.slice(0, 4).map((row) => (
                    <li key={row.mint}>
                      <Link
                        href={`/token/${encodeURIComponent(row.symbol)}`}
                        className="flex items-center justify-between gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <TokenLogo symbol={row.symbol} image={row.image} size="md" framed />
                          <div>
                            <p className="text-sm font-medium">{row.symbol}</p>
                            <p className="text-xs text-muted-foreground">{row.name}</p>
                          </div>
                        </div>
                        <p className="font-mono text-sm text-gain">{formatPct(row.premium)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Panel>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}

function formatAmtLocked(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  return value.toLocaleString("en-US", { maximumFractionDigits: 1 });
}

function CashStat({
  symbol,
  image,
  label,
  value,
  hint,
  stacked,
}: {
  symbol: string;
  image?: string | null;
  label: string;
  value: string;
  hint?: string;
  stacked?: Array<{ symbol: string; image?: string | null }>;
}) {
  return (
    <Panel className="flex items-center gap-3">
      {stacked && stacked.length > 1 ? (
        <span className="flex -space-x-2">
          {stacked.map((row) => (
            <TokenLogo
              key={row.symbol}
              symbol={row.symbol}
              image={row.image}
              size="md"
              framed
              className="ring-2 ring-background"
            />
          ))}
        </span>
      ) : (
        <TokenLogo symbol={symbol} image={image} size="lg" framed />
      )}
      <div>
        <Eyebrow>{label}</Eyebrow>
        <p className="mt-1 font-mono text-lg">{value}</p>
        {hint ? <p className="mt-0.5 font-mono text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </Panel>
  );
}

function CashRow({
  symbol,
  name,
  amount,
  value,
}: {
  symbol: string;
  name: string;
  amount: string;
  value: string | null;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl px-2 py-2.5">
      <div className="flex items-center gap-3">
        <TokenLogo symbol={symbol} size="lg" framed />
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="font-mono text-xs text-muted-foreground">{amount}</p>
        </div>
      </div>
      {value ? <p className="font-mono text-sm">{value}</p> : null}
    </li>
  );
}

function DeskLogos({ rows }: { rows: TapeRow[] }) {
  if (!rows.length) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {rows.map((row) => (
        <Link
          key={row.mint}
          href={`/token/${encodeURIComponent(row.symbol)}`}
          className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/60 py-1 pr-3 pl-1 text-xs hover:border-foreground/30"
        >
          <TokenLogo symbol={row.symbol} image={row.image} size="sm" className="size-6" />
          {row.symbol}
        </Link>
      ))}
    </div>
  );
}
