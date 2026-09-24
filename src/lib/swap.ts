import { VersionedTransaction } from "@solana/web3.js";
import type { Connection } from "@solana/web3.js";
import type { JupiterQuote } from "@/lib/jupiter";

function fromBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function requestQuote(inputMint: string, outputMint: string, amount: number) {
  const search = new URLSearchParams({
    inputMint,
    outputMint,
    amount: String(amount),
  });
  const response = await fetch(`/api/quote?${search.toString()}`);
  const payload = (await response.json()) as JupiterQuote & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Quote failed");
  return payload;
}

export async function executeSwap(params: {
  quote: JupiterQuote;
  publicKey: string;
  signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>;
  connection: Connection;
}) {
  const response = await fetch("/api/swap", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      quoteResponse: params.quote,
      userPublicKey: params.publicKey,
    }),
  });
  const payload = (await response.json()) as {
    swapTransaction?: string;
    error?: string;
  };
  if (!response.ok || !payload.swapTransaction) {
    throw new Error(payload.error ?? "Swap build failed");
  }

  const tx = VersionedTransaction.deserialize(fromBase64(payload.swapTransaction));
  const signed = await params.signTransaction(tx);
  const signature = await params.connection.sendRawTransaction(signed.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  });
  await params.connection.confirmTransaction(signature, "confirmed");
  return signature;
}
