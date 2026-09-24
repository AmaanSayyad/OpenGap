import { TokenLogo } from "@/components/token-logo";
import { formatPct, formatPrice } from "@/lib/format";
import type { PrintTick } from "@/hooks/use-print-history";
import { cn } from "@/lib/utils";

export function PrintFeed({
  ticks,
  onPick,
}: {
  ticks: PrintTick[];
  onPick?: (symbol: string) => void;
}) {
  return (
    <div className="relative min-w-0">
      <p className="text-xs font-medium text-muted-foreground">Recent prints</p>
      {ticks.length ? (
        <div className="relative mt-2">
          <ol className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {ticks.map((tick, index) => (
              <li key={`${tick.symbol}-${tick.at}-${index}`}>
                <button
                  type="button"
                  onClick={() => onPick?.(tick.symbol)}
                  className="flex shrink-0 items-center gap-2 rounded-full border border-border/80 px-2.5 py-1 text-xs hover:border-foreground/30"
                >
                <TokenLogo symbol={tick.symbol} size="xs" />
                <span className="font-mono">{tick.symbol}</span>
                <span className="font-mono tabular-nums">{formatPrice(tick.price)}</span>
                <span
                  className={cn(
                    "font-mono tabular-nums",
                    tick.premium < 0 ? "text-gain" : "text-loss",
                  )}
                >
                  {formatPct(tick.premium)}
                </span>
                </button>
              </li>
            ))}
          </ol>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background" />
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">Waiting for the first print…</p>
      )}
    </div>
  );
}
