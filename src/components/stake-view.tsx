"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { StakeChart } from "@/components/stake-chart";
import { StakeLocks } from "@/components/stake-locks";
import { TokenLogo } from "@/components/token-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eyebrow, PageTitle, Panel } from "@/components/ui-kit";
import { useOpenGapPrice } from "@/hooks/use-opengap-price";
import { useStakes } from "@/hooks/use-stakes";
import { formatTokenAmount, useTokenBalance } from "@/hooks/use-token-balance";
import { useVaultStaked } from "@/hooks/use-vault-staked";
import { TOKEN_DEXSCREENER, TOKEN_SYMBOL } from "@/lib/company";
import { formatUsd, shortAddress } from "@/lib/format";
import {
  formatUnlockAt,
  quoteStake,
  STAKE_TERMS,
  STAKING_MINT,
  STAKING_VAULT,
  type StakeDays,
} from "@/lib/staking";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function formatAmt(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  return value.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

export function StakeView({ totalStaked = null }: { totalStaked?: number | null }) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { save } = useStakes();
  const price = useOpenGapPrice();
  const vault = useVaultStaked(totalStaked);
  const held = useTokenBalance(connected ? STAKING_MINT : null, connected);
  const [days, setDays] = useState<StakeDays>(30);
  const [amount, setAmount] = useState("1000");
  const [busy, setBusy] = useState(false);
  const parsed = Number(amount.replace(/,/g, ""));
  const quote = useMemo(() => quoteStake(parsed, days), [days, parsed]);

  async function lock() {
    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Enter an amount to lock");
      return;
    }
    if (held != null && parsed > held) {
      toast.error("Not enough $OPENGAP in this wallet");
      return;
    }
    setBusy(true);
    try {
      const { sendOpenGapStake } = await import("@/lib/stake-transfer");
      const signature = await sendOpenGapStake({
        connection,
        owner: publicKey,
        amount: parsed,
        days,
        sendTransaction,
      });
      const next = quoteStake(parsed, days, Date.now());
      save({
        id: signature,
        wallet: publicKey.toBase58(),
        amount: next.amount,
        days: next.days,
        apy: next.apy,
        reward: next.reward,
        signature,
        lockedAt: Date.now(),
        unlockAt: next.unlockAt,
      });
      toast.success(`Locked ${formatAmt(parsed)} $${TOKEN_SYMBOL}`);
      void vault.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Stake failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col gap-10 px-4 py-10 sm:gap-12 sm:px-6 sm:py-14">
        <section data-tour="stake" className="flex min-w-0 flex-col gap-3">
          <Eyebrow>$OPENGAP staking</Eyebrow>
          <PageTitle className="max-w-none">Lock $OPENGAP. Pick a term.</PageTitle>
          <p className="w-full text-sm leading-6 text-muted-foreground">
            30 days 30% APY, 90 days 90%, 180 days 180%, 360 days 360%. Send $
            {TOKEN_SYMBOL} from your wallet. You will automatically receive the
            principal + reward at the unlock time.
          </p>
          <Panel className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>Total staked</Eyebrow>
              <p className="mt-2 font-mono text-3xl tracking-tight sm:text-4xl">
                {vault.amount == null ? "…" : formatAmt(vault.amount)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                ${TOKEN_SYMBOL} locked by everyone
                {price && vault.amount != null ? (
                  <span className="ml-2 font-mono">
                    {formatUsd(vault.amount * price)}
                  </span>
                ) : null}
              </p>
            </div>
            <a
              href={`https://solscan.io/account/${STAKING_VAULT}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-xs text-muted-foreground underline underline-offset-4"
            >
              {shortAddress(STAKING_VAULT, 4)}
            </a>
          </Panel>
        </section>

        <section className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {STAKE_TERMS.map((term) => {
            const row = quoteStake(parsed, term.days);
            const active = days === term.days;
            return (
              <button
                key={term.days}
                type="button"
                onClick={() => setDays(term.days)}
                aria-pressed={active}
                className={cn(
                  "rounded-2xl border px-4 py-4 text-left transition-colors",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border/80 bg-card/60 hover:border-foreground/30",
                )}
              >
                <p className="text-xs opacity-70">{term.days} days</p>
                <p className="mt-1 font-mono text-xl font-semibold tracking-tight">
                  {term.apy}%
                  <span className="ml-1 text-sm font-medium opacity-70">APY</span>
                </p>
                <p
                  className={cn(
                    "mt-3 font-mono text-xs",
                    active ? "opacity-80" : "text-muted-foreground",
                  )}
                >
                  {formatAmt(row.total)} at unlock
                </p>
              </button>
            );
          })}
        </section>

        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <Panel className="flex min-w-0 flex-col gap-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <label className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="text-xs text-muted-foreground">Amount</span>
                <Input
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="h-11 font-mono text-base"
                />
              </label>
              <div className="flex flex-wrap gap-1.5 pb-0.5">
                {[0.25, 0.5, 1].map((frac) => (
                  <button
                    key={frac}
                    type="button"
                    disabled={held == null || held <= 0}
                    onClick={() =>
                      held != null && setAmount(formatTokenAmount(held * frac))
                    }
                    className="h-9 rounded-full bg-muted px-3 text-xs disabled:opacity-40"
                  >
                    {frac === 1 ? "Max" : `${frac * 100}%`}
                  </button>
                ))}
              </div>
            </div>
            {held != null ? (
              <button
                type="button"
                className="self-start font-mono text-xs text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => setAmount(formatTokenAmount(held))}
              >
                Wallet {formatAmt(held)} ${TOKEN_SYMBOL}
              </button>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <caption className="sr-only">
                  Staking calculator for every term
                </caption>
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b border-border/70">
                    <th className="pb-2 font-medium">Term</th>
                    <th className="pb-2 font-medium">APY</th>
                    <th className="pb-2 font-medium">Reward</th>
                    <th className="pb-2 font-medium">You receive</th>
                  </tr>
                </thead>
                <tbody>
                  {STAKE_TERMS.map((term) => {
                    const row = quoteStake(parsed, term.days);
                    const active = days === term.days;
                    return (
                      <tr
                        key={term.days}
                        className={cn(
                          "cursor-pointer border-b border-border/40 last:border-0",
                          active && "text-foreground",
                        )}
                        onClick={() => setDays(term.days)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setDays(term.days);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-pressed={active}
                      >
                        <td className="py-3 font-medium">{term.days} days</td>
                        <td className="py-3 font-mono">{term.apy}%</td>
                        <td className="py-3 font-mono text-gain">
                          +{formatAmt(row.reward)}
                        </td>
                        <td className="py-3 font-mono">
                          {formatAmt(row.total)}
                          {price && row.total ? (
                            <span className="ml-2 text-xs text-muted-foreground">
                              {formatUsd(row.total * price)}
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <TokenLogo symbol="OPENGAP" image="/opengap.png" size="lg" framed />
              <div className="min-w-0">
                <Eyebrow>Ticket</Eyebrow>
                <p className="mt-0.5 text-sm font-medium">
                  {quote.days} days · {quote.apy}% APY
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">You receive</p>
              <p className="mt-1 font-mono text-3xl tracking-tight">
                {formatAmt(quote.total)}
              </p>
              <p className="mt-1 text-sm text-gain">
                +{formatAmt(quote.reward)} reward
              </p>
              {price && quote.total ? (
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {formatUsd(quote.total * price)}
                </p>
              ) : null}
            </div>
            <div className="rounded-2xl bg-muted/50 px-4 py-3">
              <p className="text-xs text-muted-foreground">Unlocks</p>
              <p className="mt-1 font-mono text-sm">{formatUnlockAt(quote.unlockAt)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Principal + reward land automatically.
              </p>
            </div>
            <Button size="lg" className="w-full" disabled={busy} onClick={() => void lock()}>
              {busy
                ? "Sending…"
                : connected
                  ? `Lock ${formatAmt(quote.amount)} · ${days}d`
                  : "Connect to lock"}
            </Button>
            <p className="text-xs leading-5 text-muted-foreground">
              Sends ${TOKEN_SYMBOL} to{" "}
              <a
                href={`https://solscan.io/account/${STAKING_VAULT}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono underline underline-offset-4"
              >
                {shortAddress(STAKING_VAULT, 4)}
              </a>
              .{" "}
              <a
                href={TOKEN_DEXSCREENER}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                DexScreener
              </a>
              .
            </p>
          </Panel>
        </div>

        <StakeLocks />
        <StakeChart />
      </main>
    </div>
  );
}
