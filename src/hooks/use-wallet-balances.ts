"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { USDC_MINT } from "@/lib/constants";

const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

function usdcAta(owner: PublicKey) {
  const [ata] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM.toBuffer(), new PublicKey(USDC_MINT).toBuffer()],
    ASSOCIATED,
  );
  return ata;
}

export function useWalletBalances(enabled: boolean) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [sol, setSol] = useState<number | null>(null);
  const [usdc, setUsdc] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled || !publicKey) {
      setSol(null);
      setUsdc(null);
      return;
    }

    let cancelled = false;
    async function load() {
      if (!publicKey) return;
      try {
        const [lamports, ata] = await Promise.all([
          connection.getBalance(publicKey, "confirmed"),
          connection.getParsedAccountInfo(usdcAta(publicKey), "confirmed"),
        ]);
        if (cancelled) return;
        setSol(lamports / 1e9);
        const parsed = ata.value?.data;
        if (parsed && typeof parsed === "object" && "parsed" in parsed) {
          const amount = Number(
            (parsed.parsed as { info?: { tokenAmount?: { uiAmount?: number } } })
              .info?.tokenAmount?.uiAmount,
          );
          setUsdc(Number.isFinite(amount) ? amount : 0);
        } else {
          setUsdc(0);
        }
      } catch {
        if (!cancelled) {
          setSol(null);
          setUsdc(null);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [connection, enabled, publicKey]);

  return { sol, usdc };
}
