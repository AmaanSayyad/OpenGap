"use client";

import { useEffect, useRef, useState } from "react";
import { TradingViewCredit, TradingViewEmbed } from "@/components/tv-embed";
import { TvTapeChart } from "@/components/tv-tape-chart";
import {
  TV_WATCHLIST,
  tradingViewHref,
  tradingViewSymbol,
} from "@/lib/tradingview";

const ADVANCED =
  "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
const CHART_RATIO = 0.74;

export function PriceChart({
  symbol,
  values,
}: {
  symbol: string;
  values?: number[];
}) {
  const tv = tradingViewSymbol(symbol);
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 960, height: 500 });

  useEffect(() => {
    const node = box.current;
    if (!node) return;
    const measure = (target: HTMLDivElement) => {
      const width = Math.max(280, Math.round(target.clientWidth));
      const height = Math.round(
        Math.min(width * CHART_RATIO, window.innerHeight * 0.82),
      );
      setSize((prev) =>
        Math.abs(prev.width - width) < 4 && Math.abs(prev.height - height) < 4
          ? prev
          : { width, height },
      );
    };
    measure(node);
    const observer = new ResizeObserver(() => measure(node));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (!tv) {
    return (
      <div ref={box} className="w-full" style={{ minHeight: size.height }}>
        <TvTapeChart values={values ?? []} height={size.height} />
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Tape prints · TradingView Lightweight Charts. No public ticker for{" "}
          {symbol}.
        </p>
      </div>
    );
  }

  return (
    <div ref={box} className="w-full" style={{ minHeight: size.height }}>
      <TradingViewEmbed
        src={ADVANCED}
        width={size.width}
        height={size.height}
        className="overflow-hidden rounded-xl border border-border/70"
        config={{
          symbol: tv,
          interval: "D",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          backgroundColor: "rgba(19, 23, 34, 1)",
          hide_top_toolbar: false,
          hide_side_toolbar: false,
          hide_legend: false,
          hide_volume: false,
          allow_symbol_change: true,
          save_image: true,
          withdateranges: true,
          details: true,
          hotlist: true,
          calendar: false,
          watchlist: TV_WATCHLIST,
          studies: ["STD;RSI"],
          show_popup_button: true,
          popup_width: "1400",
          popup_height: "900",
          support_host: "https://www.tradingview.com",
        }}
      />
      <TradingViewCredit symbol={symbol} href={tradingViewHref(tv)} />
    </div>
  );
}

export function TradingViewTicker({ height = 46 }: { height?: number }) {
  return (
    <TradingViewEmbed
      src="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js"
      height={height}
      className="overflow-hidden rounded-xl border border-border/70"
      config={{
        symbols: [
          { proName: "BINANCE:SPCXBUSDT", title: "SPCXB" },
          { proName: "BINANCE:OPENAIUSDT.P", title: "OPENAI" },
          { proName: "NASDAQ:AAPL", title: "AAPL" },
          { proName: "NASDAQ:MSFT", title: "MSFT" },
          { proName: "NASDAQ:NVDA", title: "NVDA" },
          { proName: "NASDAQ:TSLA", title: "TSLA" },
          { proName: "AMEX:SPY", title: "SPY" },
          { proName: "BINANCE:SOLUSDT", title: "SOL" },
          { proName: "BINANCE:BTCUSDT", title: "BTC" },
        ],
        showSymbolLogo: true,
        colorTheme: "dark",
        isTransparent: true,
        displayMode: "adaptive",
        locale: "en",
      }}
    />
  );
}
