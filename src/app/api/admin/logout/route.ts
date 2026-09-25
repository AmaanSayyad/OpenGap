import { clearAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  await clearAdminSession();
  return Response.json({ ok: true });
}
