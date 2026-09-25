"use client";

import Link from "next/link";
import { TokenLogo } from "@/components/token-logo";
import { Eyebrow, Panel } from "@/components/ui-kit";
import { useOpenGapPrice } from "@/hooks/use-opengap-price";
import { useStakes } from "@/hooks/use-stakes";
import { formatUsd } from "@/lib/format";
import { formatUnlockAt, isUnlocked, unlockCountdown } from "@/lib/staking";
import { cn } from "@/lib/utils";

function formatAmt(value: number) {
  if (!Number.isFinite(value)) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return value.toLocaleString("en-US", { maximumFractionDigits: 1 });
  return value.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

export function StakeLocks({ compact = false }: { compact?: boolean }) {
  const { wallet, stakes, totals, now } = useStakes();
  const price = useOpenGapPrice();
  const lockedUsd = price ? totals.locked * price : null;

  if (!wallet) {
    return compact ? null : (
      <Panel>
        <Eyebrow>Locked $OPENGAP</Eyebrow>
        <p className="mt-2 text-sm text-muted-foreground">
          Connect a wallet to see locks and unlock times from this device.
        </p>
      </Panel>
    );
  }

  if (stakes.length === 0) {
    return compact ? null : (
      <Panel>
        <Eyebrow>Locked $OPENGAP</Eyebrow>
        <p className="mt-2 text-sm text-muted-foreground">
          Nothing locked yet. Pick a term and send $OPENGAP.
        </p>
        <Link
          href="/stake"
          className="mt-3 inline-flex text-sm underline underline-offset-4"
        >
          Open staking
        </Link>
      </Panel>
    );
  }

  return (
    <Panel className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Eyebrow>Locked $OPENGAP</Eyebrow>
          <p className="mt-1 font-mono text-lg">
            {formatAmt(totals.locked)}
            {lockedUsd != null ? (
              <span className="ml-2 text-sm text-muted-foreground">
                {formatUsd(lockedUsd)}
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {totals.count} lock{totals.count === 1 ? "" : "s"} · +
            {formatAmt(totals.reward)} at unlock
          </p>
        </div>
        {compact ? (
          <Link
            href="/stake"
            className="text-xs underline underline-offset-4 text-muted-foreground hover:text-foreground"
          >
            Stake
          </Link>
        ) : null}
      </div>
      <ul className="flex flex-col gap-2">
        {stakes.map((stake) => {
          const done = isUnlocked(stake, now);
          return (
            <li
              key={stake.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-muted/40 px-3 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <TokenLogo symbol="OPENGAP" image="/opengap.png" size="md" framed />
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {formatAmt(stake.amount)} · {stake.days}d · {stake.apy}% APY
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {formatUnlockAt(stake.unlockAt)}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={cn(
                    "font-mono text-sm",
                    done ? "text-gain" : "text-muted-foreground",
                  )}
                >
                  +{formatAmt(stake.reward)}
                </p>
                <p
                  className={cn(
                    "mt-1 text-[11px]",
                    done ? "text-gain" : "text-muted-foreground",
                  )}
                >
                  {done ? "Unlocked" : unlockCountdown(stake.unlockAt, now)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
