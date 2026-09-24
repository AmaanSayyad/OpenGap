import { getTesseraRows } from "@/lib/tessera";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await getTesseraRows();
    return Response.json({ rows, updatedAt: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tessera failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
