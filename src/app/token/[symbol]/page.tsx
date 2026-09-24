import { TokenView } from "@/components/token-view";

export default async function TokenPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  return <TokenView symbol={symbol} />;
}
