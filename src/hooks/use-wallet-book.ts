"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import type { Holding } from "@/lib/holdings";
import { useEffect, useState } from "react";

export type WalletBook = {
  owner: string;
  sol: number;
  solPrice: number;
  solValue: number;
  usdc: number;
  positions: Holding[];
  updatedAt?: string;
};

export function useWalletBook(refresh = 0) {
  const { publicKey } = useWallet();
  const [book, setBook] = useState<WalletBook | null>(null);
  const [error, setError] = useState<string | null>(null);
  const owner = publicKey?.toBase58();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const query = owner ? `?owner=${owner}` : "";
        const response = await fetch(`/api/wallet/holdings${query}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as WalletBook & { error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Holdings failed");
        if (!cancelled) {
          setBook(payload);
          setError(null);
        }
      } catch (next) {
        if (!cancelled) {
          setError(next instanceof Error ? next.message : "Holdings failed");
        }
      }
    }
    void load();
    const timer = window.setInterval(load, 12_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [owner, refresh]);

  return { book, error, connectedOwner: owner };
}
