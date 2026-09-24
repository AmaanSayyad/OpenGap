import { getBasis } from "@/lib/basis";
import { getBinanceStatus } from "@/lib/binance";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [basis, binance] = await Promise.all([
      getBasis(),
      getBinanceStatus().catch((error) => ({
        signed: false,
        signedStatus: 0,
        signedError: error instanceof Error ? error.message : "Binance failed",
        canTrade: false,
        balances: [],
        usdcUsd: null,
        btcUsd: null,
        note: error instanceof Error ? error.message : "Binance failed",
      })),
    ]);
    return Response.json({ basis, binance, updatedAt: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Basis failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
