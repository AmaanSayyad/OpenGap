import { armOpenGapAgent } from "@/lib/clawpump-arm";
import {
  CLAWPUMP_AGENT_ID,
  chatAgent,
  getClawpumpDesk,
  getLaunchCost,
  listAgentMessages,
  startAgent,
  stopAgent,
} from "@/lib/clawpump";
import { getOpenGapSignal, signalBrief } from "@/lib/opengap-signal";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET() {
  try {
    const [desk, signal, messages] = await Promise.all([
      getClawpumpDesk(),
      getOpenGapSignal().catch(() => null),
      listAgentMessages(CLAWPUMP_AGENT_ID, 6).catch(() => []),
    ]);
    return Response.json({
      ...desk,
      signal,
      messages,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ClawPump failed";
    return Response.json({ error: message, configured: false }, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
      quoteMint?: string;
    };

    if (body.action === "start") {
      const agent = await startAgent(CLAWPUMP_AGENT_ID);
      return Response.json({ agent });
    }
    if (body.action === "stop") {
      const agent = await stopAgent(CLAWPUMP_AGENT_ID);
      return Response.json({ agent });
    }
    if (body.action === "cost") {
      const cost = await getLaunchCost(body.quoteMint);
      return Response.json({ cost, launched: false });
    }
    if (body.action === "arm") {
      const armed = await armOpenGapAgent();
      return Response.json(armed);
    }
    if (body.action === "tick") {
      const signal = await getOpenGapSignal();
      if (!signal.buy.length) {
        return Response.json({ signal, skipped: true, launched: false });
      }
      const chat = await chatAgent(CLAWPUMP_AGENT_ID, signalBrief(signal));
      return Response.json({ signal, chat, launched: false });
    }

    return Response.json(
      { error: "Unknown action. Use start, stop, cost, arm, or tick." },
      { status: 400 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "ClawPump failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
