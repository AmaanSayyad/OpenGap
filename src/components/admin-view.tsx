"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eyebrow, PageTitle, Panel } from "@/components/ui-kit";
import { PLATFORM_FEE_WALLET } from "@/lib/constants";
import { formatUsd, shortAddress } from "@/lib/format";
import type { PlatformVolume } from "@/lib/platform-volume";
import {
  formatUnlockAt,
  isUnlocked,
  STAKING_VAULT,
  type StakeRecord,
  unlockCountdown,
} from "@/lib/staking";
import { useOpenGapPrice } from "@/hooks/use-opengap-price";
import { cn } from "@/lib/utils";

const PAID_KEY = "opengap.admin.paid.v1";

function formatAmt(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0";
  return value.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

function readPaid(): string[] {
  try {
    const rows = JSON.parse(localStorage.getItem(PAID_KEY) ?? "[]") as string[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

export function AdminView() {
  const price = useOpenGapPrice();
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [stakes, setStakes] = useState<StakeRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState<string[]>([]);
  const [volume, setVolume] = useState<PlatformVolume | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setPaid(readPaid());
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  async function checkSession() {
    try {
      const response = await fetch("/api/admin/session", { cache: "no-store" });
      const payload = (await response.json()) as { ok?: boolean };
      const ok = Boolean(payload.ok);
      setAuthed(ok);
      if (ok) await load();
      else setStakes([]);
    } catch {
      setAuthed(false);
    }
  }

  async function load() {
    try {
      const [stakesRes, volumeRes] = await Promise.all([
        fetch("/api/stakes", { cache: "no-store" }),
        fetch("/api/admin/volume", { cache: "no-store" }),
      ]);
      if (stakesRes.status === 401 || volumeRes.status === 401) {
        setAuthed(false);
        setStakes([]);
        setVolume(null);
        return;
      }
      const payload = (await stakesRes.json()) as {
        stakes?: StakeRecord[];
        error?: string;
      };
      const desk = (await volumeRes.json()) as PlatformVolume & { error?: string };
      setStakes(Array.isArray(payload.stakes) ? payload.stakes : []);
      setVolume(desk.error ? null : desk);
      setError(payload.error ?? desk.error ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Stake book failed");
    }
  }

  useEffect(() => {
    void checkSession();
  }, []);

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Wrong password");
        return;
      }
      setPassword("");
      setAuthed(true);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setStakes([]);
    setVolume(null);
  }

  function togglePaid(signature: string) {
    setPaid((current) => {
      const next = current.includes(signature)
        ? current.filter((id) => id !== signature)
        : [...current, signature];
      try {
        localStorage.setItem(PAID_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota */
      }
      return next;
    });
  }

  const due = useMemo(
    () =>
      stakes.filter(
        (row) => isUnlocked(row, now) && !paid.includes(row.signature),
      ),
    [now, paid, stakes],
  );
  const locked = useMemo(
    () => stakes.filter((row) => !isUnlocked(row, now)),
    [now, stakes],
  );
  const pay = due.reduce((sum, row) => sum + row.amount + row.reward, 0);

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:gap-10 sm:px-6 sm:py-12">
        <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>Admin</Eyebrow>
            <PageTitle className="mt-3">Stake payouts</PageTitle>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              After unlock we send principal + reward manually. This book is
              the vault at {shortAddress(STAKING_VAULT, 4)} plus locks saved
              from the site.
            </p>
          </div>
          {authed ? (
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => void load()}>
                Refresh
              </Button>
              <Button type="button" variant="outline" onClick={() => void signOut()}>
                Sign out
              </Button>
            </div>
          ) : null}
        </section>

        {!authed ? (
          <Panel className="mx-auto w-full max-w-sm">
            <Eyebrow>Password</Eyebrow>
            <p className="mt-2 text-sm text-muted-foreground">
              Password for the payout desk. Session lasts a week.
            </p>
            <form className="mt-4 flex flex-col gap-3" onSubmit={(event) => void signIn(event)}>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Admin password"
              />
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" disabled={busy || !password}>
                {busy ? "Checking…" : "Sign in"}
              </Button>
            </form>
          </Panel>
        ) : null}

        {authed && error ? <p className="text-sm text-destructive">{error}</p> : null}

        {authed ? (
        <>

        <section className="grid gap-3 sm:grid-cols-3">
          <Stat
            label="Platform volume"
            value={volume ? formatUsd(volume.volumeUsd) : "…"}
            hint={
              volume
                ? `${volume.fills} Jupiter fill${volume.fills === 1 ? "" : "s"} · 1% fee`
                : "Reading the fee wallet…"
            }
          />
          <Stat
            label="Fees collected"
            value={volume ? formatUsd(volume.feesUsd) : "…"}
            hint={
              volume
                ? `${formatAmt(volume.feesUsdc)} USDC · ${formatAmt(volume.feesSol)} SOL`
                : "Inbound to the fee wallet"
            }
          />
          <Stat
            label="Fee wallet now"
            value={volume ? formatUsd(volume.walletUsdc + volume.walletSol * volume.solUsd) : "…"}
            hint={
              volume
                ? `${formatAmt(volume.walletUsdc)} USDC · ${formatAmt(volume.walletSol)} SOL`
                : shortAddress(PLATFORM_FEE_WALLET, 4)
            }
          />
        </section>
        {volume ? (
          <p className="-mt-2 text-xs text-muted-foreground">
            Volume is inbound 1% Jupiter fees × 100.{" "}
            <a
              href={`https://solscan.io/account/${PLATFORM_FEE_WALLET}`}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              Fee wallet
            </a>
          </p>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-3">
          <Stat label="Locks" value={String(stakes.length)} />
          <Stat
            label="Due now"
            value={`${due.length}`}
            hint={pay ? `${formatAmt(pay)} $OPENGAP to send` : "None waiting"}
          />
          <Stat
            label="Still locked"
            value={String(locked.length)}
            hint={
              locked.length
                ? `Next ${formatUnlockAt(Math.min(...locked.map((row) => row.unlockAt)))}`
                : "—"
            }
          />
        </section>

        <Panel className="overflow-x-auto p-0">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <caption className="sr-only">All $OPENGAP locks and unlock times</caption>
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b border-border/70">
                <th className="px-4 py-3 font-medium">Wallet</th>
                <th className="px-4 py-3 font-medium">Lock</th>
                <th className="px-4 py-3 font-medium">Unlock</th>
                <th className="px-4 py-3 font-medium">Send</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {stakes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-muted-foreground">
                    No locks yet. They appear after a wallet sends $OPENGAP to
                    the vault with a term memo.
                  </td>
                </tr>
              ) : (
                stakes.map((row) => {
                  const done = isUnlocked(row, now);
                  const marked = paid.includes(row.signature);
                  const send = row.amount + row.reward;
                  return (
                    <tr key={row.signature} className="border-t border-border/60">
                      <td className="px-4 py-3">
                        <a
                          href={`https://solscan.io/account/${row.wallet}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs underline-offset-4 hover:underline"
                        >
                          {shortAddress(row.wallet, 4)}
                        </a>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {row.days}d · {row.apy}% APY
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {formatAmt(row.amount)}
                        <p className="mt-1 text-muted-foreground">
                          {formatUnlockAt(row.lockedAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {formatUnlockAt(row.unlockAt)}
                        <p className="mt-1 text-muted-foreground">
                          {done ? "Reached" : unlockCountdown(row.unlockAt, now)}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {formatAmt(send)}
                        {price ? (
                          <p className="mt-1 text-muted-foreground">
                            {formatUsd(send * price)}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <p
                          className={cn(
                            "text-xs",
                            marked
                              ? "text-gain"
                              : done
                                ? "text-foreground"
                                : "text-muted-foreground",
                          )}
                        >
                          {marked ? "Paid" : done ? "Send now" : "Locked"}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <a
                            href={`https://solscan.io/tx/${row.signature}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs underline underline-offset-4"
                          >
                            Tx
                          </a>
                          <button
                            type="button"
                            onClick={() => togglePaid(row.signature)}
                            className="text-xs underline underline-offset-4"
                          >
                            {marked ? "Undo paid" : "Mark paid"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Panel>
        </>
        ) : null}
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Panel>
      <Eyebrow>{label}</Eyebrow>
      <p className="mt-2 font-mono text-2xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Panel>
  );
}
