"use client";

import Link from "next/link";
import { TokenLogo } from "@/components/token-logo";
import { Eyebrow, Panel } from "@/components/ui-kit";
import { useWalletBook } from "@/hooks/use-wallet-book";
import { formatUsd, shortAddress } from "@/lib/format";

export function HoldingsBook({ refresh = 0 }: { refresh?: number }) {
  const { book, error, connectedOwner } = useWalletBook(refresh);
  const tokens = book?.positions.filter((row) => row.issuer !== "cash") ?? [];
  const solValue = book?.solValue ?? 0;
  const total =
    (book?.usdc ?? 0) + solValue + tokens.reduce((sum, row) => sum + row.tapeValue, 0);

  return (
    <Panel className="flex flex-col gap-4">
      <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:gap-3">
        <div>
          <Eyebrow>Portfolio</Eyebrow>
          <p className="mt-1 text-sm text-muted-foreground">
            {connectedOwner ? "Connected wallet" : "Test wallet"} ·{" "}
            {book ? shortAddress(book.owner, 4) : "…"}
          </p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            SOL, USDC, and any lots you hold, with live dollar values. Used to
            be called Book.
          </p>
        </div>
        <Link
          href="/portfolio"
          className="text-xs underline underline-offset-4 text-muted-foreground hover:text-foreground"
        >
          Full portfolio
        </Link>
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : !book ? (
        <p className="text-sm text-muted-foreground">Reading balances…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Cash
              symbol="SOL"
              label="SOL"
              value={book.solPrice ? formatUsd(book.solValue) : `${book.sol.toFixed(4)}`}
              hint={
                book.solPrice
                  ? `${book.sol.toFixed(4)} · ${formatUsd(book.solPrice)}`
                  : undefined
              }
            />
            <Cash symbol="USDC" label="USDC" value={formatUsd(book.usdc)} />
          </div>
          <p className="font-mono text-sm">
            {formatUsd(total)}
            <span className="ml-2 text-xs text-muted-foreground">tokens + cash</span>
          </p>
          {tokens.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tokenized names yet. A buy lands here until you sell.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {tokens.map((row) => (
                <li key={row.mint} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <TokenLogo symbol={row.symbol} image={row.image} size="md" framed />
                    <div>
                      <p className="text-sm font-medium">{row.symbol}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {row.uiAmount.toFixed(5)}
                      </p>
                    </div>
                  </div>
                  <p className="font-mono text-sm">{formatUsd(row.tapeValue)}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Panel>
  );
}

function Cash({
  symbol,
  label,
  value,
  hint,
}: {
  symbol: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/70 px-3 py-2">
      <TokenLogo symbol={symbol} size="md" framed className="rounded-xl p-1" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 font-mono text-sm">{value}</p>
        {hint ? <p className="font-mono text-[11px] text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}
