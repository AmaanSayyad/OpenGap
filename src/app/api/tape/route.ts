import { getTape } from "@/lib/prestocks";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tape = await getTape();
    return Response.json(tape);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tape failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
