import { CLAWPUMP_AGENT_ID, chatAgent } from "@/lib/clawpump";
import { getOpenGapSignal, signalBrief } from "@/lib/opengap-signal";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = request.headers.get("authorization");
    if (header !== `Bearer ${secret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const signal = await getOpenGapSignal();
    if (!signal.buy.length) {
      return Response.json({ skipped: true, signal, launched: false });
    }
    const chat = await chatAgent(CLAWPUMP_AGENT_ID, signalBrief(signal));
    return Response.json({
      skipped: false,
      buy: signal.buy.map((row) => row.symbol),
      chat: { content: chat.content.slice(0, 1200), cost: chat.cost },
      launched: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tick failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
