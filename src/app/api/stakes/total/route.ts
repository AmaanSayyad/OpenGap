import { mainnetConnection } from "@/lib/server-wallet";
import { readVaultTotal } from "@/lib/stake-ledger";
import { STAKING_VAULT } from "@/lib/staking";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const amount = await readVaultTotal(mainnetConnection());
    return Response.json({ amount, vault: STAKING_VAULT });
  } catch (error) {
    return Response.json(
      {
        amount: null,
        vault: STAKING_VAULT,
        error: error instanceof Error ? error.message : "Vault total failed",
      },
      { status: 502 },
    );
  }
}
