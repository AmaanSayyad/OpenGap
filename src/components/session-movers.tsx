import { TokenLogo } from "@/components/token-logo";
import { formatPct } from "@/lib/format";
import type { TapeRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SessionMovers({
  rows,
  series,
  onPick,
}: {
  rows: TapeRow[];
  series: Record<string, number[]>;
  onPick: (row: TapeRow) => void;
}) {
  const movers = rows
    .map((row) => {
      const path = series[row.symbol] ?? [];
      if (path.length < 2) return null;
      const first = path[0];
      const last = path[path.length - 1];
      if (!first) return null;
      return { row, delta: (last - first) / first };
    })
    .filter((item): item is { row: TapeRow; delta: number } => Boolean(item))
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 4);

  const slots = Array.from({ length: 4 }, (_, index) => movers[index] ?? null);

  return (
    <div className="flex h-full min-w-0 flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">
        Session tape · cheapest print vs first print
      </p>
      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
        {slots.map((item, index) =>
          item ? (
          <button
            key={item.row.mint}
            type="button"
            onClick={() => onPick(item.row)}
            className="flex min-h-[3.5rem] items-center justify-between gap-2 rounded-xl border border-border/80 px-3 py-2 text-left hover:bg-muted/40"
          >
            <span className="flex items-center gap-2">
              <TokenLogo symbol={item.row.symbol} image={item.row.image} size="sm" />
              <span className="text-sm font-medium">{item.row.symbol}</span>
            </span>
            <span
              className={cn(
                "font-mono text-xs tabular-nums",
                item.delta < 0 ? "text-gain" : "text-loss",
              )}
            >
              {formatPct(item.delta)}
            </span>
          </button>
          ) : (
            <div
              key={`empty-${index}`}
              className="flex min-h-[3.5rem] items-center rounded-xl border border-dashed border-border/70 px-3 py-2 text-xs text-muted-foreground"
            >
              Waiting for a second print…
            </div>
          ),
        )}
      </div>
    </div>
  );
}
