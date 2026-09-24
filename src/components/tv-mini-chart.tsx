"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkline } from "@/components/sparkline";
import { TvTapeChart } from "@/components/tv-tape-chart";
import { tradingViewSymbol } from "@/lib/tradingview";

const SRC =
  "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";

export function TvMiniChart({
  symbol,
  mint,
  values,
  width = 168,
  height = 56,
}: {
  symbol: string;
  mint?: string;
  values?: number[];
  width?: number;
  height?: number;
}) {
  const tv = tradingViewSymbol(symbol);
  const host = useRef<HTMLDivElement>(null);
  const [closes, setCloses] = useState<number[] | null>(null);

  useEffect(() => {
    const root = host.current;
    if (!root || !tv) return;
    root.innerHTML = "";
    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    const script = document.createElement("script");
    script.src = SRC;
    script.async = true;
    script.type = "text/javascript";
    script.textContent = JSON.stringify({
      symbol: tv,
      width,
      height,
      locale: "en",
      dateRange: "1M",
      colorTheme: "dark",
      isTransparent: true,
      autosize: false,
      chartOnly: true,
      noTimeScale: true,
    });
    root.appendChild(widget);
    root.appendChild(script);
    return () => {
      root.innerHTML = "";
    };
  }, [height, tv, width]);

  useEffect(() => {
    if (tv) return;
    const query = new URLSearchParams({ symbol });
    if (mint) query.set("mint", mint);
    let cancelled = false;
    fetch(`/api/ohlc?${query}`)
      .then((response) => response.json())
      .then((body: { points?: { value: number }[] }) => {
        if (cancelled) return;
        const series = (body.points ?? []).map((point) => point.value);
        setCloses(series.length > 1 ? series : null);
      })
      .catch(() => {
        if (!cancelled) setCloses(null);
      });
    return () => {
      cancelled = true;
    };
  }, [mint, symbol, tv]);

  if (tv) {
    return (
      <div
        ref={host}
        className="tradingview-widget-container overflow-hidden"
        style={{ width, height }}
      />
    );
  }

  const series = closes ?? values ?? [];
  if (series.length > 1) {
    return (
      <div style={{ width, height }}>
        <TvTapeChart
          values={series}
          height={height}
          mini
          className="rounded-none border-0"
        />
      </div>
    );
  }

  return <Sparkline values={values ?? []} />;
}
