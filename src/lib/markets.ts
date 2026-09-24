import { getBasis } from "@/lib/basis";
import { getMeteoraPools } from "@/lib/meteora";
import { getTape } from "@/lib/prestocks";
import { getTesseraRows } from "@/lib/tessera";
import type { MarketsResponse } from "@/lib/types";

export async function getMarkets(): Promise<MarketsResponse> {
  const [tape, tessera, basis, meteora] = await Promise.all([
    getTape().catch(() => null),
    getTesseraRows().catch(() => []),
    getBasis().catch(() => []),
    getMeteoraPools().catch(() => []),
  ]);

  return {
    prestocks: tape?.rows ?? [],
    tessera,
    basis,
    meteora,
    updatedAt: new Date().toISOString(),
  };
}
