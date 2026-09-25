"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { NavSearch } from "@/components/nav-search";
import { TickerTape } from "@/components/ticker-tape";
import { useTour } from "@/components/product-tour";
import { WalletButton } from "@/components/wallet-button";
import { BRAND, TAGLINE } from "@/lib/brand";
import type { TapeRow } from "@/lib/types";

export function SiteHeader({
  onBasket,
  ticker,
}: {
  onBasket?: () => void;
  ticker?: TapeRow[];
}) {
  const tour = useTour();
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-3 sm:h-16 sm:gap-3 sm:px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 sm:gap-3">
          <BrandLogo size={40} className="size-9 sm:size-10" priority />
          <span className="hidden text-lg font-semibold tracking-tight min-[380px]:inline">
            {BRAND}
          </span>
          <span className="hidden text-sm text-muted-foreground xl:block">
            {TAGLINE}
          </span>
        </Link>
        <NavSearch rows={ticker} />
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Link
            href="/portfolio"
            data-tour="portfolio"
            className="inline-flex h-8 items-center rounded-full px-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:px-3"
          >
            Portfolio
          </Link>
          <Link
            href="/stake"
            className="inline-flex h-8 items-center rounded-full px-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:px-3"
          >
            Stake
          </Link>
          <button
            type="button"
            onClick={tour.start}
            className="hidden h-8 rounded-full px-3 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex sm:items-center"
          >
            Guide
          </button>
          {onBasket ? (
            <button
              type="button"
              onClick={onBasket}
              className="hidden h-8 rounded-full px-3 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex sm:items-center"
            >
              Buy all
            </button>
          ) : null}
          <div data-tour="connect">
            <WalletButton />
          </div>
        </div>
      </div>
      <TickerTape rows={ticker} />
    </header>
  );
}
