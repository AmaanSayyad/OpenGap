import { TOKEN_MINT } from "@/lib/company";

export const STAKING_VAULT = "5vkmdtnxfZ1WhiYYS1g1mXAwyNSJ63thPR7grwesywwe";
export const STAKING_MINT = TOKEN_MINT;

export const STAKE_TERMS = [
  { days: 30, apy: 30 },
  { days: 90, apy: 90 },
  { days: 180, apy: 180 },
  { days: 360, apy: 360 },
] as const;

export type StakeDays = (typeof STAKE_TERMS)[number]["days"];

export type StakeQuote = {
  days: StakeDays;
  apy: number;
  amount: number;
  reward: number;
  total: number;
  unlockAt: number;
};

export type StakeRecord = {
  id: string;
  wallet: string;
  amount: number;
  days: StakeDays;
  apy: number;
  reward: number;
  signature: string;
  lockedAt: number;
  unlockAt: number;
};

export function termFor(days: number) {
  return STAKE_TERMS.find((term) => term.days === days) ?? STAKE_TERMS[0];
}

export function quoteStake(
  amount: number,
  days: StakeDays,
  lockedAt = Date.now(),
): StakeQuote {
  const { apy } = termFor(days);
  const safe = Number.isFinite(amount) && amount > 0 ? amount : 0;
  const reward = safe * (apy / 100);
  return {
    days,
    apy,
    amount: safe,
    reward,
    total: safe + reward,
    unlockAt: lockedAt + days * 86_400_000,
  };
}

export function isUnlocked(stake: StakeRecord, now = Date.now()) {
  return now >= stake.unlockAt;
}

export function formatUnlockAt(unlockAt: number) {
  return new Date(unlockAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function unlockCountdown(unlockAt: number, now = Date.now()) {
  const ms = Math.max(0, unlockAt - now);
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (minutes > 0) return `${minutes}m`;
  return "now";
}

export function lockedStakes(stakes: StakeRecord[], now = Date.now()) {
  return stakes.filter((stake) => !isUnlocked(stake, now));
}

export function stakeTotals(stakes: StakeRecord[], now = Date.now()) {
  const active = lockedStakes(stakes, now);
  return {
    locked: active.reduce((sum, stake) => sum + stake.amount, 0),
    reward: active.reduce((sum, stake) => sum + stake.reward, 0),
    count: active.length,
  };
}

export function mergeStakes(...lists: StakeRecord[][]) {
  const map = new Map<string, StakeRecord>();
  for (const list of lists) {
    for (const row of list) {
      const next = sanitizeStake(row);
      if (!next) continue;
      const prev = map.get(next.signature);
      if (!prev || next.lockedAt >= prev.lockedAt) map.set(next.signature, next);
    }
  }
  return [...map.values()].sort((a, b) => b.lockedAt - a.lockedAt);
}

export function sanitizeStake(row: StakeRecord | null | undefined): StakeRecord | null {
  if (!row) return null;
  const days = termFor(Number(row.days)).days;
  const amount = Number(row.amount);
  const lockedAt = Number(row.lockedAt);
  const wallet = String(row.wallet ?? "");
  const signature = String(row.signature ?? row.id ?? "");
  if (!wallet || !signature || !Number.isFinite(amount) || amount <= 0) return null;
  if (!Number.isFinite(lockedAt) || lockedAt <= 0) return null;
  const quote = quoteStake(amount, days, lockedAt);
  return {
    id: signature,
    wallet,
    amount: quote.amount,
    days: quote.days,
    apy: quote.apy,
    reward: quote.reward,
    signature,
    lockedAt,
    unlockAt: quote.unlockAt,
  };
}
