import { TokenLogo } from "@/components/token-logo";
import { Button } from "@/components/ui/button";
import { formatPct, formatPrice, formatSignedUsd } from "@/lib/format";
import type { TapeRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CompareStrip({
  rows,
  onBuy,
  onClear,
}: {
  rows: TapeRow[];
  onBuy: (row: TapeRow) => void;
  onClear: () => void;
}) {
  if (rows.length < 2) return null;
  const [left, right] = rows;
  const cheaper = left.premium <= right.premium ? left : right;

  return (
    <div className="rounded-2xl border border-border/80 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">Compare</p>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Clear
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Side row={left} cheaper={cheaper.mint === left.mint} onBuy={onBuy} />
        <Side row={right} cheaper={cheaper.mint === right.mint} onBuy={onBuy} />
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        Evidence: Jupiter {left.symbol} {formatPrice(left.execPrice)} vs {right.symbol}{" "}
        {formatPrice(right.execPrice)} · tapes {formatSignedUsd(left.execPrice - right.execPrice)}{" "}
        apart. {left.symbol} is {formatSignedUsd(left.execPrice - left.markPrice)} vs its
        mark {formatPrice(left.markPrice)}. {right.symbol} is{" "}
        {formatSignedUsd(right.execPrice - right.markPrice)} vs its mark{" "}
        {formatPrice(right.markPrice)}. {cheaper.symbol} is closer to a discount.
      </p>
    </div>
  );
}

function Side({
  row,
  cheaper,
  onBuy,
}: {
  row: TapeRow;
  cheaper: boolean;
  onBuy: (row: TapeRow) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-3">
      <div className="flex items-center gap-2">
        <TokenLogo symbol={row.symbol} image={row.image} />
        <div>
          <p className="text-sm font-medium">{row.symbol}</p>
          <p className="font-mono text-xs text-muted-foreground">
            {formatPrice(row.execPrice)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={cn("font-mono text-sm", row.premium < 0 ? "text-gain" : "text-loss")}>
          {formatPct(row.premium)}
        </p>
        {cheaper ? (
          <Button size="xs" className="mt-2" onClick={() => onBuy(row)}>
            Buy cheaper
          </Button>
        ) : (
          <Button size="xs" variant="outline" className="mt-2" onClick={() => onBuy(row)}>
            Buy
          </Button>
        )}
      </div>
    </div>
  );
}
