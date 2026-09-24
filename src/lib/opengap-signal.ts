import { OPEN_GAP_MIN_GAP } from "@/lib/opengap-skill";
import { getTape } from "@/lib/prestocks";
import { getTesseraRows } from "@/lib/tessera";
import type { TapeRow } from "@/lib/types";

export type SignalName = {
  symbol: string;
  name: string;
  mint: string;
  issuer: string;
  tape: number;
  mark: number;
  gap: number;
  liquidity: number | null;
};

export type OpenGapSignal = {
  updatedAt: string;
  minGap: number;
  fillUsdc: number;
  buy: SignalName[];
  tape: SignalName[];
};

export async function getOpenGapSignal(): Promise<OpenGapSignal> {
  const [tape, tessera] = await Promise.all([
    getTape(),
    getTesseraRows().catch(() => [] as TapeRow[]),
  ]);
  const rows = [...tape.rows, ...tessera]
    .map(toName)
    .sort((a, b) => a.gap - b.gap);

  return {
    updatedAt: new Date().toISOString(),
    minGap: OPEN_GAP_MIN_GAP,
    fillUsdc: 5,
    buy: rows.filter((row) => row.gap <= OPEN_GAP_MIN_GAP && row.mark > 0),
    tape: rows,
  };
}

export function signalBrief(signal: OpenGapSignal) {
  const lines = signal.tape
    .slice(0, 12)
    .map(
      (row) =>
        `${row.symbol} mint=${row.mint} tape=${row.tape.toFixed(4)} mark=${row.mark.toFixed(4)} gap=${(row.gap * 100).toFixed(1)}%`,
    )
    .join("\n");

  const buys = signal.buy.length
    ? signal.buy
        .map((row) => `${row.symbol} ${(row.gap * 100).toFixed(1)}%`)
        .join(", ")
    : "none";

  return `Run the OpenGap basis skill. Do not launch a token.

Buys at or under ${(signal.minGap * 100).toFixed(0)}%: ${buys}
Fill size: ${signal.fillUsdc} USDC. Max inventory 15 USDC.

Tape
${lines}

If nothing is cheap enough, hold and report the tape.`;
}

function toName(row: TapeRow): SignalName {
  return {
    symbol: row.symbol,
    name: row.name,
    mint: row.mint,
    issuer: row.issuer ?? "prestocks",
    tape: row.execPrice,
    mark: row.markPrice,
    gap: row.premium,
    liquidity: row.liquidity,
  };
}
