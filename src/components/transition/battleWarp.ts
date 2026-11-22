"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "@/app/styles/warp.css";

// Hub → battle "warp": a rune circle of cyan light draws itself, motes of
// light gather into it, a gold sigil ignites, then a pillar of light and a
// white flash. The battle screen fades in out of that flash.
//
// The overlay is plain DOM appended to <body>, not React state, so it
// outlives the page that started it and covers the gap while the battle
// screen loads. BattleScreen calls finishBattleWarp() once it has mounted.

const OVERLAY_ID = "battle-warp";
/** When to start navigating: the flash is near full by then. */
const NAVIGATE_AT_MS = 900;
/** Matches .battle-warp[data-leaving] in warp.css. */
const LEAVE_MS = 650;
/** Never leave the overlay up if navigation stalls or fails. */
const SAFETY_MS = 10_000;

const MOTES = 18;
const GLYPHS = 16;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Eight-pointed star: alternating long and short points. */
function starPath(outer: number, inner: number): string {
  const points: string[] = [];
  for (let i = 0; i < 16; i++) {
    const r = i % 2 === 0 ? (i % 4 === 0 ? outer : outer * 0.62) : inner;
    const a = (Math.PI / 8) * i - Math.PI / 2;
    points.push(`${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${points.join("L")}Z`;
}

/** Static markup only: nothing here comes from user data. */
function overlayMarkup(): string {
  const glyphs = Array.from({ length: GLYPHS }, (_, i) => {
    const angle = (360 / GLYPHS) * i;
    // Alternate a small diamond and a short bar, like an engraved rune band.
    const mark =
      i % 2 === 0
        ? '<path d="M0 -91 L2.6 -87 L0 -83 L-2.6 -87 Z" />'
        : '<rect x="-0.8" y="-90" width="1.6" height="6" />';
    return `<g transform="rotate(${angle})">${mark}</g>`;
  }).join("");

  const motes = Array.from({ length: MOTES }, (_, i) => {
    const angle = Math.round((360 / MOTES) * i + (i % 3) * 7);
    const distance = 34 + ((i * 37) % 22); // vmin
    const delay = (i * 47) % 380; // ms
    const gold = i % 4 === 0 ? " battle-warp-mote-gold" : "";
    return `<span class="battle-warp-mote${gold}" style="--a:${angle}deg;--r:${distance}vmin;--d:${delay}ms"></span>`;
  }).join("");

  return `
    <div class="battle-warp-veil"></div>
    ${motes}
    <svg class="battle-warp-sigil" viewBox="-100 -100 200 200" aria-hidden="true">
      <g class="battle-warp-glyphs">${glyphs}</g>
      <circle class="battle-warp-ring battle-warp-ring-a" r="78" pathLength="1" />
      <circle class="battle-warp-ticks" r="68" />
      <circle class="battle-warp-ring battle-warp-ring-b" r="56" pathLength="1" />
      <path class="battle-warp-star" d="${starPath(44, 11)}" />
      <circle class="battle-warp-core" r="5" />
    </svg>
    <div class="battle-warp-pillar"></div>
    <div class="battle-warp-flash"></div>
  `;
}

function mountOverlay(): void {
  document.getElementById(OVERLAY_ID)?.remove();
  const el = document.createElement("div");
  el.id = OVERLAY_ID;
  el.className = "battle-warp";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = overlayMarkup();
  document.body.appendChild(el);
  window.setTimeout(() => {
    if (el.isConnected) finishOverlay(el);
  }, SAFETY_MS);
}

function finishOverlay(el: HTMLElement): void {
  if (el.dataset.leaving) return;
  el.dataset.leaving = "true";
  window.setTimeout(() => el.remove(), LEAVE_MS);
}

/** Fades the warp out of its flash. Safe to call when there is no warp. */
export function finishBattleWarp(): void {
  const el = document.getElementById(OVERLAY_ID);
  if (el) finishOverlay(el);
}

/** Plays the warp, then opens /battle. Falls back to plain navigation for reduced motion. */
export function useBattleWarp(): { warping: boolean; warpToBattle: () => void } {
  const router = useRouter();
  const [warping, setWarping] = useState(false);
  const timer = useRef(0);

  useEffect(() => {
    router.prefetch("/battle");
    return () => window.clearTimeout(timer.current);
  }, [router]);

  function warpToBattle(): void {
    if (warping) return;
    if (prefersReducedMotion()) {
      router.push("/battle");
      return;
    }
    setWarping(true);
    mountOverlay();
    timer.current = window.setTimeout(() => router.push("/battle"), NAVIGATE_AT_MS);
  }

  return { warping, warpToBattle };
}
