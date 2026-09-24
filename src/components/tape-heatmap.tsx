import { TokenLogo } from "@/components/token-logo";
import { formatPct } from "@/lib/format";
import type { TapeRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TapeHeatmap({
  rows,
  onPick,
}: {
  rows: TapeRow[];
  onPick: (row: TapeRow) => void;
}) {
  if (rows.length < 3) return null;

  const ranked = [...rows].sort((a, b) => a.premium - b.premium);

  return (
    <div className="flex h-full min-w-0 flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">
        Gap map · green is cheaper than the mark
      </p>
      <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
        {ranked.map((row) => (
          <button
            key={row.mint}
            type="button"
            onClick={() => onPick(row)}
            className={cn(
              "flex min-h-[3.5rem] flex-col items-start gap-1 rounded-xl border px-2.5 py-2 text-left transition-colors hover:border-foreground/30",
              row.premium < 0
                ? "border-gain/20 bg-gain/10"
                : "border-loss/20 bg-loss/10",
            )}
          >
            <span className="flex items-center gap-1.5">
              <TokenLogo symbol={row.symbol} image={row.image} size="xs" />
              <span className="truncate text-xs font-medium">{row.symbol}</span>
            </span>
            <span
              className={cn(
                "font-mono text-[11px]",
                row.premium < 0 ? "text-gain" : "text-loss",
              )}
            >
              {formatPct(row.premium)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
