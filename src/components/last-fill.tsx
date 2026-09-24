"use client";

import { TokenLogo } from "@/components/token-logo";
import { Eyebrow, Panel } from "@/components/ui-kit";
import { formatPct, formatPrice, shortAddress } from "@/lib/format";
import type { LastFill } from "@/hooks/use-last-fill";
import { cn } from "@/lib/utils";

export function LastFillCard({ fill }: { fill: LastFill }) {
  const vsMark = fill.markPrice
    ? (fill.fillPrice - fill.markPrice) / fill.markPrice
    : null;

  return (
    <Panel className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <TokenLogo symbol={fill.symbol} image={fill.image} size="lg" className="mt-0.5" />
        <div>
          <Eyebrow>Last fill</Eyebrow>
          <p className="mt-1 text-sm font-medium">
            {fill.side === "buy" ? "Bought" : "Sold"} {fill.tokens.toFixed(5)}{" "}
            {fill.symbol} for {fill.paidLabel}
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            Fill {formatPrice(fill.fillPrice)} vs mark {formatPrice(fill.markPrice)}
            {vsMark != null ? (
              <span className={cn("ml-1", vsMark < 0 ? "text-gain" : "text-loss")}>
                ({formatPct(vsMark)} to mark)
              </span>
            ) : null}
          </p>
        </div>
      </div>
      <a
        href={`https://solscan.io/tx/${fill.signature}`}
        target="_blank"
        rel="noreferrer"
        className="text-xs underline underline-offset-4"
      >
        {shortAddress(fill.signature, 6)}
      </a>
    </Panel>
  );
}
