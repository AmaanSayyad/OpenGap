"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function TradingViewEmbed({
  src,
  config,
  height,
  width,
  className,
}: {
  src: string;
  config: Record<string, unknown>;
  height: number;
  width?: number;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const frameWidth = width ?? "100%";
  const payload = JSON.stringify({
    ...config,
    autosize: false,
    width: frameWidth,
    height,
  });

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    root.innerHTML = "";
    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    widget.style.width = typeof frameWidth === "number" ? `${frameWidth}px` : "100%";
    widget.style.height = `${height}px`;
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.type = "text/javascript";
    script.textContent = payload;
    root.appendChild(widget);
    root.appendChild(script);
    return () => {
      root.innerHTML = "";
    };
  }, [frameWidth, height, payload, src]);

  return (
    <div
      className={cn("bg-[#131722]", className)}
      style={{
        minHeight: height,
        height,
        width: typeof frameWidth === "number" ? frameWidth : "100%",
      }}
    >
      <div
        ref={host}
        className="tradingview-widget-container"
        style={{
          minHeight: height,
          height,
          width: typeof frameWidth === "number" ? frameWidth : "100%",
        }}
      />
    </div>
  );
}

export function TradingViewCredit({
  symbol,
  href,
}: {
  symbol: string;
  href: string;
}) {
  return (
    <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline-offset-2 hover:underline"
      >
        {symbol} chart
      </a>{" "}
      by TradingView
    </p>
  );
}
