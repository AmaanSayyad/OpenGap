"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Search } from "lucide-react";
import { TokenLogo } from "@/components/token-logo";
import { formatPct } from "@/lib/format";
import type { TapeRow } from "@/lib/types";
import { cn } from "@/lib/utils";

export function NavSearch({ rows }: { rows?: TapeRow[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [names, setNames] = useState<TapeRow[]>(rows ?? []);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (rows?.length) {
      setNames(rows);
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const [tapeRes, tesseraRes] = await Promise.all([
          fetch("/api/tape", { cache: "no-store" }),
          fetch("/api/tessera", { cache: "no-store" }),
        ]);
        const tape = (await tapeRes.json()) as { rows?: TapeRow[] };
        const tessera = (await tesseraRes.json()) as { rows?: TapeRow[] };
        if (!cancelled) setNames([...(tape.rows ?? []), ...(tessera.rows ?? [])]);
      } catch {
        /* keep last list */
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [rows]);

  const hits = useMemo(() => {
    const wanted = query.trim().toLowerCase();
    const list = wanted
      ? names.filter(
          (row) =>
            row.symbol.toLowerCase().includes(wanted) ||
            row.name.toLowerCase().includes(wanted),
        )
      : [...names].sort((a, b) => a.premium - b.premium);
    return list.slice(0, 8);
  }, [names, query]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);
      if (!typing && event.key === "/") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    function onPointer(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, []);

  function go(row: TapeRow) {
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
    router.push(`/token/${encodeURIComponent(row.symbol.toLowerCase())}`);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((value) => Math.min(value + 1, Math.max(hits.length - 1, 0)));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((value) => Math.max(value - 1, 0));
      return;
    }
    if (event.key === "Enter" && hits[active]) {
      event.preventDefault();
      go(hits[active]);
    }
  }

  return (
    <div ref={boxRef} className="relative min-w-0 flex-1 max-w-xs">
      <label className="relative block">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          ref={inputRef}
          id="nav-search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search a name…"
          autoComplete="off"
          className="h-8 w-full rounded-full border border-input bg-background/80 pl-8 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>
      {open ? (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-2xl border border-border bg-background py-1 shadow-lg"
        >
          {hits.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">No matching name.</li>
          ) : (
            hits.map((row, index) => (
              <li key={row.mint}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => go(row)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm",
                    index === active ? "bg-muted" : "hover:bg-muted/60",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <TokenLogo symbol={row.symbol} image={row.image} size="sm" />
                    <span className="truncate">
                      <span className="font-medium">{row.symbol}</span>
                      <span className="ml-2 text-muted-foreground">{row.name}</span>
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 font-mono text-xs",
                      row.premium < 0 ? "text-gain" : "text-loss",
                    )}
                  >
                    {formatPct(row.premium)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
