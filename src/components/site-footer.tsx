import Link from "next/link";
import {
  BookOpen,
  Bot,
  CandlestickChart,
  Layers,
  Lock,
  Scale,
  ShoppingBasket,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { BRAND, TAGLINE } from "@/lib/brand";
import { TOKEN_MINT, TOKEN_SOLSCAN, TOKEN_SYMBOL } from "@/lib/company";
import { DESK_LINKS, FOOTER_LINKS } from "@/lib/nav";

const DESK_ICONS = {
  prestocks: CandlestickChart,
  tessera: Layers,
  basis: Scale,
  launch: Bot,
} as const;

const PRODUCT_ICONS: Record<string, LucideIcon> = {
  Portfolio: Wallet,
  Stake: Lock,
  Guide: BookOpen,
  "Buy all": ShoppingBasket,
};

function FooterMark({ src }: { src: string }) {
  if (src.endsWith(".svg")) {
    return (
      <span
        aria-hidden
        className="inline-block size-3.5 bg-current"
        style={{
          maskImage: `url(${src})`,
          WebkitMaskImage: `url(${src})`,
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
          maskSize: "contain",
          WebkitMaskSize: "contain",
        }}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={14} height={14} className="size-3.5 object-contain" />
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-background">
      <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <BrandLogo size={32} />
              <span className="text-sm font-semibold tracking-tight">{BRAND}</span>
            </Link>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{TAGLINE}.</p>
          </div>
          <nav className="flex flex-wrap gap-2" aria-label="Product">
            {FOOTER_LINKS.product.map((item) => {
              const Icon = PRODUCT_ICONS[item.label];
              const className =
                "inline-flex h-8 items-center gap-1.5 rounded-full bg-muted px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground";
              const mark = item.logo ? (
                <FooterMark src={item.logo} />
              ) : Icon ? (
                <Icon className="size-3.5" aria-hidden />
              ) : null;
              return item.href.startsWith("http") ? (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className={className}
                >
                  {mark}
                  {item.label}
                </a>
              ) : (
                <Link key={item.href} href={item.href} className={className}>
                  {mark}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <nav aria-label="Desks">
          <p className="text-xs font-medium text-muted-foreground">Desks</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {DESK_LINKS.map((item) => {
              const Icon = DESK_ICONS[item.id];
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-muted/60"
                  >
                    <span className="inline-flex size-8 items-center justify-center rounded-xl bg-muted text-foreground">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-sm font-medium">{item.label}</span>
                      <span className="block text-xs text-muted-foreground">{item.hint}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div>
          <p className="text-xs font-medium text-muted-foreground">Works with</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {FOOTER_LINKS.venues.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-border/70 bg-background px-3 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.logo} alt="" width={24} height={24} className="size-6 object-contain" />
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-3 px-4 py-4 text-xs text-muted-foreground sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-medium">${TOKEN_SYMBOL} CA</p>
            <a
              href={TOKEN_SOLSCAN}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 flex min-w-0 overflow-x-auto rounded-xl bg-muted/70 px-3 py-2 font-mono text-[11px] leading-none text-foreground/90 hover:text-foreground sm:text-xs"
            >
              <span className="whitespace-nowrap">{TOKEN_MINT}</span>
            </a>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="inline-flex items-center gap-2">
              © 2026 {BRAND}
              <span aria-hidden>·</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/sol.png" alt="" width={14} height={14} className="size-3.5 object-contain" />
              Mainnet Solana
            </p>
            <p>1% platform fee on Jupiter buys and sells. Not for US persons. Not advice.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
