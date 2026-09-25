import { getBasis } from "@/lib/basis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const basis = await getBasis();
    return Response.json({ basis, updatedAt: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Basis failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
