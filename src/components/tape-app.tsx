"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BasketSheet } from "@/components/basket-sheet";
import { BasisDesk } from "@/components/basis-desk";
import { BuySheet } from "@/components/buy-sheet";
import { ClaimSplit } from "@/components/claim-split";
import { CompareStrip } from "@/components/compare-strip";
import { FillHistory } from "@/components/fill-history";
import { HoldingsBook } from "@/components/holdings-book";
import { LaunchDesk } from "@/components/launch-desk";
import { PriceChart } from "@/components/price-chart";
import { PrintFeed } from "@/components/print-feed";
import { ResearchGrid } from "@/components/research-grid";
import { SessionMovers } from "@/components/session-movers";
import { SiteHeader } from "@/components/site-header";
import { TapeHeatmap } from "@/components/tape-heatmap";
import { TapePulse } from "@/components/tape-pulse";
import { TokenLogo } from "@/components/token-logo";
import { TapeTable, type TapeSort } from "@/components/tape-table";
import { TradeRail } from "@/components/trade-rail";
import { WalletDesk } from "@/components/wallet-desk";
import { WatchRail } from "@/components/watch-rail";
import { TourHint } from "@/components/product-tour";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eyebrow,
  PageTitle,
  Panel,
  SectionTitle,
  Segmented,
} from "@/components/ui-kit";
import { GAP_ALERT_IMPROVE, useGapAlerts } from "@/hooks/use-gap-alerts";
import { usePrintHistory } from "@/hooks/use-print-history";
import { useTapeFeed } from "@/hooks/use-tape-feed";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useLastFill } from "@/hooks/use-last-fill";
import { exportTapeCsv } from "@/lib/export-tape";
import { deskQueryValue, parseDesk } from "@/lib/desk";
import { deepestDiscount, widestPremium } from "@/lib/metrics";
import { formatPct, formatPrice } from "@/lib/format";
import { TOUR_DESK_EVENT, type Desk } from "@/lib/tour";
import type { TapeResponse, TapeRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Filter = "all" | "discount" | "premium" | "watch";

const DESKS: Array<{ id: Desk; label: string }> = [
  { id: "prestocks", label: "PreStocks" },
  { id: "tessera", label: "Tessera" },
  { id: "basis", label: "Listed stocks" },
  { id: "launch", label: "ClawPump" },
];

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "discount", label: "Discount" },
  { id: "premium", label: "Premium" },
  { id: "watch", label: "Watch" },
];

