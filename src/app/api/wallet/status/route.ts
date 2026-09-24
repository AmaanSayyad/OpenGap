import { getWalletStatus } from "@/lib/server-wallet";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await getWalletStatus();
    return Response.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Wallet status failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
