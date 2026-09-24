"use client";

import { useEffect, useState } from "react";

const KEY = "opengap.watchlist";

export function useWatchlist() {
  const [symbols, setSymbols] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setSymbols(JSON.parse(raw) as string[]);
    } catch {
      setSymbols([]);
    }
  }, []);

  function persist(next: string[]) {
    setSymbols(next);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  }

  function toggle(symbol: string) {
    persist(
      symbols.includes(symbol)
        ? symbols.filter((item) => item !== symbol)
        : [...symbols, symbol],
    );
  }

  return { symbols, toggle, has: (symbol: string) => symbols.includes(symbol) };
}
