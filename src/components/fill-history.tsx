"use client";

import { TokenLogo } from "@/components/token-logo";
import { Eyebrow, Panel } from "@/components/ui-kit";
import type { LastFill } from "@/hooks/use-last-fill";
import { formatPct, formatPrice, shortAddress } from "@/lib/format";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function FillHistory({
  fills,
  limit,
  variant = "rail",
}: {
  fills: LastFill[];
  limit?: number;
  variant?: "rail" | "page";
}) {
  const rows = limit ? fills.slice(0, limit) : fills;
  const page = variant === "page";

  return (
    <Panel className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Eyebrow>History</Eyebrow>
          <p className="mt-1 text-sm text-muted-foreground">
            {page
              ? "Every fill you signed in this browser."
              : "Fills from this browser. On-chain via Solscan."}
          </p>
        </div>
        {limit ? (
          <Link
            href="/portfolio"
            className="text-xs underline underline-offset-4 text-muted-foreground hover:text-foreground"
          >
            All trades
          </Link>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Buy or sell a name and the print stays here.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {rows.map((fill) => {
            const vsMark = fill.markPrice
              ? (fill.fillPrice - fill.markPrice) / fill.markPrice
              : null;
            return (
              <li
                key={fill.signature}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl px-1 py-2",
                  page && "px-2 hover:bg-muted/40",
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <TokenLogo
                    symbol={fill.symbol}
                    image={fill.image}
                    size={page ? "lg" : "md"}
                    framed={page}
                  />
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[11px] font-medium",
                          fill.side === "buy"
                            ? "bg-gain/15 text-gain"
                            : "bg-loss/15 text-loss",
                        )}
                      >
                        {fill.side === "buy" ? "Buy" : "Sell"}
                      </span>
                      <Link
                        href={`/token/${encodeURIComponent(fill.symbol)}`}
                        className="truncate hover:underline"
                      >
                        {fill.symbol}
                      </Link>
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {fill.tokens.toFixed(4)} · {fill.paidLabel} ·{" "}
                      {new Date(fill.at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-sm">{formatPrice(fill.fillPrice)}</p>
                  {vsMark != null ? (
                    <p
                      className={cn(
                        "font-mono text-xs",
                        vsMark < 0 ? "text-gain" : "text-loss",
                      )}
                    >
                      {formatPct(vsMark)} mark
                    </p>
                  ) : null}
                  <a
                    href={`https://solscan.io/tx/${fill.signature}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs underline underline-offset-4"
                  >
                    {shortAddress(fill.signature, 4)}
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
