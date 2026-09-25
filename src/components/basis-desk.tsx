"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PriceChart, TradingViewTicker } from "@/components/price-chart";
import { TokenLogo } from "@/components/token-logo";
import { Eyebrow, Panel, SectionTitle } from "@/components/ui-kit";
import { formatPct, formatPrice, formatSignedUsd } from "@/lib/format";
import type { BasisRow } from "@/lib/types";
import { cn } from "@/lib/utils";

const POLL_MS = 20_000;

export function BasisDesk() {
  const [basis, setBasis] = useState<BasisRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(POLL_MS / 1000);
  const [fetchedAt, setFetchedAt] = useState(Date.now());
  const [picked, setPicked] = useState("AAPL");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/basis", { cache: "no-store" });
        const payload = (await response.json()) as {
          basis?: BasisRow[];
          error?: string;
        };
        if (!response.ok) throw new Error(payload.error ?? "Basis failed");
        if (cancelled) return;
        setBasis(payload.basis ?? []);
        setFetchedAt(Date.now());
        setError(null);
      } catch (next) {
        if (!cancelled) setError(next instanceof Error ? next.message : "Basis failed");
      }
    }
    load();
    const timer = window.setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    function tick() {
      setLeft(Math.max(0, Math.ceil((POLL_MS - (Date.now() - fetchedAt)) / 1000)));
    }
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [fetchedAt]);

  const cheap = [...basis]
    .filter((row) => row.xPremium != null)
    .sort((a, b) => (a.xPremium ?? 0) - (b.xPremium ?? 0))[0];
  const pickedRow = basis.find((row) => row.symbol === picked) ?? cheap;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <SectionTitle>Listed stocks</SectionTitle>
        <p className="mt-1 text-sm text-muted-foreground">
          Yahoo cash versus Jupiter xStock tape. The dollar print is the
          evidence. Look only — you do not buy here. Next print {left}s.
        </p>
      </div>

      <TradingViewTicker />

      <PriceChart symbol={picked} />

      {cheap ? (
        <Panel className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <TokenLogo symbol={cheap.symbol} />
            <div>
            <Eyebrow>Cheapest xStock vs cash</Eyebrow>
            <p className="mt-1 text-sm font-medium">
              {cheap.name} · Jupiter {formatPrice(cheap.xPrice ?? 0)} vs Yahoo{" "}
              {formatPrice(cheap.cashPrice ?? 0)}
            </p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {cheap.xDiff != null ? formatSignedUsd(cheap.xDiff) : "—"} on-chain
              vs cash · {cheap.xSource ?? "Jupiter"} / {cheap.cashSource ?? "Yahoo"}
            </p>
            </div>
          </div>
          <p
            className={cn(
              "font-mono text-sm",
              (cheap.xPremium ?? 0) < 0 ? "text-gain" : "text-loss",
            )}
          >
            {cheap.xPremium != null ? formatPct(cheap.xPremium) : "—"}
          </p>
        </Panel>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-destructive/30 px-4 py-6 text-sm text-destructive">
          {error}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/80">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Yahoo cash</TableHead>
                <TableHead className="text-right">Jupiter tape</TableHead>
                <TableHead className="text-right">$ diff</TableHead>
                <TableHead className="text-right">Gap</TableHead>
                <TableHead className="text-right">Ondo</TableHead>
                <TableHead className="hidden text-right md:table-cell">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {basis.map((row) => (
                <TableRow
                  key={row.symbol}
                  className={cn(
                    "cursor-pointer",
                    (picked === row.symbol || cheap?.symbol === row.symbol) &&
                      "bg-muted/40",
                  )}
                  onClick={() => setPicked(row.symbol)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <TokenLogo symbol={row.symbol} image={row.image} />
                      <div>
                    <div className="font-medium">{row.name}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{row.symbol}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {row.cashPrice ? formatPrice(row.cashPrice) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {row.xPrice ? formatPrice(row.xPrice) : "—"}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono",
                      row.xDiff != null && row.xDiff < 0 && "text-gain",
                      row.xDiff != null && row.xDiff > 0 && "text-loss",
                    )}
                  >
                    {row.xDiff != null ? formatSignedUsd(row.xDiff) : "—"}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono",
                      row.xPremium != null && row.xPremium < 0 && "text-gain",
                      row.xPremium != null && row.xPremium > 0 && "text-loss",
                    )}
                  >
                    {row.xPremium != null ? formatPct(row.xPremium) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {row.onPrice ? formatPrice(row.onPrice) : "—"}
                    {row.onDiff != null ? (
                      <span className="ml-1 text-[11px] text-muted-foreground">
                        {formatSignedUsd(row.onDiff)}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="hidden text-right font-mono text-[11px] text-muted-foreground md:table-cell">
                    {row.xSource ?? "—"} / {row.cashSource ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {pickedRow ? (
        <p className="text-xs leading-5 text-muted-foreground">
          Evidence for {pickedRow.name}: Yahoo cash {pickedRow.cashPrice != null ? formatPrice(pickedRow.cashPrice) : "—"}
          {pickedRow.cashSource ? ` (${pickedRow.cashSource})` : ""}. On-chain xStock{" "}
          {pickedRow.xPrice != null ? formatPrice(pickedRow.xPrice) : "—"}
          {pickedRow.xSource ? ` (${pickedRow.xSource})` : ""}. Actual difference{" "}
          {pickedRow.xDiff != null ? formatSignedUsd(pickedRow.xDiff) : "—"} (
          {pickedRow.xPremium != null ? formatPct(pickedRow.xPremium) : "—"}). Negative
          means the Solana tape is cheaper than the listed cash print.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Yahoo is the cash print. Jupiter is the xStock tape. DexScreener fills
          only if Jupiter misses. Padre, GMGN, Axiom, and CMC are not used.
        </p>
      )}
    </div>
  );
}
