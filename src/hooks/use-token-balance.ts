"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";

const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const TOKEN_2022 = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const ASSOCIATED = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

function parsedUi(data: unknown) {
  if (!data || typeof data !== "object" || !("parsed" in data)) return 0;
  const amount = Number(
    (data.parsed as { info?: { tokenAmount?: { uiAmount?: number } } })?.info
      ?.tokenAmount?.uiAmount,
  );
  return Number.isFinite(amount) ? amount : 0;
}

export function useTokenBalance(mint: string | null, enabled: boolean) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [uiAmount, setUiAmount] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled || !publicKey || !mint) {
      setUiAmount(null);
      return;
    }

    let cancelled = false;
    const owner = publicKey;
    const mintKey = new PublicKey(mint);

    async function load() {
      try {
        const info = await connection.getAccountInfo(mintKey, "confirmed");
        const program = info?.owner.equals(TOKEN_2022) ? TOKEN_2022 : TOKEN_PROGRAM;
        const ata = PublicKey.findProgramAddressSync(
          [owner.toBuffer(), program.toBuffer(), mintKey.toBuffer()],
          ASSOCIATED,
        )[0];
        const parsed = await connection.getParsedAccountInfo(ata, "confirmed");
        if (!cancelled) setUiAmount(parsedUi(parsed.value?.data));
      } catch {
        if (!cancelled) setUiAmount(null);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [connection, enabled, mint, publicKey]);

  return uiAmount;
}

export function formatTokenAmount(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value >= 1) return value.toFixed(4);
  if (value >= 0.01) return value.toFixed(5);
  return value.toFixed(8).replace(/\.?0+$/, "");
}
