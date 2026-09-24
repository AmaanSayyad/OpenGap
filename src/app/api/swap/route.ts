import { getJupiterSwap, type JupiterQuote } from "@/lib/jupiter";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    quoteResponse?: JupiterQuote;
    userPublicKey?: string;
  };

  if (!body.quoteResponse || !body.userPublicKey) {
    return Response.json({ error: "Missing swap payload" }, { status: 400 });
  }

  try {
    const swap = await getJupiterSwap({
      quoteResponse: body.quoteResponse,
      userPublicKey: body.userPublicKey,
    });
    return Response.json(swap);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Swap failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
