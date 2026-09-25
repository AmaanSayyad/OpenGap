import {
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  JUPITER_PRICE_API,
  PLATFORM_FEE_BPS,
  PLATFORM_FEE_WALLET,
  USDC_MINT,
  WSOL_MINT,
} from "@/lib/constants";
import { getTokenUiAmount, mainnetConnection, sendConnection } from "@/lib/server-wallet";

const SIG_LIMIT = 200;
const BATCH = 40;
const TTL_MS = 20_000;

export type PlatformVolume = {
  volumeUsd: number;
  feesUsd: number;
  feesUsdc: number;
  feesSol: number;
  fills: number;
  walletUsdc: number;
  walletSol: number;
  solUsd: number;
  wallet: string;
};

type TokenBal = {
  mint?: string;
  owner?: string;
  uiTokenAmount?: { uiAmount?: number | null };
};

let cache: { at: number; value: PlatformVolume } | null = null;

export async function readPlatformVolume(
  connection: Connection = sendConnection(),
): Promise<PlatformVolume> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;

  const owner = new PublicKey(PLATFORM_FEE_WALLET);
  const usdcAta = getAssociatedTokenAddressSync(
    new PublicKey(USDC_MINT),
    owner,
    false,
    TOKEN_PROGRAM_ID,
  );
  const wsolAta = getAssociatedTokenAddressSync(
    new PublicKey(WSOL_MINT),
    owner,
    false,
    TOKEN_PROGRAM_ID,
  );

  const [walletUsdc, walletWsol, solUsd, usdcIn, solIn] = await Promise.all([
    getTokenUiAmount(owner, USDC_MINT, connection).then(async (amount) =>
      amount > 0 ? amount : getTokenUiAmount(owner, USDC_MINT, mainnetConnection()),
    ),
    getTokenUiAmount(owner, WSOL_MINT, connection).then(async (amount) =>
      amount > 0 ? amount : getTokenUiAmount(owner, WSOL_MINT, mainnetConnection()),
    ),
    readSolUsd(),
    inboundMint(connection, usdcAta, owner.toBase58(), USDC_MINT),
    inboundMint(connection, wsolAta, owner.toBase58(), WSOL_MINT),
  ]);

  const feesUsdc = usdcIn.amount;
  const feesSol = solIn.amount;
  const feesUsd = feesUsdc + feesSol * solUsd;
  const volumeUsd = feesUsd * (10_000 / PLATFORM_FEE_BPS);
  const fills = new Set([...usdcIn.sigs, ...solIn.sigs]).size;

  const value: PlatformVolume = {
    volumeUsd,
    feesUsd,
    feesUsdc,
    feesSol,
    fills,
    walletUsdc,
    walletSol: walletWsol,
    solUsd,
    wallet: PLATFORM_FEE_WALLET,
  };
  cache = { at: Date.now(), value };
  return value;
}

async function readSolUsd() {
  try {
    const response = await fetch(`${JUPITER_PRICE_API}?ids=${WSOL_MINT}`, {
      cache: "no-store",
    });
    const payload = (await response.json()) as Record<string, { usdPrice?: number }>;
    const usd = Number(payload[WSOL_MINT]?.usdPrice);
    return Number.isFinite(usd) && usd > 0 ? usd : 0;
  } catch {
    return 0;
  }
}

async function inboundMint(
  connection: Connection,
  ata: PublicKey,
  owner: string,
  mint: string,
) {
  const info = await connection.getAccountInfo(ata, "confirmed");
  if (!info) return { amount: 0, sigs: [] as string[] };

  const sigs = await connection.getSignaturesForAddress(ata, { limit: SIG_LIMIT });
  if (!sigs.length) return { amount: 0, sigs: [] as string[] };

  let amount = 0;
  const inbound: string[] = [];
  for (let i = 0; i < sigs.length; i += BATCH) {
    const batch = sigs.slice(i, i + BATCH);
    const parsed = await connection.getParsedTransactions(
      batch.map((row) => row.signature),
      { maxSupportedTransactionVersion: 0 },
    );
    parsed.forEach((tx, index) => {
      const signature = batch[index]?.signature;
      if (!tx?.meta || !signature) return;
      const delta = ownerMintDelta(
        tx.meta.preTokenBalances ?? [],
        tx.meta.postTokenBalances ?? [],
        owner,
        mint,
      );
      if (delta > 0) {
        amount += delta;
        inbound.push(signature);
      }
    });
  }
  return { amount, sigs: inbound };
}

function ownerMintDelta(
  pre: TokenBal[],
  post: TokenBal[],
  owner: string,
  mint: string,
) {
  return uiOwned(post, owner, mint) - uiOwned(pre, owner, mint);
}

function uiOwned(rows: TokenBal[], owner: string, mint: string) {
  return rows.reduce((sum, row) => {
    if (row.owner !== owner || row.mint !== mint) return sum;
    const value = Number(row.uiTokenAmount?.uiAmount);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
}
