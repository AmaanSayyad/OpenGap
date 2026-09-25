"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { TokenLogo } from "@/components/token-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DEFAULT_BASKET_USDC, USDC_DECIMALS, USDC_MINT } from "@/lib/constants";
import { formatPct, formatPrice } from "@/lib/format";
import { executeSwap, requestQuote } from "@/lib/swap";
import type { TapeResponse } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";

export function BasketSheet({
  tape,
  open,
  onOpenChange,
}: {
  tape: TapeResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { connection } = useConnection();
  const { publicKey, signTransaction, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [amount, setAmount] = useState(String(DEFAULT_BASKET_USDC));
  const [progress, setProgress] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);

  const rows = tape?.rows ?? [];
  const slice = Number(amount) / Math.max(rows.length, 1);

  async function buyBasket() {
    if (!tape || rows.length === 0) return;
    if (!connected || !publicKey || !signTransaction) {
      setVisible(true);
      return;
    }

    const perLeg = Math.round(slice * 10 ** USDC_DECIMALS);
    if (perLeg <= 0) {
      toast.error("Enter a larger amount");
      return;
    }

    setBuying(true);
    try {
      for (const [index, row] of rows.entries()) {
        setProgress(`${index + 1} / ${rows.length} · ${row.symbol}`);
        const quote = await requestQuote(USDC_MINT, row.mint, perLeg);
        await executeSwap({
          quote,
          publicKey: publicKey.toBase58(),
          signTransaction,
          connection,
        });
      }
      toast.success("Bought every name");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Basket failed");
    } finally {
      setBuying(false);
      setProgress(null);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-2xl font-semibold tracking-tight">
            Buy every name
          </SheetTitle>
          <SheetDescription>
            Split one USDC amount evenly across every live PreStock. Each name
            is its own Jupiter buy.
          </SheetDescription>
        </SheetHeader>

        <div className="sheet-body flex flex-col gap-6 px-4 py-2">
          <ol className="flex flex-wrap gap-1.5 text-xs">
            {["Gap", "Size", "Names", "Sign"].map((label, index) => (
              <li
                key={label}
                className="rounded-full bg-muted px-2.5 py-1 font-medium text-muted-foreground"
              >
                {index + 1} {label}
              </li>
            ))}
          </ol>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                Average gap
              </div>
              <div
                className={`mt-1 font-mono ${
                  (tape?.pre8.premium ?? 0) < 0 ? "text-gain" : "text-loss"
                }`}
              >
                {tape ? formatPct(tape.pre8.premium) : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                Per name
              </div>
              <div className="mt-1 font-mono">{formatPrice(slice || 0)}</div>
            </div>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Total USDC
            </span>
            <Input
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>

          <ol className="space-y-2 text-sm">
            {rows.map((row) => (
              <li key={row.mint} className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2">
                  <TokenLogo symbol={row.symbol} image={row.image} size="sm" />
                  {row.symbol}
                </span>
                <span
                  className={`font-mono ${
                    row.premium < 0 ? "text-gain" : "text-muted-foreground"
                  }`}
                >
                  {formatPct(row.premium)}
                </span>
              </li>
            ))}
          </ol>

        </div>
        <SheetFooter>
          <Button size="lg" disabled={buying || rows.length === 0} onClick={buyBasket}>
            {progress ?? (connected ? "Buy every name" : "Connect to buy")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
