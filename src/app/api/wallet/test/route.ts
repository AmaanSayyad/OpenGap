import {
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { getJupiterQuote } from "@/lib/jupiter";
import { USDC_MINT, WSOL_MINT } from "@/lib/constants";
import { getTape } from "@/lib/prestocks";
import {
  devnetConnection,
  executeServerSwap,
  getMintBalance,
  getTestKeypair,
  getWalletStatus,
} from "@/lib/server-wallet";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { buy?: boolean };
    const keypair = getTestKeypair();
    const status = await getWalletStatus();
    const devnet = devnetConnection();

    let airdropSig: string | null = null;
    if (status.devnetSol < 0.05) {
      airdropSig = await devnet.requestAirdrop(
        keypair.publicKey,
        1 * LAMPORTS_PER_SOL,
      );
      await devnet.confirmTransaction(airdropSig, "confirmed");
    }

    const memo = new TransactionInstruction({
      keys: [{ pubkey: keypair.publicKey, isSigner: true, isWritable: false }],
      programId: new PublicKey("Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo"),
      data: Buffer.from("mark:stocklana-e2e", "utf8"),
    });

    const tx = new Transaction().add(memo);
    tx.feePayer = keypair.publicKey;
    tx.recentBlockhash = (await devnet.getLatestBlockhash("confirmed")).blockhash;
    tx.sign(keypair);
    const memoSig = await devnet.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
    });
    await devnet.confirmTransaction(memoSig, "confirmed");

    const tape = await getTape();
    const target = tape.rows[0];

    let quote: {
      symbol: string;
      mint: string;
      inMint: string;
      inAmount: string;
      outAmount: string;
    } | null = null;
    let buySig: string | null = null;
    let received = 0;

    const usdcLamports = 1_000_000;
    const solLamports = 10_000_000;
    const canUsdc = status.mainnetUsdc >= 1;
    const canSol = status.mainnetSol >= 0.02;

    if (canUsdc || canSol) {
      const inputMint = canUsdc ? USDC_MINT : WSOL_MINT;
      const amount = canUsdc ? usdcLamports : solLamports;
      const jup = await getJupiterQuote({
        inputMint,
        outputMint: target.mint,
        amount,
      });
      quote = {
        symbol: target.symbol,
        mint: target.mint,
        inMint: inputMint,
        inAmount: jup.inAmount,
        outAmount: jup.outAmount,
      };
      if (body.buy) {
        buySig = await executeServerSwap(jup);
        received = await getMintBalance(target.mint);
      }
    }

    const next = await getWalletStatus();
    return Response.json({
      publicKey: keypair.publicKey.toBase58(),
      airdropSig,
      memoSig,
      quote,
      buySig,
      received,
      before: status,
      after: next,
      note: buySig
        ? "Mainnet Jupiter buy confirmed."
        : quote
          ? "Quote ready. POST { buy: true } to sign the swap."
          : "Need ~0.02 SOL or 1 USDC on mainnet to buy.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Wallet test failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
