"use client";

import { useEffect, useRef, useState } from "react";
import { diffTape, type TapeMove } from "@/components/tape-pulse";
import type { TapeResponse, TapeRow } from "@/lib/types";

export const TAPE_POLL_MS = 12_000;

export function useTapeFeed(initial?: TapeResponse) {
  const [tape, setTape] = useState<TapeResponse | null>(initial ?? null);
  const [tessera, setTessera] = useState<TapeRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [left, setLeft] = useState(TAPE_POLL_MS / 1000);
  const [moves, setMoves] = useState<TapeMove[]>([]);
  const [flash, setFlash] = useState<Record<string, number>>({});
  const [fetchedAt, setFetchedAt] = useState(() => Date.now());
  const tapeRef = useRef(tape);
  const prevRef = useRef<TapeRow[] | null>(initial?.rows ?? null);
  tapeRef.current = tape;

  useEffect(() => {
    let cancelled = false;
    let flashTimer = 0;

    async function loadTape() {
      try {
        const response = await fetch("/api/tape", { cache: "no-store" });
        const payload = (await response.json()) as TapeResponse & { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Tape failed");
        if (cancelled) return;
        const nextMoves = diffTape(prevRef.current, payload.rows);
        prevRef.current = payload.rows;
        setTape(payload);
        setMoves(nextMoves);
        setFetchedAt(Date.now());
        if (nextMoves.length) {
          const map: Record<string, number> = {};
          for (const move of nextMoves) map[move.symbol] = move.delta;
          setFlash(map);
          window.clearTimeout(flashTimer);
          flashTimer = window.setTimeout(() => setFlash({}), 1800);
        }
        setError(null);
      } catch (next) {
        if (!cancelled && !tapeRef.current) {
          setError(next instanceof Error ? next.message : "Tape failed");
        }
      }
    }

    async function loadTessera() {
      try {
        const response = await fetch("/api/tessera", { cache: "no-store" });
        const payload = (await response.json()) as { rows?: TapeRow[] };
        if (!cancelled) setTessera(payload.rows ?? []);
      } catch {
        /* keep last tessera print */
      }
    }

    if (!initial) loadTape();
    loadTessera();
    const timer = window.setInterval(() => {
      loadTape();
      loadTessera();
    }, TAPE_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.clearTimeout(flashTimer);
    };
  }, [initial]);

  useEffect(() => {
    function tick() {
      setLeft(Math.max(0, Math.ceil((TAPE_POLL_MS - (Date.now() - fetchedAt)) / 1000)));
    }
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [fetchedAt]);

  return { tape, tessera, error, left, moves, flash };
}
