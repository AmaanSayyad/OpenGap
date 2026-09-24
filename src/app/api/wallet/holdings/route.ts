import { getTape } from "@/lib/prestocks";
import { getTesseraRows } from "@/lib/tessera";
import { readHoldings } from "@/lib/holdings";
import { getTestKeypair, mainnetConnection } from "@/lib/server-wallet";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const wanted = new URL(request.url).searchParams.get("owner");
    const owner = wanted || getTestKeypair().publicKey.toBase58();
    const [tape, tessera] = await Promise.all([
      getTape(),
      getTesseraRows().catch(() => []),
    ]);
    const book = await readHoldings(mainnetConnection(), owner, [
      ...tape.rows,
      ...tessera,
    ]);
    return Response.json({ ...book, updatedAt: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Holdings failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
