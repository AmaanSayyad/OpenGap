import { Connection, PublicKey } from "@solana/web3.js";
import { JUPITER_PRICE_API, USDC_MINT, WSOL_MINT } from "@/lib/constants";
import type { TapeRow } from "@/lib/types";

const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const TOKEN_2022 = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const ASSOCIATED = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

export type Holding = {
  symbol: string;
  name: string;
  image?: string | null;
  mint: string;
  uiAmount: number;
  tapeValue: number;
  markValue: number;
  issuer: "prestocks" | "tessera" | "cash" | "xstock" | "ondo";
};

function ata(owner: PublicKey, mint: PublicKey, program: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), program.toBuffer(), mint.toBuffer()],
    ASSOCIATED,
  )[0];
}

function parsedUi(data: unknown) {
  if (!data || typeof data !== "object" || !("parsed" in data)) return 0;
  const amount = Number(
    (data.parsed as { info?: { tokenAmount?: { uiAmount?: number } } })?.info
      ?.tokenAmount?.uiAmount,
  );
  return Number.isFinite(amount) ? amount : 0;
}

async function readAta(
  connection: Connection,
  owner: PublicKey,
  mint: PublicKey,
) {
  const info = await connection.getAccountInfo(mint, "confirmed");
  const program = info?.owner.equals(TOKEN_2022) ? TOKEN_2022 : TOKEN_PROGRAM;
  const address = ata(owner, mint, program);
  const parsed = await connection.getParsedAccountInfo(address, "confirmed");
  return parsedUi(parsed.value?.data);
}

async function readSolPrice() {
  try {
    const response = await fetch(`${JUPITER_PRICE_API}?ids=${WSOL_MINT}`, {
      cache: "no-store",
    });
    const payload = (await response.json()) as Record<string, { usdPrice?: number }>;
    const usd = Number(payload[WSOL_MINT]?.usdPrice);
    if (Number.isFinite(usd) && usd > 0) return usd;
  } catch {
    /* try Binance public ticker */
  }
  try {
    const response = await fetch(
      "https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT",
      { cache: "no-store" },
    );
    const payload = (await response.json()) as { price?: string };
    const usd = Number(payload.price);
    if (Number.isFinite(usd) && usd > 0) return usd;
  } catch {
    /* no quote */
  }
  return 0;
}

export async function readHoldings(
  connection: Connection,
  owner: string,
  rows: TapeRow[],
): Promise<{
  owner: string;
  sol: number;
  solPrice: number;
  solValue: number;
  usdc: number;
  positions: Holding[];
}> {
  const ownerKey = new PublicKey(owner);
  const [lamports, usdc, solPrice] = await Promise.all([
    connection.getBalance(ownerKey, "confirmed"),
    readAta(connection, ownerKey, new PublicKey(USDC_MINT)),
    readSolPrice(),
  ]);
  const sol = lamports / 1e9;
  const solValue = sol * solPrice;

  const tokens = await Promise.all(
    rows.map(async (row): Promise<Holding | null> => {
      try {
        const uiAmount = await readAta(connection, ownerKey, new PublicKey(row.mint));
        if (uiAmount < 0.0001) return null;
        return {
          symbol: row.symbol,
          name: row.name,
          image: row.image ?? null,
          mint: row.mint,
          uiAmount,
          tapeValue: uiAmount * row.execPrice,
          markValue: uiAmount * row.markPrice,
          issuer: row.issuer === "tessera" ? "tessera" : "prestocks",
        };
      } catch {
        return null;
      }
    }),
  );
  const positions: Holding[] = tokens.filter((row) => row !== null);

  if (usdc > 0) {
    positions.unshift({
      symbol: "USDC",
      name: "USD Coin",
      image: null,
      mint: USDC_MINT,
      uiAmount: usdc,
      tapeValue: usdc,
      markValue: usdc,
      issuer: "cash",
    });
  }

  return { owner, sol, solPrice, solValue, usdc, positions };
}
