import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { PLATFORM_FEE_WALLET, USDC_MINT, WSOL_MINT } from "@/lib/constants";
import type { JupiterQuote } from "@/lib/jupiter";
import { getTestKeypair, sendConnection } from "@/lib/server-wallet";

export function getPlatformFeeWallet() {
  return new PublicKey(PLATFORM_FEE_WALLET);
}

export function feeMintForQuote(inputMint: string, outputMint: string) {
  if (inputMint === USDC_MINT || outputMint === USDC_MINT) return USDC_MINT;
  if (inputMint === WSOL_MINT || outputMint === WSOL_MINT) return WSOL_MINT;
  return outputMint;
}

async function tokenProgramOf(mint: PublicKey) {
  const info = await sendConnection().getAccountInfo(mint, "confirmed");
  if (info?.owner.equals(TOKEN_2022_PROGRAM_ID)) return TOKEN_2022_PROGRAM_ID;
  return TOKEN_PROGRAM_ID;
}

export async function ensurePlatformFeeAccount(mint: string) {
  const owner = getPlatformFeeWallet();
  const mintKey = new PublicKey(mint);
  const programId = await tokenProgramOf(mintKey);
  const ata = getAssociatedTokenAddressSync(
    mintKey,
    owner,
    false,
    programId,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  const connection = sendConnection();
  const existing = await connection.getAccountInfo(ata, "confirmed");
  if (existing) return ata.toBase58();

  const payer = getTestKeypair();
  const tx = new Transaction().add(
    createAssociatedTokenAccountIdempotentInstruction(
      payer.publicKey,
      ata,
      owner,
      mintKey,
      programId,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    ),
  );
  tx.feePayer = payer.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash("confirmed")).blockhash;
  await sendAndConfirmTransaction(connection, tx, [payer], {
    commitment: "confirmed",
    maxRetries: 5,
  });
  return ata.toBase58();
}

export async function resolvePlatformFeeAccount(quote: JupiterQuote) {
  const preferred = feeMintForQuote(quote.inputMint, quote.outputMint);
  return ensurePlatformFeeAccount(preferred);
}
