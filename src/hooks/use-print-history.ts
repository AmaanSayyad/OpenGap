"use client";

import { useEffect, useRef, useState } from "react";
import { HIDDEN_SYMBOLS } from "@/lib/constants";
import type { TapeRow } from "@/lib/types";

const KEY = "opengap.prints.v1";
const MAX = 96;

export type PrintTick = {
  symbol: string;
  price: number;
  premium: number;
  at: number;
};

function load(): Record<string, number[]> {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number[]>;
    return Object.fromEntries(
      Object.entries(parsed).filter(([symbol]) => !HIDDEN_SYMBOLS.has(symbol.toUpperCase())),
    );
  } catch {
    return {};
  }
}

export function usePrintHistory(rows: TapeRow[] | undefined) {
  const [series, setSeries] = useState<Record<string, number[]>>({});
  const [ticks, setTicks] = useState<PrintTick[]>([]);
  const primed = useRef(false);

  useEffect(() => {
    setSeries(load());
  }, []);

  useEffect(() => {
    if (!rows?.length) return;

    setSeries((previous) => {
      let changed = false;
      const next = { ...previous };
      const fresh: PrintTick[] = [];
      for (const row of rows) {
        if (!Number.isFinite(row.execPrice) || row.execPrice <= 0) continue;
        const path = next[row.symbol] ?? [];
        const last = path[path.length - 1];
        if (last == null) {
          next[row.symbol] = [row.execPrice];
          changed = true;
          continue;
        }
        if (Math.abs(last - row.execPrice) / last >= 0.0003) {
          next[row.symbol] = [...path, row.execPrice].slice(-MAX);
          if (!fresh.some((tick) => tick.symbol === row.symbol)) {
            fresh.push({
              symbol: row.symbol,
              price: row.execPrice,
              premium: row.premium,
              at: Date.now(),
            });
          }
          changed = true;
        }
      }
      if (!primed.current) {
        primed.current = true;
        if (!changed) return previous;
        window.localStorage.setItem(KEY, JSON.stringify(next));
        return next;
      }
      if (!changed) return previous;
      window.localStorage.setItem(KEY, JSON.stringify(next));
      if (fresh.length) {
        setTicks((current) => {
          const merged = [...fresh, ...current];
          const seen = new Set<string>();
          return merged
            .filter((tick) => {
              if (!Number.isFinite(tick.price)) return false;
              const key = `${tick.symbol}:${tick.price.toFixed(4)}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            })
            .slice(0, 16);
        });
      }
      return next;
    });
  }, [rows]);

  return { series, ticks };
}
