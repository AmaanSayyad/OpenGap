import { StakeView } from "@/components/stake-view";
import { mainnetConnection } from "@/lib/server-wallet";
import { readVaultTotal } from "@/lib/stake-ledger";

export const dynamic = "force-dynamic";

export default async function StakePage() {
  const amount = await readVaultTotal(mainnetConnection()).catch(() => null);
  return <StakeView totalStaked={amount} />;
}
