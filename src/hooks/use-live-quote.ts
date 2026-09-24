"use client";

import { useEffect, useState } from "react";
import { requestQuote } from "@/lib/swap";
import { parseRoute, type RouteHop } from "@/lib/routes";
import type { JupiterQuote } from "@/lib/jupiter";

const REFRESH_MS = 12_000;

export function useLiveQuote(
  inputMint: string,
  outputMint: string | null,
  amount: number,
  enabled: boolean,
) {
  const [quote, setQuote] = useState<JupiterQuote | null>(null);
  const [hops, setHops] = useState<RouteHop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [at, setAt] = useState<number | null>(null);
  const [left, setLeft] = useState(REFRESH_MS / 1000);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    setQuote(null);
    setHops([]);
    setError(null);

    if (!enabled || !outputMint || amount <= 0) {
      return;
    }

    const mint = outputMint;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const next = await requestQuote(inputMint, mint, amount);
        if (cancelled) return;
        setQuote(next);
        setHops(parseRoute(next));
        setError(null);
        setAt(Date.now());
      } catch (next) {
        if (!cancelled) {
          setError(next instanceof Error ? next.message : "Quote failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const timer = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [amount, enabled, inputMint, outputMint, retry]);

  useEffect(() => {
    if (!at) return;
    function tick() {
      setLeft(Math.max(0, Math.ceil((REFRESH_MS - (Date.now() - (at ?? 0))) / 1000)));
    }
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [at]);

  return {
    quote,
    hops,
    loading,
    error,
    left,
    refresh: () => setRetry((value) => value + 1),
  };
}
