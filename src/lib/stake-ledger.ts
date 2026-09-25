import { Connection, PublicKey } from "@solana/web3.js";
import { getTokenUiAmount, sendConnection } from "@/lib/server-wallet";
import {
  mergeStakes,
  sanitizeStake,
  STAKING_MINT,
  STAKING_VAULT,
  type StakeDays,
  type StakeRecord,
  termFor,
} from "@/lib/staking";

const MEMO = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
const LIMIT = 80;

const cache: StakeRecord[] = [];
let vaultTotal: { amount: number; at: number } | null = null;
const VAULT_TTL_MS = 15_000;

export function rememberStake(row: StakeRecord) {
  const next = sanitizeStake(row);
  if (!next) return;
  const i = cache.findIndex((item) => item.signature === next.signature);
  if (i >= 0) cache[i] = next;
  else {
    cache.unshift(next);
    if (vaultTotal) {
      vaultTotal = {
        amount: vaultTotal.amount + next.amount,
        at: Date.now(),
      };
    }
  }
  if (cache.length > 200) cache.length = 200;
}

export async function readVaultTotal(connection: Connection) {
  if (vaultTotal && Date.now() - vaultTotal.at < VAULT_TTL_MS) {
    return vaultTotal.amount;
  }
  let amount = await getTokenUiAmount(STAKING_VAULT, STAKING_MINT, connection);
  if (amount === 0) {
    amount = await getTokenUiAmount(STAKING_VAULT, STAKING_MINT, sendConnection());
  }
  vaultTotal = { amount, at: Date.now() };
  return amount;
}

export function cachedStakes() {
  return cache.slice();
}

export async function readVaultStakes(connection: Connection) {
  const vault = new PublicKey(STAKING_VAULT);
  const sigs = await connection.getSignaturesForAddress(vault, { limit: LIMIT });
  const parsed = await connection.getParsedTransactions(
    sigs.map((row) => row.signature),
    { maxSupportedTransactionVersion: 0 },
  );

  const rows: StakeRecord[] = [];
  parsed.forEach((tx, index) => {
    const signature = sigs[index]?.signature;
    if (!tx || !signature) return;
    const row = fromParsed(tx, signature);
    if (row) rows.push(row);
  });

  return mergeStakes(rows, cache);
}

function fromParsed(
  tx: {
    blockTime?: number | null;
    meta?: {
      preTokenBalances?: TokenBal[] | null;
      postTokenBalances?: TokenBal[] | null;
      innerInstructions?: Array<{ instructions: unknown[] }> | null;
    } | null;
    transaction: { message: { instructions: unknown[] } };
  },
  signature: string,
) {
  const lockedAt = (tx.blockTime ?? 0) * 1000;
  if (!lockedAt) return null;
  const pre = tx.meta?.preTokenBalances ?? [];
  const post = tx.meta?.postTokenBalances ?? [];
  const vaultIn = ownerDelta(pre, post, STAKING_VAULT);
  if (vaultIn <= 0) return null;
  const wallet = senderOf(pre, post);
  if (!wallet) return null;
  const days = memoDays([
    ...tx.transaction.message.instructions,
    ...(tx.meta?.innerInstructions ?? []).flatMap((inner) => inner.instructions),
  ]);
  if (!days) return null;
  return sanitizeStake({
    id: signature,
    wallet,
    amount: vaultIn,
    days,
    apy: termFor(days).apy,
    reward: 0,
    signature,
    lockedAt,
    unlockAt: 0,
  });
}

type TokenBal = {
  mint: string;
  owner?: string;
  uiTokenAmount?: { uiAmount?: number | null };
};

function uiOf(row: TokenBal | undefined) {
  const value = Number(row?.uiTokenAmount?.uiAmount);
  return Number.isFinite(value) ? value : 0;
}

function ownerDelta(pre: TokenBal[], post: TokenBal[], owner: string) {
  const before = pre.find((row) => row.mint === STAKING_MINT && row.owner === owner);
  const after = post.find((row) => row.mint === STAKING_MINT && row.owner === owner);
  return uiOf(after) - uiOf(before);
}

function senderOf(pre: TokenBal[], post: TokenBal[]) {
  const owners = new Set(
    [...pre, ...post]
      .filter((row) => row.mint === STAKING_MINT && row.owner)
      .map((row) => row.owner as string),
  );
  let best: { owner: string; delta: number } | null = null;
  for (const owner of owners) {
    if (owner === STAKING_VAULT) continue;
    const delta = ownerDelta(pre, post, owner);
    if (delta < 0 && (!best || delta < best.delta)) best = { owner, delta };
  }
  return best?.owner ?? null;
}

function memoDays(instructions: unknown[]): StakeDays | null {
  for (const ix of instructions) {
    if (!ix || typeof ix !== "object") continue;
    const row = ix as {
      program?: string;
      programId?: { toBase58?: () => string } | string;
      parsed?: string | { type?: string; info?: { memo?: string } };
      data?: string;
    };
    const program =
      typeof row.programId === "string"
        ? row.programId
        : row.programId?.toBase58?.();
    const text =
      typeof row.parsed === "string"
        ? row.parsed
        : row.parsed?.info?.memo ?? row.data ?? "";
    const match = String(text).match(/OPENGAP-STAKE:(\d+)/);
    if (!match) continue;
    if (program && program !== MEMO && row.program !== "spl-memo") continue;
    const days = Number(match[1]);
    if (days === 30 || days === 90 || days === 180 || days === 360) return days;
  }
  return null;
}
