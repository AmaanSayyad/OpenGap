"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { mergeStakes, stakeTotals, type StakeRecord } from "@/lib/staking";

const KEY = "opengap.stakes.v1";

function readAll(): StakeRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    const rows = raw ? (JSON.parse(raw) as StakeRecord[]) : [];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function writeAll(rows: StakeRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(rows.slice(0, 200)));
}

export function useStakes() {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? null;
  const [all, setAll] = useState<StakeRecord[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setAll(readAll());
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!wallet) return;
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch(`/api/stakes?wallet=${wallet}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as { stakes?: StakeRecord[] };
        if (cancelled || !Array.isArray(payload.stakes)) return;
        setAll((current) => {
          const rows = mergeStakes(current, payload.stakes ?? []);
          try {
            writeAll(rows);
          } catch {
            /* ignore quota */
          }
          return rows;
        });
      } catch {
        /* keep local */
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [wallet]);

  const stakes = useMemo(
    () => (wallet ? all.filter((row) => row.wallet === wallet) : []),
    [all, wallet],
  );
  const totals = useMemo(() => stakeTotals(stakes, now), [stakes, now]);

  const save = useCallback((next: StakeRecord) => {
    setAll((current) => {
      const rows = mergeStakes([next], current);
      try {
        writeAll(rows);
      } catch {
        /* ignore quota */
      }
      return rows;
    });
    void fetch("/api/stakes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(next),
    }).catch(() => undefined);
  }, []);

  return { wallet, stakes, totals, now, save };
}
