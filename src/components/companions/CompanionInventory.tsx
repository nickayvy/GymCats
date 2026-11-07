"use client";

import Image from "next/image";
import { useState } from "react";
import { RARITY_LABELS, type Companion } from "@/lib/companions/roster";

export interface CompanionInventoryProps {
  companions: Companion[];
  slots: number;
}

export function CompanionInventory({ companions, slots }: CompanionInventoryProps): React.JSX.Element {
  // Index into the slot grid; slots past the roster are undiscovered.
  const [selected, setSelected] = useState(0);
  const companion: Companion | undefined = companions[selected];
  const slotCount = Math.max(slots, companions.length);

  return (
    <div className="grid w-full gap-6 md:grid-cols-[1fr_18rem] md:items-start">
      <section
        aria-live="polite"
        aria-label="Selected companion"
        className="rpg-window flex flex-col items-center gap-4 p-5 text-center md:order-2"
      >
        {companion ? (
          <>
            <div className="rpg-window p-1.5">
              <Image
                src={companion.image}
                alt={`Pixel art ${companion.name} cat`}
                width={176}
                height={176}
                className="pixel-art block h-44 w-44 rounded-sm"
              />
            </div>
            <div className="flex flex-col items-center gap-2">
              <h2 className="rpg-title text-2xl font-bold">{companion.name}</h2>
              <span className="rpg-chip is-on px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em]">
                {RARITY_LABELS[companion.rarity]}
              </span>
            </div>
            <div className="rpg-parchment w-full px-4 py-3 text-left">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink/70">{companion.breed}</p>
              <p className="mt-2 text-sm leading-relaxed">{companion.description}</p>
            </div>
          </>
        ) : (
          <>
            <div className="rpg-slot-locked flex h-44 w-44 items-center justify-center">
              <span className="font-mono text-6xl text-foreground/25">?</span>
            </div>
            <h2 className="rpg-title text-2xl font-bold">???</h2>
            <p className="text-sm text-foreground/60">Not discovered yet. More companions are on the way.</p>
          </>
        )}
      </section>

      <section aria-label="Companion inventory" className="rpg-window p-4 sm:p-5 md:order-1">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="rpg-label">Inventory</h2>
          <p className="font-mono text-xs tabular-nums text-foreground/70">
            {companions.length} / {slotCount}
          </p>
        </div>
        <ul className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-4">
          {Array.from({ length: slotCount }, (_, i) => {
            const c = companions[i];
            const isSelected = i === selected;
            return (
              <li key={c?.id ?? `empty-${i}`}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={c ? c.name : `Empty slot ${i + 1}`}
                  onClick={() => setSelected(i)}
                  className={`rpg-slot rpg-cursor ${isSelected ? "is-selected" : ""}`}
                >
                  <span className="rpg-slot-inner">
                    {c ? (
                      <Image
                        src={c.image}
                        alt=""
                        fill
                        sizes="96px"
                        className="pixel-art object-cover"
                      />
                    ) : (
                      <span className="font-mono text-lg text-foreground/20">?</span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