export function TapeApp({ initial }: { initial?: TapeResponse }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { tape, tessera, error, left, moves, flash } = useTapeFeed(initial);
  const allRows = useMemo(
    () => [...(tape?.rows ?? []), ...tessera],
    [tape, tessera],
  );
  const prints = usePrintHistory(allRows);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<TapeSort>("gap");
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("all");
  const [desk, setDesk] = useState<Desk>(() => parseDesk(searchParams.get("desk")));
  const [picked, setPicked] = useState<TapeRow | null>(null);
  const [buyRow, setBuyRow] = useState<TapeRow | null>(null);
  const [compare, setCompare] = useState<string[]>([]);
  const [basketOpen, setBasketOpen] = useState(false);
  const watchlist = useWatchlist();
  const gapAlerts = useGapAlerts();
  const lastFill = useLastFill();
  const [bookRefresh, setBookRefresh] = useState(0);
  const openedBuy = useRef(false);

  const changeDesk = useCallback(
    (next: Desk) => {
      setDesk(next);
      const params = new URLSearchParams(searchParams.toString());
      const value = deskQueryValue(next);
      if (value) params.set("desk", value);
      else params.delete("desk");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    function onDesk(event: Event) {
      const next = (event as CustomEvent<Desk>).detail;
      if (next) changeDesk(next);
    }
    window.addEventListener(TOUR_DESK_EVENT, onDesk);
    return () => window.removeEventListener(TOUR_DESK_EVENT, onDesk);
  }, [changeDesk]);

  const cheap = tape ? deepestDiscount(tape.rows) : null;
  const rich = tape ? widestPremium(tape.rows) : null;
  const tessCheap = tessera.length ? deepestDiscount(tessera) : null;

  const selected = useMemo(() => {
    if (!picked) return null;
    return (
      tape?.rows.find((row) => row.mint === picked.mint) ??
      tessera.find((row) => row.mint === picked.mint) ??
      picked
    );
  }, [picked, tape, tessera]);

  const sectors = useMemo(() => {
    const source = desk === "tessera" ? tessera : (tape?.rows ?? []);
    const names = new Set<string>();
    for (const row of source) {
      if (row.sector) names.add(row.sector);
    }
    return [...names].sort();
  }, [desk, tape, tessera]);

  const rows = useMemo(() => {
    if (!tape) return [];
    return filterRows(tape.rows, {
      filter,
      query,
      sector,
      sort,
      watched: watchlist.symbols,
    });
  }, [filter, query, sector, sort, tape, watchlist.symbols]);

  const tesseraRows = useMemo(
    () =>
      filterRows(tessera, {
        filter,
        query,
        sector,
        sort,
        watched: watchlist.symbols,
      }),
    [filter, query, sector, sort, tessera, watchlist.symbols],
  );

  const watchedRows = useMemo(
    () => allRows.filter((row) => watchlist.symbols.includes(row.symbol)),
    [allRows, watchlist.symbols],
  );

  const compareRows = useMemo(
    () =>
      compare
        .map(
          (symbol) =>
            tape?.rows.find((row) => row.symbol === symbol) ??
            tessera.find((row) => row.symbol === symbol),
        )
        .filter((row): row is TapeRow => Boolean(row)),
    [compare, tape, tessera],
  );

  useEffect(() => {
    const fromUrl = parseDesk(searchParams.get("desk"));
    setDesk((current) => (current === fromUrl ? current : fromUrl));
  }, [searchParams]);

  useEffect(() => {
    const symbol = searchParams.get("buy");
    if (!symbol || openedBuy.current) return;
    const match = findSymbol(allRows, symbol);
    if (!match) return;
    openedBuy.current = true;
    setBuyRow(match);
    if (match.issuer === "tessera") changeDesk("tessera");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("buy");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [allRows, changeDesk, pathname, router, searchParams]);

  const moveKey = useRef("");
  useEffect(() => {
    const watched = moves.filter((move) => watchlist.symbols.includes(move.symbol));
    const key = watched.map((move) => `${move.symbol}:${move.delta}`).join("|");
    if (!key || key === moveKey.current) return;
    moveKey.current = key;
    for (const move of watched) {
      toast(`${move.symbol} moved`, {
        description: `${formatPct(move.delta)} on the tape`,
      });
    }
  }, [moves, watchlist.symbols]);

  const alertKey = useRef("");
  const updateAlert = gapAlerts.update;
  useEffect(() => {
    if (!allRows.length || !gapAlerts.alerts.length) return;
    const hits: Array<{ symbol: string; premium: number }> = [];
    for (const alert of gapAlerts.alerts) {
      const row = allRows.find((item) => item.symbol === alert.symbol);
      if (!row || row.premium > alert.maxPremium - GAP_ALERT_IMPROVE) continue;
      hits.push({ symbol: row.symbol, premium: row.premium });
    }
    const key = hits.map((hit) => `${hit.symbol}:${hit.premium.toFixed(4)}`).join("|");
    if (!key || key === alertKey.current) return;
    alertKey.current = key;
    for (const hit of hits) {
      toast.success(`${hit.symbol} gap improved`, {
        description: `${formatPct(hit.premium)} vs your alert`,
      });
      updateAlert(hit.symbol, hit.premium);
    }
  }, [allRows, gapAlerts.alerts, updateAlert]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);
      if (typing) {
        if (event.key === "Escape") target.blur();
        return;
      }
      if (event.key === "/") {
        event.preventDefault();
        (
          document.getElementById("nav-search") ??
          document.getElementById("tape-search")
        )?.focus();
      }
      if (event.key === "1") changeDesk("prestocks");
      if (event.key === "2") changeDesk("tessera");
      if (event.key === "3") changeDesk("basis");
      if (event.key === "4") changeDesk("launch");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [changeDesk]);

  function pick(row: TapeRow) {
    setPicked(row);
  }

  function pickSymbol(symbol: string) {
    const match = findSymbol(allRows, symbol);
    if (match) {
      setPicked(match);
      setBuyRow(match);
    }
  }

  function toggleCompare(row: TapeRow) {
    setCompare((current) => {
      if (current.includes(row.symbol)) {
        return current.filter((symbol) => symbol !== row.symbol);
      }
      return [...current, row.symbol].slice(-2);
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader onBasket={() => setBasketOpen(true)} ticker={allRows} />

      <main
        className={cn(
          "mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col px-4 sm:px-6",
          desk === "launch"
            ? "gap-8 py-8 sm:gap-10 sm:py-10"
            : "gap-12 py-12 sm:gap-14 sm:py-16",
        )}
      >
        {desk !== "launch" ? (
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] lg:items-center">
          <div>
            <PageTitle className="max-w-2xl text-lg font-medium leading-7 tracking-normal sm:text-xl sm:leading-8">
              Buy tokenized stocks when the live price on Jupiter is cheaper
              than the official reference price from the issuer (PreStocks, or
              Yahoo on listed names).
            </PageTitle>
            <p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground">
              {cheap
                ? `Right now ${cheap.symbol} trades ${formatPct(cheap.premium)} to mark — tape ${formatPrice(cheap.execPrice)} vs issuer ${formatPrice(cheap.markPrice)}.`
                : "Four steps: pick a name, read the gap, watch Jupiter, then buy."}{" "}
              Green means cheaper. That gap is the trade. Search for a name in
              the header.
            </p>
          </div>
          {cheap ? (
            <Panel data-tour="discount" className="flex w-full flex-col items-stretch gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6">
              <div className="flex min-w-0 items-start gap-3">
                <TokenLogo symbol={cheap.symbol} image={cheap.image} size="lg" className="mt-1" />
                <div className="min-w-0">
                <Eyebrow>Deepest discount</Eyebrow>
                <p className="mt-2 text-lg font-semibold tracking-tight">{cheap.name}</p>
                <p className="mt-1 font-mono text-sm text-gain">
                  {formatPct(cheap.premium)} · {formatPrice(cheap.execPrice)}
                </p>
                </div>
              </div>
              <Button className="w-full shrink-0 sm:w-auto" onClick={() => setBuyRow(cheap)}>
                Buy {cheap.symbol}
              </Button>
            </Panel>
          ) : (
            <Skeleton className="h-24 rounded-2xl" />
          )}
        </section>
        ) : null}

        <div data-tour="desks">
          <Segmented value={desk} onChange={changeDesk} options={DESKS} />
        </div>

        {desk === "prestocks" ? (
          <div className="flex flex-col gap-12 sm:gap-14">
        <TapePulse moves={moves} left={left} updatedAt={tape?.updatedAt ?? null} />
        <div
          className={cn(
            "grid min-w-0 gap-8 md:items-start",
            watchedRows.length > 0 && "md:grid-cols-2",
          )}
        >
          <PrintFeed ticks={prints.ticks} onPick={pickSymbol} />
          <WatchRail rows={watchedRows} onBuy={setBuyRow} onClear={watchlist.toggle} />
        </div>
        {tape ? (
          <div className="grid min-w-0 gap-8 md:grid-cols-2 md:items-stretch">
            <TapeHeatmap rows={tape.rows} onPick={setBuyRow} />
            <SessionMovers rows={allRows} series={prints.series} onPick={setBuyRow} />
          </div>
        ) : null}

        {tape ? (
          <div data-tour="trade">
            <TradeRail
              rows={tape.rows}
              selected={selected?.issuer === "tessera" ? null : selected}
              onSelect={pick}
              onBuy={setBuyRow}
            />
          </div>
        ) : (
          <Skeleton className="h-64 rounded-2xl" />
        )}

        <div className="grid min-w-0 gap-8 md:grid-cols-2 md:items-start">
          <div data-tour="book">
            <HoldingsBook refresh={bookRefresh} />
          </div>
          <div data-tour="history">
            <FillHistory fills={lastFill.fills} limit={4} />
          </div>
        </div>

        {selected ?? cheap ? (
          <PriceChart
            symbol={(selected ?? cheap)!.symbol}
            values={prints.series[(selected ?? cheap)!.symbol]}
          />
        ) : null}

        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Names" hint="Live PreStocks" value={tape ? String(tape.rows.length) : "—"} />
          <Stat
            label="All names"
            hint="Average gap vs mark"
            value={tape ? formatPct(tape.pre8.premium) : "—"}
            tone={tape && tape.pre8.premium < 0 ? "gain" : tape ? "loss" : undefined}
          />
          <Stat
            label="Richest"
            hint="Widest premium"
            value={rich ? `${rich.symbol} ${formatPct(rich.premium)}` : "—"}
            tone="loss"
          />
          <Stat
            label="T-tokens"
            hint="Tessera holders live"
            value={
              tessCheap
                ? `${tessCheap.symbol} ${formatPct(tessCheap.premium)}`
                : tessera.length
                  ? String(tessera.length)
                  : "—"
            }
          />
        </section>

          <section data-tour="table" className="flex flex-col gap-6">
            <TourHint />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Segmented value={filter} onChange={setFilter} options={FILTERS} />
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  id="tape-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search SpaceX, OpenAI…"
                  className="w-full min-w-0 sm:w-48"
                />
                <Button variant="outline" size="sm" onClick={() => setBasketOpen(true)}>
                  Buy every name
                </Button>
                {tape ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => exportTapeCsv(rows, "opengap-prestocks")}
                  >
                    CSV
                  </Button>
                ) : null}
              </div>
            </div>

            {sectors.length ? (
              <div className="flex flex-wrap gap-1.5">
                {["all", ...sectors].map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSector(name)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs",
                      sector === name
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {name === "all" ? "All sectors" : name}
                  </button>
                ))}
              </div>
            ) : null}

            <CompareStrip
              rows={compareRows}
              onBuy={setBuyRow}
              onClear={() => setCompare([])}
            />

            {error ? (
              <Panel className="border-destructive/30 text-sm text-destructive">{error}</Panel>
            ) : tape ? (
              <TapeTable
                rows={rows}
                watched={watchlist.has}
                onWatch={watchlist.toggle}
                onBuy={setBuyRow}
                onCompare={toggleCompare}
                compared={compare}
                onAlert={(row) => {
                  const next = !gapAlerts.has(row.symbol);
                  gapAlerts.toggle(row);
                  toast(
                    next
                      ? `Alert on ${row.symbol}`
                      : `Alert off ${row.symbol}`,
                    {
                      description: next
                        ? "Toast if the gap gets cheaper"
                        : "Removed",
                    },
                  );
                }}
                alerted={gapAlerts.has}
                series={prints.series}
                sort={sort}
                onSort={setSort}
                flash={flash}
              />
            ) : (
              <Skeleton className="h-80 rounded-2xl" />
            )}
          </section>

          <section className="flex flex-col gap-5">
            <div>
              <SectionTitle>Research</SectionTitle>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Issuer copy. Open a card to read, then buy.
              </p>
            </div>
            {tape ? <ResearchGrid rows={tape.rows} /> : <Skeleton className="h-64 rounded-2xl" />}
          </section>
          </div>
        ) : null}

        {desk === "tessera" ? (
          <section data-tour="tessera" className="flex flex-col gap-8">
            <div>
              <SectionTitle>Tessera T-tokens</SectionTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Same Buy button as PreStocks. These track a loan, not a share.
                T-OpenAI is not OPENAI.
              </p>
            </div>
            {tessera.length ? (
              <>
                <div className="grid gap-8 md:grid-cols-[1.15fr_0.85fr] md:items-start">
                <TradeRail
                  rows={tessera}
                  selected={selected?.issuer === "tessera" ? selected : null}
                  onSelect={pick}
                  onBuy={setBuyRow}
                />
                <ClaimSplit
                  prestocks={tape?.rows ?? []}
                  tessera={tessera}
                  onBuy={setBuyRow}
                />
                </div>
                <div className="grid min-w-0 gap-8 md:grid-cols-2 md:items-start">
                  <HoldingsBook refresh={bookRefresh} />
                  <FillHistory fills={lastFill.fills} limit={4} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search T-OpenAI…"
                    className="w-full min-w-0 sm:w-48"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => exportTapeCsv(tesseraRows, "opengap-tessera")}
                  >
                    CSV
                  </Button>
                </div>
                <TapeTable
                  rows={tesseraRows}
                  watched={watchlist.has}
                  onWatch={watchlist.toggle}
                  onBuy={setBuyRow}
                  onCompare={toggleCompare}
                  compared={compare}
                  onAlert={gapAlerts.toggle}
                  alerted={gapAlerts.has}
                  series={prints.series}
                  sort={sort}
                  onSort={setSort}
                  flash={flash}
                />
              </>
            ) : (
              <Skeleton className="h-48 rounded-2xl" />
            )}
          </section>
        ) : null}

        {desk === "basis" ? (
          <div data-tour="basis">
            <BasisDesk />
          </div>
        ) : null}
        {desk === "launch" ? <LaunchDesk /> : null}

        {desk === "prestocks" ? (
          <div className="pt-2">
            <WalletDesk />
          </div>
        ) : null}
      </main>

      <BuySheet
        row={buyRow}
        open={Boolean(buyRow)}
        onOpenChange={(open) => {
          if (!open) setBuyRow(null);
        }}
        onFill={(fill) => {
          lastFill.save(fill);
          setBookRefresh((value) => value + 1);
        }}
      />
      <BasketSheet tape={tape} open={basketOpen} onOpenChange={setBasketOpen} />
    </div>
  );
}

