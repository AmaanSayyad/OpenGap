import { isAdminSession } from "@/lib/admin-auth";
import { mainnetConnection } from "@/lib/server-wallet";
import {
  cachedStakes,
  readVaultStakes,
  rememberStake,
} from "@/lib/stake-ledger";
import type { StakeRecord } from "@/lib/staking";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const wallet = new URL(request.url).searchParams.get("wallet")?.trim() || null;
  if (!wallet && !(await isAdminSession())) {
    return Response.json({ error: "Admin sign-in required" }, { status: 401 });
  }
  try {
    const rows = await readVaultStakes(mainnetConnection());
    return Response.json({
      stakes: wallet ? rows.filter((row) => row.wallet === wallet) : rows,
    });
  } catch (error) {
    const fallback = cachedStakes();
    return Response.json({
      stakes: wallet ? fallback.filter((row) => row.wallet === wallet) : fallback,
      error: error instanceof Error ? error.message : "Stake book failed",
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as StakeRecord;
    rememberStake(body);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Stake save failed" },
      { status: 400 },
    );
  }
}
