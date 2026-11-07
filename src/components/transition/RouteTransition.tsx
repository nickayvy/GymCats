"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { RunningCat } from "./RunningCat";

// Loading screen shown between pages: the hero Siamese runs to the right
// along a progress bar.
//
// Two ways in:
// - "navigate": a click on an internal link. We take over the navigation so
//   the screen covers the old page while the new one loads, and hold it until
//   the router transition settles.
// - "arrive": the path changed without a link click (a server action
//   redirect, router.push, back/forward). The new page is already rendered,
//   so the cat runs a short lap over it and the screen fades away.

const MIN_LOADING_MS = 700; // keep the cat on screen long enough to read
const FINISH_MS = 280; // bar sprint from wherever it is to 100%
const ARRIVE_MS = 750; // full lap for "arrive"
const FADE_MS = 280;
const SAFETY_MS = 10_000; // never leave the screen up if the router stalls

// Pages that play their own entrance (the battle wipe) skip the "arrive" lap.
const ROUTES_WITH_OWN_TRANSITION = ["/battle"];

type Mode = "navigate" | "arrive";

interface Run {
  id: number;
  mode: Mode;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

const easeInOut = (k: number): number =>
  k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
const easeOut = (k: number): number => 1 - Math.pow(1 - k, 3);

let nextRunId = 1;

// One tip per run, picked by run id so the render stays deterministic.
const TIPS = [
  "Check in at the gym for an attack, then earn one more every 10 minutes.",
  "Log & Grow turns a home workout into attacks too.",
  "A legendary hit lands once in 10,000 spins and takes half the boss's HP.",
  "A new boss arrives every Monday. Team up to finish this one first.",
  "Keep the battle screen open at the gym so your time keeps counting.",
  "Your partner's hits count against the same boss.",
] as const;

export function RouteTransition(): React.JSX.Element | null {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [run, setRun] = useState<Run | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);

  const stageRef = useRef<HTMLDivElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);
  const loadedRef = useRef(false);
  const sawPendingRef = useRef(false);

  // Path changed without us starting a run: play the "arrive" lap. Done during
  // render so the screen lands in the same paint as the new page.
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (
      run === null &&
      !ROUTES_WITH_OWN_TRANSITION.includes(pathname) &&
      !prefersReducedMotion()
    ) {
      setRun({ id: nextRunId++, mode: "arrive" });
    }
  }

  // Intercept internal link clicks so the loading screen covers the old page.
  useEffect(() => {
    function onClick(event: MouseEvent): void {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest("a");
      if (!anchor || !anchor.href) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if ("noTransition" in anchor.dataset) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page (query or hash change only): let the link do its thing.
      if (url.pathname === window.location.pathname) return;
      if (prefersReducedMotion()) return;

      event.preventDefault();
      loadedRef.current = false;
      sawPendingRef.current = false;
      setLeaving(false);
      setRun({ id: nextRunId++, mode: "navigate" });
      startTransition(() => {
        router.push(url.pathname + url.search + url.hash);
      });
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  // The router transition is done once isPending goes true and back to false.
  useEffect(() => {
    if (isPending) {
      sawPendingRef.current = true;
    } else if (sawPendingRef.current) {
      sawPendingRef.current = false;
      loadedRef.current = true;
    }
  }, [isPending]);

  // Drive the bar and the cat's position from one animation loop.
  useEffect(() => {
    if (!run) return;
    const start = performance.now();
    let finishFrom: number | null = null;
    let finishStart = 0;
    let frame = 0;
    let fadeTimer = 0;
    const safetyTimer = window.setTimeout(() => {
      loadedRef.current = true;
    }, SAFETY_MS);

    const paint = (p: number): void => {
      stageRef.current?.style.setProperty("--progress", p.toFixed(4));
      if (percentRef.current) {
        percentRef.current.textContent = `${Math.round(p * 100)}%`;
      }
    };

    const tick = (now: number): void => {
      const elapsed = now - start;
      let p: number;
      if (run.mode === "arrive") {
        p = easeInOut(Math.min(1, elapsed / ARRIVE_MS));
      } else if (finishFrom === null) {
        // Creep toward 90% while the page loads.
        p = 0.9 * (1 - Math.exp(-elapsed / 650));
        if (loadedRef.current && elapsed >= MIN_LOADING_MS) {
          finishFrom = p;
          finishStart = now;
        }
      } else {
        const k = Math.min(1, (now - finishStart) / FINISH_MS);
        p = finishFrom + (1 - finishFrom) * easeOut(k);
      }

      paint(p);
      if (p >= 1) {
        setLeaving(true);
        fadeTimer = window.setTimeout(() => {
          setRun(null);
          setLeaving(false);
        }, FADE_MS);
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    paint(0);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(safetyTimer);
    };
  }, [run]);

  if (!run) return null;

  return (
    <div
      className="route-transition"
      data-mode={run.mode}
      data-leaving={leaving ? "true" : undefined}
      role="status"
      aria-live="polite"
      aria-busy={!leaving}
    >
      <div
        ref={stageRef}
        className="relative w-full max-w-md px-6"
        style={{ "--progress": 0 } as React.CSSProperties}
      >
        <div className="route-transition-track">
          <div className="route-transition-runner">
            <span className="route-transition-dust" aria-hidden="true" />
            <span className="route-transition-dust route-transition-dust-late" aria-hidden="true" />
            <RunningCat />
            <span className="route-transition-shadow" aria-hidden="true" />
          </div>
        </div>
        <div className="route-transition-bar">
          <div className="route-transition-fill" />
        </div>
        <p className="mt-3 flex items-baseline justify-between">
          <span className="text-base italic text-ink">
            Loading<span className="route-transition-dots" aria-hidden="true" />
          </span>
          <span ref={percentRef} aria-hidden="true" className="gc-num font-mono text-sm text-glow">
            0%
          </span>
        </p>
        <p aria-hidden="true" className="mt-6 flex items-start gap-2 border-t border-white/10 pt-3 text-sm italic leading-relaxed text-white/60">
          <span aria-hidden="true" className="mt-[0.45em] h-1.5 w-1.5 shrink-0 rotate-45 bg-gold/80" />
          <span>
            <span className="gc-caps mr-2 not-italic text-gold/80">Tip</span>
            {TIPS[run.id % TIPS.length]}
          </span>
        </p>
      </div>
    </div>
  );
}