function Stat({
  label,
  hint,
  value,
  tone,
}: {
  label: string;
  hint: string;
  value: string;
  tone?: "gain" | "loss";
}) {
  return (
    <Panel className="px-4 py-4">
      <Eyebrow>{label}</Eyebrow>
      <div
        className={cn(
          "mt-2 font-mono text-sm",
          tone === "gain" && "text-gain",
          tone === "loss" && "text-loss",
        )}
      >
        {value}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </Panel>
  );
}

function findSymbol(rows: TapeRow[], symbol: string) {
  const wanted = symbol.toLowerCase();
  return rows.find((row) => row.symbol.toLowerCase() === wanted) ?? null;
}

function filterRows(
  rows: TapeRow[],
  {
    filter,
    query,
    sector,
    sort,
    watched,
  }: {
    filter: Filter;
    query: string;
    sector: string;
    sort: TapeSort;
    watched: string[];
  },
) {
  const wanted = query.trim().toLowerCase();
  let next = rows;
  if (filter === "discount") next = next.filter((row) => row.premium < 0);
  if (filter === "premium") next = next.filter((row) => row.premium > 0);
  if (filter === "watch") next = next.filter((row) => watched.includes(row.symbol));
  if (sector !== "all") next = next.filter((row) => row.sector === sector);
  if (wanted) {
    next = next.filter(
      (row) =>
        row.symbol.toLowerCase().includes(wanted) ||
        row.name.toLowerCase().includes(wanted) ||
        (row.sector ?? "").toLowerCase().includes(wanted),
    );
  }
  return [...next].sort((a, b) => {
    if (sort === "tape") return a.execPrice - b.execPrice;
    if (sort === "name") return a.name.localeCompare(b.name);
    if (sort === "implied") return b.impliedValuation - a.impliedValuation;
    return a.premium - b.premium;
  });
}
