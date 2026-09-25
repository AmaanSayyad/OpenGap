import { adminPassword, passwordsMatch, setAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const expected = adminPassword();
  if (!expected) {
    return Response.json({ error: "ADMIN_PASSWORD is not set" }, { status: 503 });
  }
  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  if (!passwordsMatch(String(body?.password ?? ""), expected)) {
    return Response.json({ error: "Wrong password" }, { status: 401 });
  }
  await setAdminSession();
  return Response.json({ ok: true });
}
