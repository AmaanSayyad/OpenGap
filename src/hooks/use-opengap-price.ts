"use client";

import { useEffect, useState } from "react";

export function useOpenGapPrice() {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/opengap-price", { cache: "no-store" });
        const payload = (await response.json()) as { price?: number | null };
        const value = Number(payload.price);
        if (!cancelled) setPrice(Number.isFinite(value) && value > 0 ? value : null);
      } catch {
        if (!cancelled) setPrice(null);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return price;
}
