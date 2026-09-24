"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatPct, formatPrice } from "@/lib/format";
import type { TapeRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TickerTape({ rows }: { rows?: TapeRow[] }) {
  const [fetched, setFetched] = useState<TapeRow[]>([]);
  const live = rows?.length ? rows : fetched;

  useEffect(() => {
    if (rows?.length) return;
    let cancelled = false;

    async function load() {
      try {
        const [tapeRes, tesseraRes] = await Promise.all([
          fetch("/api/tape", { cache: "no-store" }),
          fetch("/api/tessera", { cache: "no-store" }),
        ]);
        const tape = (await tapeRes.json()) as { rows?: TapeRow[] };
        const tessera = (await tesseraRes.json()) as { rows?: TapeRow[] };
        if (cancelled) return;
        setFetched([...(tape.rows ?? []), ...(tessera.rows ?? [])]);
      } catch {
        /* keep last strip */
      }
    }

    load();
    const timer = window.setInterval(load, 12_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [rows]);

  const strip = useMemo(() => padStrip(live), [live]);
  const seconds = Math.max(28, strip.length * 2.4);

  if (!strip.length) {
    return <div className="h-9 border-t border-border/70" aria-hidden />;
  }

  return (
    <div
      className="relative overflow-hidden border-t border-border/70"
      aria-label="Live tape"
    >
      <div
        className="ticker-run flex w-max items-center py-2"
        style={{ ["--ticker-duration" as string]: `${seconds}s` }}
      >
        <Track rows={strip} />
        <Track rows={strip} hidden />
      </div>
    </div>
  );
}

function Track({ rows, hidden }: { rows: TapeRow[]; hidden?: boolean }) {
  return (
    <ul
      className="flex items-center"
      aria-hidden={hidden || undefined}
    >
      {rows.map((row, index) => (
        <li key={`${row.mint}-${index}`}>
          <Link
            href={`/token/${row.symbol.toLowerCase()}`}
            className="mx-4 inline-flex items-baseline gap-2 font-mono text-[13px] tracking-tight whitespace-nowrap"
          >
            <span className="font-medium text-foreground">{row.symbol}</span>
            <span className="text-muted-foreground">{formatPrice(row.execPrice)}</span>
            <span
              className={cn(
                row.premium < 0 ? "text-gain" : row.premium > 0 ? "text-loss" : "text-muted-foreground",
              )}
            >
              {formatPct(row.premium)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function padStrip(rows: TapeRow[]) {
  if (!rows.length) return [];
  const copies = Math.max(2, Math.ceil(16 / rows.length));
  return Array.from({ length: copies }, () => rows).flat();
}
