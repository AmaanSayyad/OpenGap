"use client";

import { useEffect, useRef } from "react";
import { AreaSeries, ColorType, createChart, type UTCTimestamp } from "lightweight-charts";
import { cn } from "@/lib/utils";

export function TvTapeChart({
  values,
  height = 280,
  className,
  mini = false,
}: {
  values: number[];
  height?: number;
  className?: string;
  mini?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null);
  const path = values.length ? values : [0];
  const key = path.join(",");

  useEffect(() => {
    const root = host.current;
    if (!root) return;

    const chart = createChart(root, {
      height,
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(214, 211, 224, 0.72)",
        fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
        attributionLogo: !mini,
      },
      grid: {
        vertLines: { visible: !mini, color: "rgba(255,255,255,0.04)" },
        horzLines: { visible: !mini, color: "rgba(255,255,255,0.04)" },
      },
      rightPriceScale: {
        borderVisible: false,
        visible: !mini,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: !mini,
        visible: !mini,
      },
      handleScroll: !mini,
      handleScale: !mini,
      crosshair: mini
        ? { mode: 2, vertLine: { visible: false }, horzLine: { visible: false } }
        : { horzLine: { labelBackgroundColor: "#1b1724" } },
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: "#9be7b8",
      topColor: "rgba(155, 231, 184, 0.28)",
      bottomColor: "rgba(155, 231, 184, 0.02)",
      lineWidth: 2,
    });

    const now = Math.floor(Date.now() / 1000);
    const points = key.split(",").map(Number);
    series.setData(
      points.map((value, index) => ({
        time: (now - (points.length - 1 - index) * 12) as UTCTimestamp,
        value,
      })),
    );
    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, [height, key]);

  return (
    <div
      ref={host}
      className={cn("overflow-hidden rounded-2xl border border-border/80", className)}
      style={{ height }}
    />
  );
}
