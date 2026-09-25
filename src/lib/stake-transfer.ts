import {
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { Buffer } from "buffer";
import { STAKING_MINT, STAKING_VAULT, type StakeDays } from "@/lib/staking";

const MEMO = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

export async function sendOpenGapStake(params: {
  connection: Connection;
  owner: PublicKey;
  amount: number;
  days: StakeDays;
  sendTransaction: (transaction: Transaction, connection: Connection) => Promise<string>;
}) {
  const mint = new PublicKey(STAKING_MINT);
  const vault = new PublicKey(STAKING_VAULT);
  const mintInfo = await params.connection.getParsedAccountInfo(mint, "confirmed");
  if (!mintInfo.value) throw new Error("$OPENGAP mint not found");

  const program = mintInfo.value.owner.equals(TOKEN_2022_PROGRAM_ID)
    ? TOKEN_2022_PROGRAM_ID
    : TOKEN_PROGRAM_ID;
  const parsed = mintInfo.value.data;
  const decimals =
    parsed && typeof parsed === "object" && "parsed" in parsed
      ? Number(
          (parsed.parsed as { info?: { decimals?: number } })?.info?.decimals ?? 6,
        )
      : 6;
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 12) {
    throw new Error("Could not read $OPENGAP decimals");
  }

  const raw = toRawAmount(params.amount, decimals);
  if (raw <= BigInt(0)) throw new Error("Enter an amount to lock");

  const source = getAssociatedTokenAddressSync(mint, params.owner, false, program);
  const dest = getAssociatedTokenAddressSync(mint, vault, false, program);
  const destInfo = await params.connection.getAccountInfo(dest, "confirmed");

  const ix: TransactionInstruction[] = [];
  if (!destInfo) {
    ix.push(
      createAssociatedTokenAccountInstruction(
        params.owner,
        dest,
        vault,
        mint,
        program,
      ),
    );
  }
  ix.push(
    createTransferCheckedInstruction(
      source,
      mint,
      dest,
      params.owner,
      raw,
      decimals,
      [],
      program,
    ),
    new TransactionInstruction({
      programId: MEMO,
      keys: [],
      data: Buffer.from(`OPENGAP-STAKE:${params.days}`, "utf8"),
    }),
  );

  const transaction = new Transaction().add(...ix);
  transaction.feePayer = params.owner;
  transaction.recentBlockhash = (
    await params.connection.getLatestBlockhash("confirmed")
  ).blockhash;

  const signature = await params.sendTransaction(transaction, params.connection);
  await params.connection.confirmTransaction(signature, "confirmed");
  return signature;
}

function toRawAmount(amount: number, decimals: number) {
  const [whole, frac = ""] = amount.toFixed(decimals).split(".");
  return BigInt(`${whole}${frac.padEnd(decimals, "0")}`);
}
