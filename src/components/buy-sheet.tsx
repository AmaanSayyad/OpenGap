"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { RouteHops } from "@/components/route-hops";
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
import { Segmented } from "@/components/ui-kit";
import {
  DEFAULT_BUY_USDC,
  USDC_DECIMALS,
  USDC_MINT,
  WSOL_DECIMALS,
  WSOL_MINT,
} from "@/lib/constants";
import { formatPlatformFee, PLATFORM_FEE_LABEL } from "@/lib/fees";
import { formatPct, formatPrice } from "@/lib/format";
import { executeSwap } from "@/lib/swap";
import { useLastFill, type LastFill } from "@/hooks/use-last-fill";
import { useLiveQuote } from "@/hooks/use-live-quote";
import { formatTokenAmount, useTokenBalance } from "@/hooks/use-token-balance";
import { useWalletBalances } from "@/hooks/use-wallet-balances";
import type { TapeRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const USDC_PRESETS = [10, 25, 50, 100];
const SOL_PRESETS = [0.05, 0.1, 0.25, 0.5];
const SELL_FRACS = [0.25, 0.5, 0.75, 1];

export function BuySheet({
  row,
  open,
  onOpenChange,
  initialSide = "buy",
  onFill,
}: {
  row: TapeRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSide?: "buy" | "sell";
  onFill?: (fill: LastFill) => void;
}) {
  const { connection } = useConnection();
  const { publicKey, signTransaction, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [side, setSide] = useState<"buy" | "sell">(initialSide);
  const [pay, setPay] = useState<"usdc" | "sol">("usdc");
  const [amount, setAmount] = useState(String(DEFAULT_BUY_USDC));
  const [buying, setBuying] = useState(false);
  const [done, setDone] = useState<LastFill | null>(null);
  const lastFill = useLastFill();
  const cash = useWalletBalances(open && connected);
  const held = useTokenBalance(row?.mint ?? null, open && connected && side === "sell");
  const maxSell = held != null && held > 0 ? held * 0.995 : 0;

  useEffect(() => {
    setSide(initialSide);
    setPay("usdc");
    setBuying(false);
    setDone(null);
    setAmount(initialSide === "sell" ? "0" : String(DEFAULT_BUY_USDC));
  }, [initialSide, row?.mint]);

  useEffect(() => {
    if (side !== "sell" || held == null) return;
    setAmount(held > 0 ? formatTokenAmount(maxSell) : "0");
  }, [held, maxSell, side, row?.mint]);

  useEffect(() => {
    if (!open || side !== "buy" || pay !== "usdc") return;
    if (cash.usdc === 0 && cash.sol != null && cash.sol >= 0.05) {
      setPay("sol");
      setAmount("0.1");
    }
  }, [cash.sol, cash.usdc, open, pay, side]);

  const payMint = pay === "sol" ? WSOL_MINT : USDC_MINT;
  const payDecimals = pay === "sol" ? WSOL_DECIMALS : USDC_DECIMALS;

  const sellUi = useMemo(() => {
    if (held == null) return 0;
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return 0;
    if (maxSell > 0 && value > maxSell) return maxSell;
    return value;
  }, [amount, held, maxSell]);

  const rawIn = useMemo(() => {
    if (!row) return 0;
    if (side === "sell") {
      if (held == null || sellUi <= 0) return 0;
      return Math.round((sellUi / row.multiplier) * 10 ** row.decimals);
    }
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return 0;
    return Math.round(value * 10 ** payDecimals);
  }, [amount, held, payDecimals, row, sellUi, side]);

  const sellTooMuch =
    side === "sell" && held != null && (held <= 0 || Number(amount) > held * 1.001);

  const inputMint = side === "sell" ? row?.mint ?? "" : payMint;
  const outputMint = side === "sell" ? (pay === "sol" ? WSOL_MINT : USDC_MINT) : row?.mint ?? null;
  const live = useLiveQuote(inputMint, outputMint, rawIn, Boolean(row && open && rawIn));
  const quote = live.quote;

  const outLabel = useMemo(() => {
    if (!quote || !row) return null;
    if (side === "buy") {
      return `${((Number(quote.outAmount) / 10 ** row.decimals) * row.multiplier).toFixed(5)} ${row.symbol}`;
    }
    if (pay === "sol") {
      return `${(Number(quote.outAmount) / 10 ** WSOL_DECIMALS).toFixed(4)} SOL`;
    }
    return formatPrice(Number(quote.outAmount) / 10 ** USDC_DECIMALS);
  }, [pay, quote, row, side]);


  if (!row) return null;

  const walletHint =
    side === "sell"
      ? held == null
        ? "Reading token balance…"
        : held <= 0
          ? `No ${row.symbol} in this wallet.`
          : sellTooMuch
            ? `You only hold ${formatTokenAmount(held)} ${row.symbol}. Use Max.`
            : `Wallet ${formatTokenAmount(held)} ${row.symbol}`
      : cash.sol != null
        ? `Wallet ${cash.sol.toFixed(3)} SOL${
            cash.usdc != null ? ` · ${cash.usdc.toFixed(2)} USDC` : ""
          }${
            cash.sol < 0.01 && (cash.usdc ?? 0) < 1
              ? ". Empty — send SOL or USDC to this wallet to trade."
              : pay === "usdc" && (cash.usdc ?? 0) < Number(amount || 0)
                ? ". Not enough USDC — switch to SOL if you have some."
                : ""
          }`
        : null;

  function switchSide(next: "buy" | "sell") {
    setSide(next);
    if (next === "sell") {
      setAmount(held && held > 0 ? formatTokenAmount(held * 0.995) : "0");
      return;
    }
    setAmount(pay === "sol" ? "0.1" : String(DEFAULT_BUY_USDC));
  }

  function switchPay(next: "usdc" | "sol") {
    setPay(next);
    if (side === "buy") setAmount(next === "sol" ? "0.1" : String(DEFAULT_BUY_USDC));
  }

  async function submit() {
    if (!row || !quote) return;
    if (!connected || !publicKey || !signTransaction) {
      setVisible(true);
      return;
    }

    if (side === "sell" && (held == null || held <= 0)) {
      toast.error(`No ${row.symbol} in this wallet`);
      return;
    }
    if (side === "sell" && Number(amount) > (held ?? 0) * 1.001) {
      toast.error(`You only hold ${formatTokenAmount(held ?? 0)} ${row.symbol}`);
      return;
    }

    setBuying(true);
    try {
      const signature = await executeSwap({
        quote,
        publicKey: publicKey.toBase58(),
        signTransaction,
        connection,
      });
      const tokens =
        side === "buy"
          ? (Number(quote.outAmount) / 10 ** row.decimals) * row.multiplier
          : sellUi;
      const spend =
        side === "buy"
          ? pay === "usdc"
            ? Number(amount)
            : Number(quote.swapUsdValue || 0) || tokens * row.execPrice
          : Number(quote.outAmount) /
            10 ** (pay === "sol" ? WSOL_DECIMALS : USDC_DECIMALS);
      const fillPrice = tokens > 0 && spend > 0 ? spend / tokens : row.execPrice;
      const fill: LastFill = {
        side,
        symbol: row.symbol,
        name: row.name,
        image: row.image,
        signature,
        tokens,
        paidLabel:
          side === "buy"
            ? pay === "sol"
              ? `${amount} SOL`
              : formatPrice(Number(amount))
            : (outLabel ?? formatPrice(spend)),
        paidUsd: spend,
        pay,
        wallet: publicKey.toBase58(),
        fillPrice,
        markPrice: row.markPrice,
        at: Date.now(),
      };
      lastFill.save(fill);
      onFill?.(fill);
      setDone(fill);
      toast.success(side === "buy" ? `Bought ${row.symbol}` : `Sold ${row.symbol}`, {
        description: signature.slice(0, 16) + "…",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Swap failed");
    } finally {
      setBuying(false);
    }
  }

  async function share() {
    if (!row) return;
    const text = `${row.symbol} tape ${formatPrice(row.execPrice)} vs mark ${formatPrice(row.markPrice)} (${formatPct(row.premium)}). ${window.location.origin}/?buy=${row.symbol}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied share line");
    } catch {
      toast.error("Copy failed");
    }
  }

  const buyPresets = pay === "sol" ? SOL_PRESETS : USDC_PRESETS;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3 text-2xl font-semibold tracking-tight">
            <TokenLogo symbol={row.symbol} image={row.image} size="lg" />
            {row.name}
          </SheetTitle>
          <SheetDescription>
            Tape is what you pay on Jupiter right now. Mark is the issuer
            reference — not a quote you can lift. Green means cheaper.
          </SheetDescription>
        </SheetHeader>

        {done ? (
          <div className="sheet-body flex flex-col gap-5 px-4 py-2">
            <p className="text-sm">
              {done.side === "buy" ? "Bought" : "Sold"} {done.tokens.toFixed(5)}{" "}
              {done.symbol} for {done.paidLabel}.
            </p>
            <p className="font-mono text-sm">
              Fill {formatPrice(done.fillPrice)} vs mark {formatPrice(done.markPrice)}
              {done.markPrice ? (
                <span
                  className={
                    done.fillPrice < done.markPrice ? " text-gain" : " text-loss"
                  }
                >
                  {" "}
                  ({formatPct((done.fillPrice - done.markPrice) / done.markPrice)})
                </span>
              ) : null}
            </p>
            <a
              href={`https://solscan.io/tx/${done.signature}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm underline underline-offset-4"
            >
              View on Solscan
            </a>
          </div>
        ) : (
        <div className="sheet-body flex flex-col gap-6 px-4 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Segmented
              value={side}
              onChange={switchSide}
              options={[
                { id: "buy", label: "Buy" },
                { id: "sell", label: "Sell" },
              ]}
            />
            <button
              type="button"
              onClick={share}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Copy share
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <Metric label="Mark" value={formatPrice(row.markPrice)} />
            <Metric label="Tape" value={formatPrice(row.execPrice)} />
            <Metric
              label="To mark"
              value={formatPct(row.premium)}
              tone={row.premium < 0 ? "gain" : "loss"}
            />
            <Metric
              label={row.issuer === "tessera" ? "Holders" : "Split"}
              value={
                row.issuer === "tessera"
                  ? row.holders != null
                    ? String(row.holders)
                    : "—"
                  : `${row.multiplier.toFixed(row.multiplier === 1 ? 0 : 3)}×`
              }
            />
          </div>

          <a
            href={`/token/${row.symbol.toLowerCase()}`}
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Open full TradingView chart
          </a>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {side === "sell" ? `Amount in ${row.symbol}` : "You pay"}
              </span>
              {side === "buy" ? (
                <Segmented
                  value={pay}
                  onChange={switchPay}
                  options={[
                    { id: "usdc", label: "USDC" },
                    { id: "sol", label: "SOL" },
                  ]}
                />
              ) : (
                <Segmented
                  value={pay}
                  onChange={switchPay}
                  options={[
                    { id: "usdc", label: "to USDC" },
                    { id: "sol", label: "to SOL" },
                  ]}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {side === "sell"
                ? SELL_FRACS.map((frac) => (
                    <button
                      key={frac}
                      type="button"
                      disabled={!maxSell}
                      onClick={() => setAmount(formatTokenAmount(maxSell * frac))}
                      className={cn(
                        "h-7 rounded-full px-2.5 text-xs",
                        !maxSell && "opacity-40",
                        Math.abs(Number(amount) - maxSell * frac) < maxSell * 0.01
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {frac === 1 ? "Max" : `${frac * 100}%`}
                    </button>
                  ))
                : buyPresets.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAmount(String(value))}
                      className={cn(
                        "h-7 rounded-full px-2.5 text-xs",
                        Number(amount) === value
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {pay === "sol" ? `${value}◎` : `$${value}`}
                    </button>
                  ))}
            </div>
            <Input
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            {connected ? (
              <p
                className={cn(
                  "text-xs leading-5",
                  sellTooMuch || (side === "sell" && held === 0)
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {walletHint}
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-border/80 px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">You receive</span>
              <span className="font-mono">
                {live.loading && !outLabel ? "…" : (outLabel ?? "—")}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>{PLATFORM_FEE_LABEL}</span>
              <span className="font-mono">
                {quote ? formatPlatformFee(quote, row, side, pay) : "—"}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>Quote refreshes in {live.left}s</span>
              <button
                type="button"
                onClick={live.refresh}
                className="underline underline-offset-2 hover:text-foreground"
              >
                Retry
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Route</p>
            <RouteHops hops={live.hops} loading={live.loading} />
            {live.error ? (
              <p className="mt-2 text-xs text-destructive">{live.error}</p>
            ) : null}
          </div>

        </div>
        )}
        <SheetFooter>
          {done ? (
            <Button size="lg" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          ) : (
            <>
              <Button
                size="lg"
                disabled={buying || (connected && !quote) || sellTooMuch}
                onClick={() => {
                  if (!connected) setVisible(true);
                  else submit();
                }}
              >
                {buying
                  ? "Signing…"
                  : connected
                    ? `${side === "buy" ? "Buy" : "Sell"} ${row.symbol}`
                    : "Connect wallet"}
              </Button>
              <p className="text-xs leading-5 text-muted-foreground">
                {row.issuer === "tessera"
                  ? "Tessera T-tokens are loan participation, not equity."
                  : "PreStocks are economic exposure only."}{" "}
                OpenGap takes 1% on every Jupiter buy and sell. Not available to
                US persons. Not advice.
              </p>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "gain" | "loss";
}) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div
        className={
          tone === "gain"
            ? "mt-1 font-mono text-gain"
            : tone === "loss"
              ? "mt-1 font-mono text-loss"
              : "mt-1 font-mono"
        }
      >
        {value}
      </div>
    </div>
  );
}
