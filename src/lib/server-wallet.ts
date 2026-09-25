import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  VersionedTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { USDC_MINT } from "@/lib/constants";
import { getJupiterSwap, type JupiterQuote } from "@/lib/jupiter";

export function getTestKeypair() {
  const secret = process.env.SOLANA_PRIVATE_KEY;
  if (!secret) throw new Error("SOLANA_PRIVATE_KEY is not set");
  return Keypair.fromSecretKey(bs58.decode(secret));
}

export function mainnetConnection() {
  return new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC ?? "https://solana-rpc.publicnode.com",
    "confirmed",
  );
}

export function sendConnection() {
  return new Connection(
    process.env.SOLANA_SEND_RPC ?? "https://api.mainnet-beta.solana.com",
    "confirmed",
  );
}

export function devnetConnection() {
  return new Connection(
    process.env.SOLANA_DEVNET_RPC ?? "https://api.devnet.solana.com",
    "confirmed",
  );
}

export async function getWalletStatus() {
  const keypair = getTestKeypair();
  const pubkey = keypair.publicKey;
  const mainnet = mainnetConnection();
  const devnet = devnetConnection();
  const usdc = new PublicKey(USDC_MINT);

  const [mainSol, devSol, usdcAccounts] = await Promise.all([
    mainnet.getBalance(pubkey),
    devnet.getBalance(pubkey),
    mainnet.getParsedTokenAccountsByOwner(pubkey, { mint: usdc }).catch(() => ({
      value: [],
    })),
  ]);

  let usdcAmount = usdcAccounts.value.reduce((sum, account) => {
    const amount = account.account.data.parsed?.info?.tokenAmount?.uiAmount;
    return sum + (typeof amount === "number" ? amount : 0);
  }, 0);
  if (usdcAmount === 0) {
    usdcAmount = await getTokenUiAmount(pubkey, USDC_MINT, sendConnection());
  }

  return {
    publicKey: pubkey.toBase58(),
    mainnetSol: mainSol / LAMPORTS_PER_SOL,
    devnetSol: devSol / LAMPORTS_PER_SOL,
    mainnetUsdc: usdcAmount,
  };
}

export async function getTokenUiAmount(
  owner: PublicKey | string,
  mint: string,
  connection = sendConnection(),
) {
  const accounts = await connection
    .getParsedTokenAccountsByOwner(new PublicKey(owner), {
      mint: new PublicKey(mint),
    })
    .catch(() => ({ value: [] }));
  return accounts.value.reduce((sum, account) => {
    const amount = account.account.data.parsed?.info?.tokenAmount?.uiAmount;
    return sum + (typeof amount === "number" ? amount : 0);
  }, 0);
}

export async function getTokenRawAmount(
  owner: PublicKey | string,
  mint: string,
  connection = sendConnection(),
) {
  const accounts = await connection
    .getParsedTokenAccountsByOwner(new PublicKey(owner), {
      mint: new PublicKey(mint),
    })
    .catch(() => ({ value: [] }));
  return accounts.value.reduce((sum, account) => {
    const amount = account.account.data.parsed?.info?.tokenAmount?.amount;
    const raw = Number(amount ?? 0);
    return sum + (Number.isFinite(raw) ? raw : 0);
  }, 0);
}

export async function executeServerSwap(quote: JupiterQuote) {
  const keypair = getTestKeypair();
  const connection = sendConnection();
  const { swapTransaction } = await getJupiterSwap({
    quoteResponse: quote,
    userPublicKey: keypair.publicKey.toBase58(),
  });
  const tx = VersionedTransaction.deserialize(Buffer.from(swapTransaction, "base64"));
  tx.sign([keypair]);
  const signature = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });
  await connection.confirmTransaction(signature, "confirmed");
  return signature;
}

export async function getMintBalance(mint: string) {
  return getTokenUiAmount(getTestKeypair().publicKey, mint);
}
