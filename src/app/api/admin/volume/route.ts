import { isAdminSession } from "@/lib/admin-auth";
import { readPlatformVolume } from "@/lib/platform-volume";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdminSession())) {
    return Response.json({ error: "Admin sign-in required" }, { status: 401 });
  }
  try {
    const volume = await readPlatformVolume();
    return Response.json(volume);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Volume failed" },
      { status: 502 },
    );
  }
}
