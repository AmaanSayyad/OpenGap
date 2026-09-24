"use client";

import { TokenLogo } from "@/components/token-logo";
import { formatPct } from "@/lib/format";
import type { TapeRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export type TapeMove = {
  symbol: string;
  delta: number;
};

export function TapePulse({
  moves,
  left,
  updatedAt,
}: {
  moves: TapeMove[];
  left: number;
  updatedAt: string | null;
}) {
  const shown = moves.slice(0, 4);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/40 px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-gain opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-gain" />
        </span>
        <span className="text-muted-foreground">
          Tape live · next print {left}s
          {updatedAt
            ? ` · ${new Date(updatedAt).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
                timeZone: "UTC",
              })} UTC`
            : ""}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {shown.length ? (
          shown.map((move) => (
            <span
              key={move.symbol}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 font-mono text-xs",
                move.delta < 0 ? "text-gain" : "text-loss",
              )}
            >
              <TokenLogo symbol={move.symbol} size="xs" />
              {move.symbol} {formatPct(move.delta)}
            </span>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">Waiting on the next print…</span>
        )}
      </div>
    </div>
  );
}

export function diffTape(previous: TapeRow[] | null, next: TapeRow[]): TapeMove[] {
  if (!previous?.length) return [];
  const last = new Map(previous.map((row) => [row.mint, row.execPrice]));
  return next
    .map((row) => {
      const before = last.get(row.mint);
      if (!before) return null;
      const delta = (row.execPrice - before) / before;
      if (Math.abs(delta) < 0.0005) return null;
      return { symbol: row.symbol, delta };
    })
    .filter((item): item is TapeMove => Boolean(item))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}
