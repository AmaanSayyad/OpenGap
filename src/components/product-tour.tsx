"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import {
  TOUR_DESK_EVENT,
  TOUR_STEP_KEY,
  TOUR_STEPS,
  TOUR_STORAGE_KEY,
  TOUR_WALLET_KEY,
  TOUR_WALLET_START,
  pathMatches,
  resolveStepHref,
  type Desk,
} from "@/lib/tour";
import { GLOSSARY } from "@/lib/brand";
import { cn } from "@/lib/utils";

const CARD_W = 300;
const CARD_H = 200;
const PAD = 10;

const TourContext = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  start: () => void;
} | null>(null);

export function useTour() {
  return (
    useContext(TourContext) ?? {
      open: false,
      setOpen: () => {},
      start: () => {},
    }
  );
}

export function TourProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).get("tour") === "1";
    const saved = window.sessionStorage.getItem(TOUR_STEP_KEY);
    if (forced) {
      setStep(0);
      setOpen(true);
      return;
    }
    if (saved != null) {
      const index = Number(saved);
      if (Number.isFinite(index)) setStep(Math.max(0, Math.min(index, TOUR_STEPS.length - 1)));
      setOpen(true);
      return;
    }
    if (!window.localStorage.getItem(TOUR_STORAGE_KEY)) setOpen(true);
  }, []);

  useEffect(() => {
    if (open) window.sessionStorage.setItem(TOUR_STEP_KEY, String(step));
    else window.sessionStorage.removeItem(TOUR_STEP_KEY);
  }, [open, step]);

  const start = useCallback(() => {
    setStep(0);
    setOpen(true);
    if (pathname !== "/") router.replace("/");
  }, [pathname, router]);

  const value = useMemo(() => ({ open, setOpen, start }), [open, start]);

  return (
    <TourContext.Provider value={value}>
      {children}
      <ProductTour open={open} onOpenChange={setOpen} step={step} setStep={setStep} />
    </TourContext.Provider>
  );
}

