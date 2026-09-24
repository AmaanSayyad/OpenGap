import { getOpenGapSignal } from "@/lib/opengap-signal";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const signal = await getOpenGapSignal();
    return Response.json(signal);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signal failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
