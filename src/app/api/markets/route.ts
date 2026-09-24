import { getMarkets } from "@/lib/markets";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const markets = await getMarkets();
    return Response.json(markets);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Markets failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
