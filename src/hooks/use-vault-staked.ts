"use client";

import { useCallback, useEffect, useState } from "react";

export function useVaultStaked(initial: number | null = null) {
  const [amount, setAmount] = useState<number | null>(initial);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/stakes/total", { cache: "no-store" });
      const payload = (await response.json()) as { amount?: number | null };
      const value = Number(payload.amount);
      setAmount(Number.isFinite(value) && value >= 0 ? value : null);
    } catch {
      setAmount(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  return { amount, refresh };
}
