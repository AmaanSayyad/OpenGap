"use client";

import { useState } from "react";
import { logoNeedsInvert, logoSrc } from "@/lib/logos";
import { cn } from "@/lib/utils";

export function TokenLogo({
  symbol,
  image,
  size = "md",
  framed,
  className,
}: {
  symbol: string;
  image?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  framed?: boolean;
  className?: string;
}) {
  const src = logoSrc(symbol, image);
  const initial = symbol.replace(/^T-/i, "").slice(0, 1).toUpperCase();
  const [broken, setBroken] = useState(false);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden",
        size === "xs" && "size-4",
        size === "sm" && "size-5",
        size === "md" && "size-8",
        size === "lg" && "size-12",
        size === "xl" && "size-14",
        framed && "rounded-2xl bg-muted/80 p-1.5 ring-1 ring-border/70",
        className,
      )}
    >
      {src && !broken ? (
        // Full issuer marks (hex badges, SVGs). Regular img keeps PNG + SVG simple.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          onError={() => setBroken(true)}
          className={cn("size-full object-contain", logoNeedsInvert(symbol) && "dark:invert")}
        />
      ) : (
        <span className="text-[10px] font-semibold text-muted-foreground">{initial}</span>
      )}
    </span>
  );
}
