import { GITHUB_URL, SITE_URL, TELEGRAM_URL, X_URL } from "@/lib/brand";
import { POOL_URL, TOKEN_URL } from "@/lib/company";
import type { Desk } from "@/lib/tour";

export const DESK_LINKS: Array<{
  id: Desk;
  label: string;
  href: string;
  hint: string;
}> = [
  { id: "prestocks", label: "PreStocks", href: "/?desk=prestocks", hint: "Private companies" },
  { id: "tessera", label: "Tessera", href: "/?desk=tessera", hint: "Loan tokens" },
  { id: "basis", label: "Listed stocks", href: "/?desk=basis", hint: "Cash vs on-chain" },
  { id: "launch", label: "Launch", href: "/?desk=launch", hint: "The OpenGap agent" },
];

export const FOOTER_LINKS = {
  product: [
    { label: "Portfolio", href: "/portfolio" },
    { label: "Guide", href: "/?tour=1" },
    { label: "Buy all", href: "/?desk=prestocks" },
    { label: "Live", href: SITE_URL },
    { label: "GitHub", href: GITHUB_URL },
    { label: "X", href: X_URL },
    { label: "Telegram", href: TELEGRAM_URL },
    { label: "$OPENGAP", href: TOKEN_URL },
    { label: "Pool", href: POOL_URL },
  ],
  venues: [
    { label: "Jupiter", href: "https://jup.ag", logo: "/logos/jupiter.png" },
    { label: "Meteora", href: POOL_URL, logo: "/logos/meteora-mark.png" },
    { label: "PreStocks", href: "https://prestocks.com", logo: "/logos/prestocks.png" },
    { label: "Tessera", href: "https://www.tessera.pe", logo: "/logos/tessera.png" },
    { label: "Solana", href: "https://solana.com", logo: "/logos/sol.png" },
  ],
};

export function isDesk(value: string | null): value is Desk {
  return (
    value === "prestocks" ||
    value === "tessera" ||
    value === "basis" ||
    value === "launch"
  );
}
