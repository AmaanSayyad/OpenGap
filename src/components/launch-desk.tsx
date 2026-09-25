"use client";

import Link from "next/link";
import { memo, useEffect, useMemo, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { TokenLogo } from "@/components/token-logo";
import { TourHint } from "@/components/product-tour";
import { Button } from "@/components/ui/button";
import { Eyebrow, PageTitle, Panel } from "@/components/ui-kit";
import {
  ANSEMHACK_URL,
  BUSINESS,
  PUMP_POOL,
  ROADMAP,
  STOCK_POOL,
  TOKEN_DEXSCREENER,
  TOKEN_MINT,
  TOKEN_PUMP,
  TOKEN_SOLSCAN,
  TOKEN_SYMBOL,
  TOKEN_URL,
  TOKEN_UTILITY,
} from "@/lib/company";
import { DEMO_VIDEO_URL, DISCORD_URL, PITCH_DECK_URL } from "@/lib/brand";
import { PLATFORM_FEE_WALLET } from "@/lib/constants";
import { formatPct, formatPrice, formatUsd, shortAddress } from "@/lib/format";
import { poolHref } from "@/lib/routes";
import type { MeteoraPool } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type DeskPayload = {
  configured?: boolean;
  agent?: {
    id: string;
    name: string;
    status: string;
    walletAddress: string | null;
    tokenAddress?: string | null;
    skills: string[];
    model: string | null;
    persona: string | null;
    isPublic: boolean;
  } | null;
  skills?: Array<{ slug: string; name: string; description: string }>;
  pairs?: Array<{
    mint: string;
    symbol: string;
    name: string;
    decimals: number;
    imageUrl: string | null;
  }>;
  creatorFeeBps?: { min: number; max: number; default: number };
  cost?: {
    creationFeeSol: number;
    standardCostSol: number;
    quoteValidForSeconds: number;
    payTo: string;
    paymentMethod: string;
  } | null;
  macro?: Array<{ symbol: string; price_usd: number; change_24h: number }>;
  movers?: Array<{
    symbol: string;
    name: string;
    contract: string;
    price_usd: number;
    change_24h: number;
    signal: string;
  }>;
  sol?: { price: number; change24h: number } | null;
  links?: Record<string, string | null>;
  signal?: {
    buy: Array<{ symbol: string; tape: number; mark: number; gap: number }>;
    tape: Array<{ symbol: string; tape: number; mark: number; gap: number }>;
  };
  messages?: Array<{ role: string; content: string; createdAt?: string }>;
  error?: string;
};

const RULES = [
  { label: "Buy only at −3%", hint: "Live must be cheaper than official" },
  { label: "$5 a lot, $15 cap", hint: "One name per turn. Same name waits 12 hours. Over $15 of stocks it holds." },
  { label: "Pause or dry wallet stops it", hint: "Click Pause anytime. It also holds if USDC and SOL are gone." },
  { label: "Does not mint again", hint: "$OPENGAP is already live. The bot will not create another." },
];

export function LaunchDesk() {
  const [desk, setDesk] = useState<DeskPayload | null>(null);
  const [pools, setPools] = useState<MeteoraPool[]>([]);
  const [dbc, setDbc] = useState<{ ready?: boolean; program?: string | null } | null>(
    null,
  );
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [claw, launch] = await Promise.all([
          fetch("/api/clawpump", { cache: "no-store" }).then((response) =>
            response.json(),
          ),
          fetch("/api/launch", { cache: "no-store" })
            .then((response) => response.json())
            .catch(() => ({})),
        ]);
        if (cancelled) return;
        setDesk(claw as DeskPayload);
        setPools((launch as { pools?: MeteoraPool[] }).pools ?? []);
        setDbc((launch as { dbc?: { ready?: boolean; program?: string | null } }).dbc ?? null);
      } catch (error) {
        if (!cancelled) {
          setDesk({
            error: error instanceof Error ? error.message : "ClawPump failed",
          });
        }
      }
    }
    void load();
    const timer = window.setInterval(load, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const images = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const row of desk?.pairs ?? []) map.set(row.symbol, row.imageUrl);
    return map;
  }, [desk?.pairs]);
  const running = desk?.agent?.status === "running";
  const lastReply = desk?.messages?.find((row) => row.role === "assistant");
  const cheap = desk?.signal?.buy ?? [];
  const tape = useMemo(() => {
    const rows = [...(desk?.signal?.tape ?? [])];
    rows.sort((a, b) => a.gap - b.gap);
    return rows.slice(0, 8);
  }, [desk?.signal?.tape]);

  async function run(action: "start" | "stop" | "arm") {
    setBusy(action);
    try {
      const response = await fetch("/api/clawpump", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "ClawPump failed");
      if (payload.agent) {
        setDesk((current) =>
          current ? { ...current, agent: payload.agent } : current,
        );
        toast.success(
          payload.agent.status === "running"
            ? "Agent is watching prices"
            : "Agent paused",
        );
      }
      if (payload.notes) {
        setDesk((current) =>
          current
            ? {
                ...current,
                agent: payload.agent ?? current.agent,
                signal: payload.signal ?? current.signal,
                messages: payload.chat
                  ? [
                      { role: "assistant", content: payload.chat.content },
                      ...(current.messages ?? []),
                    ]
                  : current.messages,
              }
            : current,
        );
        toast.success("Latest prices sent to the agent.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ClawPump failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div
        data-tour="launch"
        className="grid min-w-0 gap-8 md:grid-cols-[1.15fr_0.85fr] md:items-center"
      >
        <div>
          <Eyebrow>The agent room</Eyebrow>
          <PageTitle className="mt-2">
            A bot that buys only when a name is cheap.
          </PageTitle>
          <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
            This is not another tape. OpenGap watches the same tokenized stocks
            and can buy a $5 lot when the live Jupiter price is at least 3%
            cheaper than the issuer mark. Tape is what you pay. Mark is not a
            quote you can lift. Green means cheaper — that gap is the trade.
            $OPENGAP graduated to PumpSwap. The agent will not mint another.
          </p>
          <TourHint className="mt-4" />
        </div>
        <Panel className="p-5">
          <Eyebrow>How it decides</Eyebrow>
          <ol className="mt-4 space-y-4">
            {RULES.map((rule, index) => (
              <li key={rule.label} className="flex gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {index + 1}
                </span>
                <span>
                  <span className="block text-sm font-medium tracking-tight">
                    {rule.label}
                  </span>
                  <span className="mt-0.5 block text-sm leading-6 text-muted-foreground">
                    {rule.hint}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      {desk?.error ? (
        <p className="text-sm text-destructive">{desk.error}</p>
      ) : null}

      <div className="grid min-w-0 gap-6 md:grid-cols-2 md:items-start">
        <Panel data-tour="launch-agent" className="flex flex-col gap-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <BrandLogo size={40} className="shrink-0" />
              <div className="min-w-0">
                <p className="text-lg font-semibold tracking-tight">
                  {desk?.agent?.name ?? "OpenGap"}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {running
                    ? "Watching the tape for a 3% discount."
                    : desk?.agent
                      ? "Paused. It will not buy until you start it."
                      : "Reading the agent…"}
                </p>
              </div>
            </div>
            <p
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-sm font-medium",
                running
                  ? "bg-gain/15 text-gain"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  running ? "bg-gain animate-pulse" : "bg-muted-foreground/50",
                )}
              />
              {running ? "On" : desk?.agent ? "Off" : "…"}
            </p>
          </div>

          <div className="rounded-xl bg-muted/40 px-4 py-3">
            {cheap.length ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Cheap enough to buy
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {cheap.map((row) => (
                    <Link
                      key={row.symbol}
                      href={`/token/${row.symbol.toLowerCase()}`}
                      className="inline-flex items-center gap-2 rounded-full bg-gain/12 px-2.5 py-1 text-sm text-gain hover:bg-gain/18"
                    >
                      <TokenLogo
                        symbol={row.symbol}
                        image={images.get(row.symbol)}
                        size="xs"
                      />
                      <span className="font-medium">{row.symbol}</span>
                      <span className="font-mono">{gapLabel(row.gap)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nothing is 3% cheaper than the official price right now, so it
                waits.
              </p>
            )}
          </div>

          {lastReply?.content ? (
            <div className="rounded-xl border border-border/70 px-4 py-3">
              <Eyebrow>Last decision</Eyebrow>
              <p className="mt-1.5 text-sm leading-6">{cleanReply(lastReply.content)}</p>
            </div>
          ) : null}

          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Wallet</dt>
              <dd className="mt-0.5 font-mono text-sm">
                {desk?.agent?.walletAddress
                  ? shortAddress(desk.agent.walletAddress, 4)
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Listed</dt>
              <dd className="mt-0.5 text-sm">
                {desk?.agent?.isPublic ? "Yes, public" : "Private"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">OpenGap token</dt>
              <dd className="mt-0.5 text-sm">
                {desk?.agent?.tokenAddress || TOKEN_MINT ? "Live" : "Not created"}
              </dd>
            </div>
          </dl>

          <div className="mt-auto flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => run("arm")}
              disabled={Boolean(busy) || !desk?.agent}
            >
              {busy === "arm" ? "Sending…" : "Send latest prices"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => run(running ? "stop" : "start")}
              disabled={Boolean(busy) || !desk?.agent}
            >
              {busy === "start" || busy === "stop"
                ? "…"
                : running
                  ? "Pause"
                  : "Start watching"}
            </Button>
            {desk?.links?.wallet ? (
              <a
                href={desk.links.wallet}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center rounded-full px-3 text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                View wallet
              </a>
            ) : null}
            {desk?.links?.marketplace ? (
              <a
                href={desk.links.marketplace}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center rounded-full px-3 text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                See it listed
              </a>
            ) : null}
            <a
              href={TOKEN_DEXSCREENER}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center rounded-full px-3 text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              ${TOKEN_SYMBOL}
            </a>
          </div>
        </Panel>

        <Panel data-tour="launch-watch" className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Eyebrow>What it is watching</Eyebrow>
              <p className="mt-1 text-sm text-muted-foreground">
                Live price versus official. Green means cheaper — that is when
                it can buy.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {tape.length ? `${tape.length} names` : "Reading the tape…"}
            </p>
          </div>

          {tape.length ? (
            <ul className="mt-5 divide-y divide-border/60">
              {tape.map((row) => {
                const ready = row.gap <= -0.03;
                return (
                  <li key={row.symbol}>
                    <Link
                      href={`/token/${row.symbol.toLowerCase()}`}
                      className="flex items-center gap-3 py-2.5"
                    >
                      <TokenLogo
                        symbol={row.symbol}
                        image={images.get(row.symbol)}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="font-medium">{row.symbol}</span>
                          {ready ? (
                            <span className="rounded-full bg-gain/15 px-2 py-0.5 text-[10px] font-medium text-gain">
                              Can buy
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                          {formatPrice(row.tape)} live · {formatPrice(row.mark)} official
                        </span>
                      </span>
                      <span
                        className={cn(
                          "shrink-0 text-right font-mono text-sm",
                          ready
                            ? "text-gain"
                            : row.gap > 0
                              ? "text-loss"
                              : "text-muted-foreground",
                        )}
                      >
                        {gapLabel(row.gap)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">Reading the tape…</p>
          )}
        </Panel>
      </div>

      {desk?.macro?.length ? (
        <div className="grid gap-3 sm:grid-cols-4">
          {desk.macro.map((row) => (
            <Panel key={row.symbol} className="p-4">
              <Eyebrow>{row.symbol}</Eyebrow>
              <p className="mt-1 font-mono text-lg">{formatUsd(row.price_usd)}</p>
              <p
                className={cn(
                  "font-mono text-xs",
                  row.change_24h < 0 ? "text-gain" : "text-loss",
                )}
              >
                {formatPct(row.change_24h / 100)} 24h
              </p>
            </Panel>
          ))}
        </div>
      ) : null}

      <LaunchProject pools={pools} dbc={dbc} />
    </div>
  );
}

const LaunchProject = memo(function LaunchProject({
  pools,
  dbc,
}: {
  pools: MeteoraPool[];
  dbc: { ready?: boolean; program?: string | null } | null;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-2">
        <Panel>
          <Eyebrow>Revenue</Eyebrow>
          <p className="mt-2 text-lg font-semibold tracking-tight">
            1% on every fill
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            {BUSINESS.map((line) => (
              <li key={line} className="flex gap-3">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <Eyebrow>Fee wallet</Eyebrow>
            <a
              href={`https://solscan.io/account/${PLATFORM_FEE_WALLET}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex max-w-full items-center rounded-full bg-muted px-3 py-1.5 font-mono text-xs sm:text-sm"
            >
              <span className="truncate">{PLATFORM_FEE_WALLET}</span>
            </a>
          </div>
        </Panel>

        <Panel data-tour="launch-quote" className="bg-card/40">
          <Eyebrow>Token · ${TOKEN_SYMBOL}</Eyebrow>
          <p className="mt-2 text-lg font-semibold tracking-tight">
            Graduated to PumpSwap
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Mint {shortAddress(TOKEN_MINT, 6)}. Launched 24 Sep 2026 on ClawPump
            against{" "}
            <a
              href="https://x.com/Open_Gap"
              className="underline underline-offset-4"
              target="_blank"
              rel="noreferrer"
            >
              @Open_Gap
            </a>
            . Same mint. The agent will not mint again.
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            {TOKEN_UTILITY.map((line) => (
              <li key={line} className="flex gap-3">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <LinkPill href={TOKEN_DEXSCREENER} primary>
              DexScreener
            </LinkPill>
            <LinkPill href={TOKEN_PUMP}>Pump.fun</LinkPill>
            <LinkPill href={TOKEN_URL}>ClawPump</LinkPill>
            <LinkPill href={TOKEN_SOLSCAN}>Solscan</LinkPill>
            <LinkPill href={ANSEMHACK_URL}>AnsemHack</LinkPill>
            <LinkPill href={DISCORD_URL}>Discord</LinkPill>
            <LinkPill href={PITCH_DECK_URL}>Pitch</LinkPill>
            <LinkPill href={DEMO_VIDEO_URL}>Demo</LinkPill>
          </div>
        </Panel>
      </div>

      <div>
        <Eyebrow>Roadmap</Eyebrow>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {ROADMAP.map((line, index) => (
            <Panel key={line} className="p-4">
              <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {index + 1}
              </span>
              <p className="mt-3 text-sm leading-6">{line}</p>
            </Panel>
          ))}
        </div>
      </div>

      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-2">
        <Panel>
          <Eyebrow>PumpSwap · primary</Eyebrow>
          <p className="mt-2 text-lg font-semibold tracking-tight">
            {PUMP_POOL.name}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {PUMP_POOL.note}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <LinkPill href={PUMP_POOL.url} primary>
              DexScreener
            </LinkPill>
            <LinkPill href={TOKEN_PUMP}>Pump.fun</LinkPill>
          </div>
        </Panel>

        <Panel>
          <Eyebrow>Meteora · stock pair</Eyebrow>
          <p className="mt-2 text-lg font-semibold tracking-tight">
            {STOCK_POOL.name}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {STOCK_POOL.note} Quote is the PreStock, not SOL.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <LinkPill href={STOCK_POOL.url} primary>
              Meteora
            </LinkPill>
            <LinkPill href={`https://solscan.io/tx/${STOCK_POOL.signature}`}>
              Create tx
            </LinkPill>
          </div>
        </Panel>
      </div>

      <Panel className="p-0">
        <div className="flex flex-wrap items-end justify-between gap-3 px-6 pt-5">
          <div>
            <Eyebrow>Other pools</Eyebrow>
            <p className="mt-1 text-sm text-muted-foreground">
              {dbc?.ready
                ? "Meteora is up. PreStock buys still go through Jupiter."
                : dbc?.program
                  ? "Meteora is not responding. Jupiter still works."
                  : "Checking other venues…"}
            </p>
          </div>
        </div>
        {pools.length ? (
          <ul className="mt-4 divide-y divide-border/60 border-t border-border/60">
            {pools.slice(0, 6).map((pool) => (
              <li key={pool.pairAddress}>
                <a
                  href={poolHref(pool.dex, pool.pairAddress)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 px-6 py-3 text-sm hover:bg-muted/40"
                >
                  <span className="truncate font-medium">{pool.name}</span>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {pool.tvl != null ? formatUsd(pool.tvl) : pool.dex}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-6 pb-5 pt-3 text-sm text-muted-foreground">
            No extra stock pools listed yet. Buys still go through Jupiter.
          </p>
        )}
      </Panel>
    </div>
  );
});

function LinkPill({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: string;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex h-8 items-center rounded-full px-3 text-sm",
        primary ? "bg-foreground text-background" : "bg-muted",
      )}
    >
      {children}
    </a>
  );
}

function gapLabel(gap: number) {
  const pct = `${Math.abs(gap * 100).toFixed(1)}%`;
  if (gap <= -0.03) return `${pct} cheaper`;
  if (gap < 0) return `${pct} under`;
  if (gap > 0) return `${pct} more expensive`;
  return "in line";
}

function cleanReply(content: string) {
  const compact = content.replace(/\s+/g, " ").trim();
  const match = compact.match(
    /OpenGap ·\s*(HOLD|BUY)[^.]*?(?:Name:\s*([A-Z0-9-]+))?/i,
  );
  if (match) {
    const name = match[2] ? ` ${match[2]}` : "";
    return match[1].toUpperCase() === "BUY"
      ? `Bought${name}.`
      : `Held${name}. Nothing bought.`;
  }
  return compact.slice(0, 160);
}
