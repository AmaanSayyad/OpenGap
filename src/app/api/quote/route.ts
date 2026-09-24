import { getJupiterQuote } from "@/lib/jupiter";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const inputMint = searchParams.get("inputMint");
  const outputMint = searchParams.get("outputMint");
  const amount = Number(searchParams.get("amount"));

  if (!inputMint || !outputMint || !Number.isFinite(amount) || amount <= 0) {
    return Response.json({ error: "Invalid quote request" }, { status: 400 });
  }

  try {
    const quote = await getJupiterQuote({ inputMint, outputMint, amount });
    return Response.json(quote);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Quote failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
