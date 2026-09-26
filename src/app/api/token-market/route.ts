import { getTokenMarket } from "@/lib/token-market";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const market = await getTokenMarket();
    return Response.json(market);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Token market failed" },
      { status: 502 },
    );
  }
}
