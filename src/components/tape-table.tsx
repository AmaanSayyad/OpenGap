"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { TokenLogo } from "@/components/token-logo";
import { TvMiniChart } from "@/components/tv-mini-chart";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPct, formatPrice, formatUsd } from "@/lib/format";
import type { TapeRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export type TapeSort = "gap" | "tape" | "name" | "implied";

export function TapeTable({
  rows,
  watched,
  onWatch,
  onBuy,
  onCompare,
  compared,
  onAlert,
  alerted,
  series,
  sort,
  onSort,
  flash,
}: {
  rows: TapeRow[];
  watched: (symbol: string) => boolean;
  onWatch: (symbol: string) => void;
  onBuy: (row: TapeRow) => void;
  onCompare?: (row: TapeRow) => void;
  compared?: string[];
  onAlert?: (row: TapeRow) => void;
  alerted?: (symbol: string) => boolean;
  series?: Record<string, number[]>;
  sort?: TapeSort;
  onSort?: (sort: TapeSort) => void;
  flash?: Record<string, number>;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 px-4 py-12 text-center text-sm text-muted-foreground">
        Nothing in this filter. Switch to All or Discount.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/80">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10" />
            <TableHead>
              <SortLabel active={sort === "name"} onClick={() => onSort?.("name")}>
                Name
              </SortLabel>
            </TableHead>
            <TableHead className="hidden w-[11.5rem] sm:table-cell">Print</TableHead>
            <TableHead
              className="text-right"
              title="Live Jupiter price — what you actually pay"
            >
              <SortLabel active={sort === "tape"} onClick={() => onSort?.("tape")}>
                Tape
              </SortLabel>
            </TableHead>
            <TableHead
              className="text-right"
              title="Issuer reference. Not a quote you can lift."
            >
              Mark
            </TableHead>
            <TableHead
              className="text-right"
              title="Green means tape is cheaper than mark. That gap is the trade."
            >
              <SortLabel active={sort === "gap"} onClick={() => onSort?.("gap")}>
                Gap
              </SortLabel>
            </TableHead>
            <TableHead className="hidden text-right md:table-cell">
              <SortLabel active={sort === "implied"} onClick={() => onSort?.("implied")}>
                Implied
              </SortLabel>
            </TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.mint}
              className={cn(
                "hover:bg-muted/40",
                flash?.[row.symbol] != null && flash[row.symbol] < 0 && "tape-flash-gain",
                flash?.[row.symbol] != null && flash[row.symbol] >= 0 && "tape-flash-loss",
              )}
            >
              <TableCell className="pr-0">
                <button
                  type="button"
                  onClick={() => onWatch(row.symbol)}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={`Watch ${row.symbol}`}
                >
                  <Star
                    className={cn(
                      "size-3.5",
                      watched(row.symbol) && "fill-foreground text-foreground",
                    )}
                  />
                </button>
              </TableCell>
              <TableCell>
                <Link href={`/token/${row.symbol.toLowerCase()}`} className="flex items-center gap-3">
                  <TokenLogo symbol={row.symbol} image={row.image} />
                  <div>
                    <div className="font-medium tracking-tight">{row.name}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="font-mono">{row.symbol}</span>
                      {row.issuer === "tessera" ? (
                        <span className="rounded-full bg-muted px-1.5 py-0.5">T-token</span>
                      ) : null}
                      {row.sector ? <span>{row.sector}</span> : null}
                      {row.multiplier !== 1 ? (
                        <span className="font-mono">{row.multiplier.toFixed(3)}×</span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <TvMiniChart
                  symbol={row.symbol}
                  mint={row.mint}
                  values={series?.[row.symbol] ?? [row.execPrice]}
                />
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatPrice(row.execPrice)}
              </TableCell>
              <TableCell className="text-right font-mono text-muted-foreground">
                {formatPrice(row.markPrice)}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-mono",
                  row.premium < 0 ? "text-gain" : "text-loss",
                )}
              >
                {formatPct(row.premium)}
              </TableCell>
              <TableCell className="hidden text-right font-mono md:table-cell">
                {formatUsd(row.impliedValuation)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1.5">
                  {onCompare ? (
                    <Button
                      size="xs"
                      variant={compared?.includes(row.symbol) ? "default" : "ghost"}
                      onClick={() => onCompare(row)}
                    >
                      vs
                    </Button>
                  ) : null}
                  {onAlert ? (
                    <Button
                      size="xs"
                      variant={alerted?.(row.symbol) ? "default" : "ghost"}
                      onClick={() => onAlert(row)}
                    >
                      Alert
                    </Button>
                  ) : null}
                  <Button size="xs" variant="outline" onClick={() => onBuy(row)}>
                    Trade
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SortLabel({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: string;
}) {
  if (!onClick) return <span>{children}</span>;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}
