import { TOKEN_MINT } from "@/lib/company";
import { JUPITER_PRICE_API } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch(`${JUPITER_PRICE_API}?ids=${TOKEN_MINT}`, {
      cache: "no-store",
    });
    const payload = (await response.json()) as Record<string, { usdPrice?: number }>;
    const price = Number(payload[TOKEN_MINT]?.usdPrice);
    return Response.json({
      price: Number.isFinite(price) && price > 0 ? price : null,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Price failed", price: null },
      { status: 502 },
    );
  }
}
