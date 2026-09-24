"use client";

import Link from "next/link";
import { TokenLogo } from "@/components/token-logo";
import { formatPct, formatPrice, formatUsd } from "@/lib/format";
import type { TapeRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ResearchGrid({ rows }: { rows: TapeRow[] }) {
  return (
    <section className="grid gap-5 sm:grid-cols-2">
      {rows.map((row) => (
        <Link
          key={row.mint}
          href={`/token/${row.symbol.toLowerCase()}`}
          className="rounded-2xl border border-border/80 bg-card/40 p-6 transition-colors hover:bg-muted/50"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <TokenLogo symbol={row.symbol} image={row.image} />
              <div>
              <div className="text-lg font-semibold tracking-tight">{row.name}</div>
              <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                {row.symbol}
              </div>
              </div>
            </div>
            <div
              className={cn(
                "font-mono text-sm",
                row.premium < 0 ? "text-gain" : "text-loss",
              )}
            >
              {formatPct(row.premium)}
            </div>
          </div>
          <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
            {row.description.split("\n")[0]}
          </p>
          <div className="mt-4 text-xs text-muted-foreground">
            Tape {formatPrice(row.execPrice)} · mark {formatPrice(row.markPrice)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Implied {formatUsd(row.impliedValuation)} · mark{" "}
            {formatUsd(row.markValuation)}
          </div>
        </Link>
      ))}
    </section>
  );
}
