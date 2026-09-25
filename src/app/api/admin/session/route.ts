import { isAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ ok: await isAdminSession() });
}
