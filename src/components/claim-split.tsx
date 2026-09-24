import { TokenLogo } from "@/components/token-logo";
import { formatPct, formatPrice, formatSignedUsd } from "@/lib/format";
import type { TapeRow } from "@/lib/types";
import { cn } from "@/lib/utils";

const PAIRS = [
  { label: "OpenAI", pre: "OPENAI", tess: "T-OpenAI" },
  { label: "SpaceX", pre: "SPACEX", tess: "T-SpaceX" },
  { label: "Kalshi", pre: "KALSHI", tess: "T-Kalshi" },
] as const;

export function ClaimSplit({
  prestocks,
  tessera,
  onBuy,
}: {
  prestocks: TapeRow[];
  tessera: TapeRow[];
  onBuy: (row: TapeRow) => void;
}) {
  const pairs = PAIRS.map((pair) => ({
    ...pair,
    preRow: prestocks.find((row) => row.symbol.toUpperCase() === pair.pre),
    tessRow: tessera.find((row) => row.symbol === pair.tess),
  })).filter((pair) => pair.preRow || pair.tessRow);

  if (!pairs.length) return null;

  return (
    <div className="grid gap-4">
      {pairs.map((pair) => (
        <div key={pair.label} className="rounded-2xl border border-border/80 p-5">
          <p className="text-xs font-medium text-muted-foreground">
            Same company · two claims
          </p>
          <div className="mt-1 flex items-center gap-2">
            <TokenLogo symbol={pair.pre} size="sm" />
            <p className="text-lg font-semibold tracking-tight">{pair.label}</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Claim
              title="PreStock"
              hint="Economic exposure"
              row={pair.preRow ?? null}
              onBuy={onBuy}
            />
            <Claim
              title="Tessera T-token"
              hint="Loan, not equity"
              row={pair.tessRow ?? null}
              onBuy={onBuy}
            />
          </div>
          <Evidence left={pair.preRow ?? null} right={pair.tessRow ?? null} />
        </div>
      ))}
    </div>
  );
}

function Claim({
  title,
  hint,
  row,
  onBuy,
}: {
  title: string;
  hint: string;
  row: TapeRow | null;
  onBuy: (row: TapeRow) => void;
}) {
  return (
    <button
      type="button"
      disabled={!row}
      onClick={() => row && onBuy(row)}
      className="rounded-xl border border-border/70 px-3 py-3 text-left transition-colors hover:bg-muted/50 disabled:cursor-default disabled:opacity-50"
    >
      <p className="text-xs text-muted-foreground">
        {title} · {hint}
      </p>
      <p className="mt-1 flex items-center gap-2 font-medium">
        {row ? <TokenLogo symbol={row.symbol} image={row.image} size="sm" /> : null}
        {row?.symbol ?? "—"}
      </p>
      <p className="mt-2 font-mono text-sm">
        {row ? `${formatPrice(row.execPrice)} tape` : "—"}
      </p>
      {row ? (
        <p className="font-mono text-[11px] text-muted-foreground">
          mark {formatPrice(row.markPrice)} · {formatSignedUsd(row.execPrice - row.markPrice)}
        </p>
      ) : null}
      <p
        className={cn(
          "mt-1 font-mono text-xs",
          row && row.premium < 0 ? "text-gain" : "text-loss",
        )}
      >
        {row ? `${formatPct(row.premium)} to mark` : "Not listed"}
      </p>
      {row?.holders != null ? (
        <p className="mt-1 text-xs text-muted-foreground">
          {row.holders.toLocaleString()} holders
          {row.sector ? ` · ${row.sector}` : ""}
        </p>
      ) : null}
    </button>
  );
}

function Evidence({ left, right }: { left: TapeRow | null; right: TapeRow | null }) {
  if (!left || !right) return null;
  const tapeDiff = left.execPrice - right.execPrice;
  return (
    <p className="mt-3 text-xs leading-5 text-muted-foreground">
      Evidence: Jupiter tape {left.symbol} {formatPrice(left.execPrice)} vs {right.symbol}{" "}
      {formatPrice(right.execPrice)} · {formatSignedUsd(tapeDiff)} apart. These are
      different claims (equity-like vs loan), not one arb. {left.symbol} is{" "}
      {formatSignedUsd(left.execPrice - left.markPrice)} vs PreStocks mark. {right.symbol}{" "}
      is {formatSignedUsd(right.execPrice - right.markPrice)} vs Tessera mark.
    </p>
  );
}
