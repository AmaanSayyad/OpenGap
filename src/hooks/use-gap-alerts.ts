"use client";

import { useEffect, useState } from "react";
import type { TapeRow } from "@/lib/types";

const KEY = "opengap.gap-alerts.v1";
export const GAP_ALERT_IMPROVE = 0.002;

export type GapAlert = {
  symbol: string;
  maxPremium: number;
};

function load(): GapAlert[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GapAlert[]) : [];
  } catch {
    return [];
  }
}

export function useGapAlerts() {
  const [alerts, setAlerts] = useState<GapAlert[]>([]);

  useEffect(() => {
    setAlerts(load());
  }, []);

  function persist(next: GapAlert[]) {
    setAlerts(next);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  }

  function has(symbol: string) {
    return alerts.some((alert) => alert.symbol === symbol);
  }

  function toggle(row: TapeRow) {
    persist(
      has(row.symbol)
        ? alerts.filter((alert) => alert.symbol !== row.symbol)
        : [...alerts, { symbol: row.symbol, maxPremium: row.premium }],
    );
  }

  function update(symbol: string, maxPremium: number) {
    persist(
      alerts.map((alert) =>
        alert.symbol === symbol ? { ...alert, maxPremium } : alert,
      ),
    );
  }

  return { alerts, has, toggle, update };
}
