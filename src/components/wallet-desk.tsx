"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui-kit";
import { shortAddress } from "@/lib/format";
import { toast } from "sonner";

type WalletStatus = {
  publicKey: string;
  mainnetSol: number;
  devnetSol: number;
  mainnetUsdc: number;
};

export function WalletDesk() {
  const [status, setStatus] = useState<WalletStatus | null>(null);
  const [log, setLog] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/wallet/status", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (response.ok) setStatus(payload);
      })
      .catch(() => undefined);
  }, []);

  async function runTest(buy = false) {
    setBusy(true);
    try {
      const response = await fetch("/api/wallet/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ buy }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Wallet test failed");
      setStatus(payload.after ?? payload);
      setLog(JSON.stringify(payload, null, 2));
      toast.success(payload.buySig ? "Mainnet buy confirmed" : "Devnet memo confirmed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Wallet test failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="rounded-2xl border border-border/80 bg-card/40 px-5 py-4">
      <summary className="cursor-pointer text-sm font-medium">
        Developer tools
      </summary>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow>Server test wallet</Eyebrow>
          <div className="mt-2 font-mono text-sm">
            {status ? shortAddress(status.publicKey, 6) : "—"}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {status
              ? `devnet ${status.devnetSol.toFixed(3)} SOL · mainnet ${status.mainnetSol.toFixed(3)} SOL · ${status.mainnetUsdc.toFixed(2)} USDC`
              : "Balances load after open."}
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => runTest(false)} disabled={busy}>
            {busy ? "Signing…" : "Devnet memo"}
          </Button>
          <Button size="sm" onClick={() => runTest(true)} disabled={busy}>
            Buy 0.01 SOL tape
          </Button>
        </div>
      </div>
      {log ? (
        <pre className="mt-4 overflow-x-auto font-mono text-[11px] leading-5 text-muted-foreground">
          {log}
        </pre>
      ) : null}
    </details>
  );
}
