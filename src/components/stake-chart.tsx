"use client";

import { useState } from "react";
import { Eyebrow, Panel, Segmented } from "@/components/ui-kit";
import {
  TOKEN_DEXSCREENER,
  TOKEN_DEXSCREENER_EMBED,
  TOKEN_GMGN,
  TOKEN_GMGN_EMBED,
} from "@/lib/company";

type ChartId = "dex" | "gmgn";

export function StakeChart() {
  const [chart, setChart] = useState<ChartId>("dex");
  const src = chart === "dex" ? TOKEN_DEXSCREENER_EMBED : TOKEN_GMGN_EMBED;
  const href = chart === "dex" ? TOKEN_DEXSCREENER : TOKEN_GMGN;

  return (
    <Panel className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Eyebrow>$OPENGAP chart</Eyebrow>
          <p className="mt-1 text-sm text-muted-foreground">
            PumpSwap OPENGAP/SOL. DexScreener or GMGN.
          </p>
        </div>
        <Segmented
          value={chart}
          onChange={setChart}
          options={[
            { id: "dex", label: "DexScreener" },
            { id: "gmgn", label: "GMGN" },
          ]}
        />
      </div>
      <div
        id="dexscreener-embed"
        className="relative w-full overflow-hidden rounded-2xl pb-[125%] min-[1400px]:pb-[65%]"
      >
        <iframe
          key={src}
          src={src}
          title={chart === "dex" ? "DexScreener $OPENGAP" : "GMGN $OPENGAP"}
          className="absolute top-0 left-0 h-full w-full border-0"
        />
      </div>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-xs text-muted-foreground underline-offset-4 hover:underline"
      >
        Open {chart === "dex" ? "DexScreener" : "GMGN"}
      </a>
    </Panel>
  );
}
