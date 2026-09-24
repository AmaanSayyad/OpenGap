"use client";

import { useCallback, useEffect, useState } from "react";

export type LastFill = {
  side: "buy" | "sell";
  symbol: string;
  name: string;
  image?: string | null;
  signature: string;
  tokens: number;
  paidLabel: string;
  paidUsd: number;
  pay?: "sol" | "usdc";
  wallet?: string;
  fillPrice: number;
  markPrice: number;
  at: number;
};

const LAST_KEY = "opengap.last-fill.v1";
const HISTORY_KEY = "opengap.fills.v1";
const MAX_FILLS = 80;

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function normalize(fill: LastFill): LastFill {
  return {
    ...fill,
    paidUsd:
      Number.isFinite(fill.paidUsd) && fill.paidUsd > 0
        ? fill.paidUsd
        : fill.tokens * fill.fillPrice,
  };
}

function loadHistory(): LastFill[] {
  const stored = readJson<LastFill[]>(HISTORY_KEY);
  if (Array.isArray(stored) && stored.length > 0) {
    return stored.map(normalize);
  }
  const last = readJson<LastFill>(LAST_KEY);
  return last ? [normalize(last)] : [];
}

export function useLastFill() {
  const [fills, setFills] = useState<LastFill[]>([]);

  useEffect(() => {
    setFills(loadHistory());
  }, []);

  const save = useCallback((next: LastFill) => {
    const fill = normalize(next);
    setFills((current) => {
      const history = [fill, ...current.filter((row) => row.signature !== fill.signature)].slice(
        0,
        MAX_FILLS,
      );
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        localStorage.setItem(LAST_KEY, JSON.stringify(fill));
      } catch {
        /* ignore quota */
      }
      return history;
    });
  }, []);

  return { fill: fills[0] ?? null, fills, save };
}
