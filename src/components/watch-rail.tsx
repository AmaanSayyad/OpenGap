import { TokenLogo } from "@/components/token-logo";
import { Button } from "@/components/ui/button";
import { formatPct, formatPrice } from "@/lib/format";
import type { TapeRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export function WatchRail({
  rows,
  onBuy,
  onClear,
}: {
  rows: TapeRow[];
  onBuy: (row: TapeRow) => void;
  onClear: (symbol: string) => void;
}) {
  if (!rows.length) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">
        Watchlist · toast when a name prints
      </p>
      <ol className="flex gap-2 overflow-x-auto pb-1">
        {rows.map((row) => (
          <li
            key={row.mint}
            className="flex shrink-0 items-center gap-2 rounded-2xl border border-border/80 px-2.5 py-2"
          >
            <TokenLogo symbol={row.symbol} image={row.image} size="sm" />
            <div>
              <p className="text-xs font-medium">{row.symbol}</p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {formatPrice(row.execPrice)}
              </p>
            </div>
            <span
              className={cn(
                "font-mono text-xs",
                row.premium < 0 ? "text-gain" : "text-loss",
              )}
            >
              {formatPct(row.premium)}
            </span>
            <Button size="xs" variant="outline" onClick={() => onBuy(row)}>
              Buy
            </Button>
            <button
              type="button"
              onClick={() => onClear(row.symbol)}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
