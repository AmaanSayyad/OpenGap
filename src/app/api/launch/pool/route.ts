import { createStockPairedPool } from "@/lib/stock-pool";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST() {
  try {
    const local = await createStockPairedPool().catch((error: unknown) => ({
      created: false as const,
      reason: error instanceof Error ? error.message : "Local pool create failed",
    }));

    return Response.json({
      ...local,
      launched: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pool launch failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