export function ProductTour({
  open,
  onOpenChange,
  step,
  setStep,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: number;
  setStep: (value: number | ((current: number) => number)) => void;
}) {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const router = useRouter();
  const pathname = usePathname();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [href, setHref] = useState<string | null>(null);
  const current = TOUR_STEPS[step];
  const last = step === TOUR_STEPS.length - 1;
  const waiting = Boolean(current?.waitForWallet && !connected);

  useEffect(() => {
    if (!open || !current) return;
    let cancelled = false;
    void resolveStepHref(current).then((next) => {
      if (cancelled) return;
      setHref(next);
      if (next && !pathMatches(pathname, next)) {
        router.replace(next);
        return;
      }
      if (current.desk && (!next || next === "/")) {
        window.dispatchEvent(new CustomEvent<Desk>(TOUR_DESK_EVENT, { detail: current.desk }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [current, open, pathname, router]);

  useLayoutEffect(() => {
    if (!open || !current) return;
    if (href && !pathMatches(pathname, href)) {
      setRect(null);
      return;
    }

    let frame = 0;
    let retry = 0;
    function measure() {
      if (!current.target) {
        setRect(null);
        return;
      }
      const node = document.querySelector(`[data-tour="${current.target}"]`);
      if (!node) {
        retry = window.setTimeout(measure, 160);
        return;
      }
      setRect(node.getBoundingClientRect());
    }

    function reveal() {
      if (!current.target) {
        setRect(null);
        return;
      }
      document
        .querySelector(`[data-tour="${current.target}"]`)
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
      window.setTimeout(measure, 140);
    }

    frame = window.requestAnimationFrame(() => {
      window.setTimeout(reveal, current.desk || href ? 120 : 0);
    });

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { capture: true, passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(retry);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [current, href, open, pathname]);

  const touchY = useRef(0);

  useEffect(() => {
    if (!connected) return;

    if (open && current?.waitForWallet) {
      setVisible(false);
      const timer = window.setTimeout(() => setStep((value) => value + 1), 700);
      return () => window.clearTimeout(timer);
    }

    if (open) return;
    if (window.localStorage.getItem(TOUR_WALLET_KEY)) return;
    if (!window.localStorage.getItem(TOUR_STORAGE_KEY)) return;

    const start = TOUR_STEPS.findIndex((item) => item.id === TOUR_WALLET_START);
    setStep(start >= 0 ? start : 0);
    onOpenChange(true);
  }, [connected, current, onOpenChange, open, setStep, setVisible]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") finish();
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") back();
      if (event.key === "PageDown") window.scrollBy({ top: window.innerHeight * 0.7 });
      if (event.key === "PageUp") window.scrollBy({ top: -window.innerHeight * 0.7 });
    }
    function onWheel(event: WheelEvent) {
      window.scrollBy({ top: event.deltaY, left: event.deltaX });
    }
    function onTouchStart(event: TouchEvent) {
      touchY.current = event.touches[0]?.clientY ?? 0;
    }
    function onTouchMove(event: TouchEvent) {
      const y = event.touches[0]?.clientY ?? touchY.current;
      window.scrollBy({ top: touchY.current - y });
      touchY.current = y;
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [last, open, step, waiting]);

  function finish() {
    window.localStorage.setItem(TOUR_STORAGE_KEY, "1");
    if (connected || current?.id.startsWith("wallet-")) {
      window.localStorage.setItem(TOUR_WALLET_KEY, "1");
    }
    window.sessionStorage.removeItem(TOUR_STEP_KEY);
    onOpenChange(false);
    setStep(0);
  }

  function next() {
    if (waiting) {
      setVisible(true);
      return;
    }
    if (last) finish();
    else setStep((value) => value + 1);
  }

  function back() {
    setStep((value) => Math.max(0, value - 1));
  }

  if (!open || !current) return null;

  const hole = rect
    ? {
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: Math.min(rect.height + PAD * 2, window.innerHeight * 0.55),
      }
    : null;

  const placeBelow = hole ? hole.top + hole.height + 16 + CARD_H < window.innerHeight : true;
  const left = hole
    ? Math.min(Math.max(16, hole.left), window.innerWidth - CARD_W - 16)
    : Math.max(16, (window.innerWidth - CARD_W) / 2);
  const top = hole
    ? placeBelow
      ? hole.top + hole.height + 14
      : Math.max(16, hole.top - CARD_H - 14)
    : Math.max(24, (window.innerHeight - CARD_H) / 2);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      {hole ? (
        <Spotlight hole={hole} onSkip={finish} />
      ) : (
        <button
          type="button"
          className="absolute inset-0 bg-black/60"
          aria-label="Skip guide"
          onClick={finish}
        />
      )}

      <div
        data-tour-card
        className="absolute z-20 w-[min(18.75rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-zinc-300 p-4 text-zinc-900 shadow-[0_16px_40px_rgb(0_0_0/0.45)]"
        style={{ top, left }}
      >
        {hole ? (
          <span
            className={cn(
              "absolute left-8 size-2.5 rotate-45 bg-zinc-300",
              placeBelow ? "-top-1" : "-bottom-1",
            )}
          />
        ) : null}

        <div className="flex items-center gap-1.5">
          {TOUR_STEPS.map((item, index) => (
            <span
              key={item.id}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === step ? "w-5 bg-zinc-800" : "w-1.5 bg-zinc-500/50",
              )}
            />
          ))}
        </div>

        <h2 id="tour-title" className="mt-3 text-lg font-semibold tracking-tight">
          {current.title}
        </h2>
        <p className="mt-1.5 text-sm leading-5 text-zinc-700">{current.body}</p>
        <p className="mt-2 text-xs text-zinc-500">Scroll to see more.</p>

        <div className="mt-4 flex items-center gap-2">
          {step > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={back}
              className="text-zinc-600 hover:bg-zinc-400/40 hover:text-zinc-900"
            >
              Back
            </Button>
          ) : (
            <button
              type="button"
              onClick={finish}
              className="px-2 text-sm text-zinc-600 hover:text-zinc-900"
            >
              Skip
            </button>
          )}
          <Button
            size="sm"
            className="ml-auto bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
            onClick={next}
          >
            {waiting ? "Connect" : last ? "Done" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Spotlight({
  hole,
  onSkip,
}: {
  hole: { top: number; left: number; width: number; height: number };
  onSkip: () => void;
}) {
  const dim = "absolute bg-black/60";
  return (
    <>
      <button
        type="button"
        aria-label="Skip guide"
        className={cn(dim, "left-0 right-0 top-0")}
        style={{ height: Math.max(0, hole.top) }}
        onClick={onSkip}
      />
      <button
        type="button"
        aria-label="Skip guide"
        className={cn(dim, "left-0")}
        style={{ top: hole.top, width: Math.max(0, hole.left), height: hole.height }}
        onClick={onSkip}
      />
      <button
        type="button"
        aria-label="Skip guide"
        className={cn(dim, "right-0")}
        style={{
          top: hole.top,
          left: hole.left + hole.width,
          height: hole.height,
        }}
        onClick={onSkip}
      />
      <button
        type="button"
        aria-label="Skip guide"
        className={cn(dim, "bottom-0 left-0 right-0")}
        style={{ top: hole.top + hole.height }}
        onClick={onSkip}
      />
      <div
        className="pointer-events-none absolute z-10 rounded-2xl ring-2 ring-zinc-200/90"
        style={{
          top: hole.top,
          left: hole.left,
          width: hole.width,
          height: hole.height,
          boxShadow: "0 0 0 2px rgb(228 228 231 / 0.9), 0 0 28px 4px rgb(228 228 231 / 0.28)",
        }}
      />
    </>
  );
}

export function TourHint({ className }: { className?: string }) {
  return (
    <p className={cn("max-w-2xl text-xs leading-5 text-muted-foreground", className)}>
      {GLOSSARY.tape} {GLOSSARY.mark} {GLOSSARY.green}
    </p>
  );
}
