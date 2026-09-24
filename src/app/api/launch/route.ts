import { getLaunchCost } from "@/lib/clawpump";
import { getDbcStatus, getMeteoraPools } from "@/lib/meteora";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [pools, dbc] = await Promise.all([getMeteoraPools(), getDbcStatus()]);
    return Response.json({ pools, dbc, updatedAt: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Launch desk failed";
    return Response.json({ error: message }, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      symbol?: string;
      description?: string;
      quoteMint?: string;
      quoteSymbol?: string;
    };

    const draft = {
      name: body.name ?? "Opengap TSLA Pool",
      symbol: body.symbol ?? "MTSLA",
      description:
        body.description ??
        "Stock-quoted launch draft. Clawpump + Meteora DBC. Not a live mint until signed.",
      quoteMint: body.quoteMint ?? "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
      quoteSymbol: body.quoteSymbol ?? "TSLAx",
    };

    const [cost, pools, dbc] = await Promise.all([
      getLaunchCost(draft.quoteMint),
      getMeteoraPools(),
      getDbcStatus(),
    ]);

    return Response.json({
      draft,
      launched: false,
      cost,
      pools,
      dbc,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Launch failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
