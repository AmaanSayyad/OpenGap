import { getOhlc } from "@/lib/ohlc";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol")?.trim() ?? "";
  const mint = url.searchParams.get("mint")?.trim() || undefined;
  if (!symbol && !mint) {
    return Response.json({ error: "symbol required" }, { status: 400 });
  }
  try {
    const points = await getOhlc(symbol, mint);
    return Response.json({ points });
  } catch (error) {
    const message = error instanceof Error ? error.message : "OHLC failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
