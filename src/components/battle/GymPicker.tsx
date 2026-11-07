"use client";

import { useState } from "react";
import { checkInAtGym, findNearbyGyms } from "@/app/battle/actions";
import { buttonClass, getFix, ghostButtonClass } from "@/components/battle/shared";
import { ITEM_SPRITES, PixelSprite } from "@/components/sprites";
import type { BattleState, NearbyGym } from "@/lib/battle/state";

type Search = { kind: "idle" } | { kind: "results"; gyms: NearbyGym[] } | { kind: "manual" };

function formatDistance(meters: number): string {
  const miles = meters / 1609.34;
  return miles < 0.1 ? `${Math.round(meters * 3.281)} ft` : `${miles.toFixed(1)} mi`;
}

export interface GymPickerProps {
  /** The gym the player last checked in at, if any (shown when switching). */
  currentGymName: string | null;
  onCheckedIn: (state: BattleState, gymName: string) => void;
  /** Shown as a "Back" link when the player already has a gym. */
  onCancel?: () => void;
}

export function GymPicker({ currentGymName, onCheckedIn, onCancel }: GymPickerProps): React.JSX.Element {
  const [search, setSearch] = useState<Search>({ kind: "idle" });
  const [selected, setSelected] = useState<NearbyGym | null>(null);
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<"search" | "checkin" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(): Promise<void> {
    setBusy("search");
    setError(null);
    setSelected(null);
    try {
      const fix = await getFix();
      const result = await findNearbyGyms(fix, query.trim() || undefined);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSearch(result.data.configured ? { kind: "results", gyms: result.data.gyms } : { kind: "manual" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  function handlePick(gym: NearbyGym): void {
    setSelected(gym);
    setError(null);
  }

  async function handleCheckIn(): Promise<void> {
    if (search.kind === "idle") return;
    const label = (search.kind === "results" ? (selected?.name ?? "") : name).trim().slice(0, 60);
    if (!label) {
      setError(search.kind === "results" ? "Pick your gym from the list first." : "Give your gym a name first.");
      return;
    }
    setBusy("checkin");
    setError(null);
    try {
      // A fresh fix: the search may have been a while ago.
      const fix = await getFix();
      const result = await checkInAtGym({
        name: label,
        placeId: search.kind === "results" ? (selected?.placeId ?? null) : null,
        fix,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onCheckedIn(result.data, label);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm italic text-white/70">
          {search.kind === "results" && search.gyms.length > 0
            ? "Which gym are you at?"
            : currentGymName
              ? `Not at ${currentGymName}? Find the gym you're at to check in there instead.`
              : "Find the gym you're at to check in and start earning attacks. You can switch gyms any time you're not mid-session."}
        </p>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={busy !== null}
            className="gc-btn gc-btn-ghost gc-btn-sm shrink-0 gap-1.5 px-2"
          >
            Back
            <span aria-hidden="true" className="gc-hint">
              B
            </span>
          </button>
        )}
      </div>

      {search.kind !== "manual" && (
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSearch();
          }}
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={100}
            placeholder="Gym name (optional)"
            aria-label="Search gyms by name"
            className="gc-input flex-1 text-sm"
          />
          <button type="submit" disabled={busy !== null} className={search.kind === "idle" ? buttonClass : ghostButtonClass}>
            {busy === "search" ? "Searching…" : search.kind === "idle" ? "Find gyms near me" : "Search again"}
          </button>
        </form>
      )}

      {search.kind === "results" && search.gyms.length === 0 && (
        <p className="text-sm italic text-white/70">
          {query.trim()
            ? "No gyms by that name within a mile of you. Try another name, or clear it to see every gym nearby."
            : "No gyms within a mile of you. Try again once you're closer to yours."}
        </p>
      )}

      {search.kind === "results" && search.gyms.length > 0 && (
        <>
          <ul className="max-h-72 space-y-[3px] overflow-y-auto pr-1" aria-label="Nearby gyms">
            {search.gyms.map((gym) => {
              const active = selected?.placeId === gym.placeId;
              return (
                <li key={gym.placeId}>
                  <button
                    type="button"
                    onClick={() => handlePick(gym)}
                    aria-pressed={active}
                    className={`flex w-full items-center gap-3 rounded-[3px] border px-2 py-2 text-left transition ${
                      active
                        ? "border-glow bg-[rgba(22,64,66,0.75)] shadow-[0_0_14px_rgba(116,230,226,0.35)]"
                        : "border-transparent bg-white/[0.06] hover:border-white/25 hover:bg-white/[0.1]"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[2px] border ${
                        active ? "border-glow/70 bg-black/40" : "border-white/10 bg-black/50"
                      }`}
                    >
                      <PixelSprite sheet={ITEM_SPRITES["map-pin"]} scale={1.5} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold italic text-ink">{gym.name}</span>
                      {gym.address && <span className="block truncate text-xs text-white/50">{gym.address}</span>}
                    </span>
                    <span className="gc-num shrink-0 font-mono text-xs text-white/65">{formatDistance(gym.distanceM)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {search.kind === "manual" && (
        <p className="text-sm italic text-white/70">
          Gym search isn&apos;t set up, so name your gym and we&apos;ll use where you&apos;re standing.
        </p>
      )}

      {search.kind === "manual" && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder="e.g. 24 Hour Fitness Downtown"
            aria-label="Gym name"
            className="gc-input flex-1 text-sm"
          />
          <button type="button" onClick={handleCheckIn} disabled={busy !== null} className={buttonClass}>
            {busy === "checkin" ? "Checking in…" : "Check in here"}
          </button>
        </div>
      )}

      {search.kind === "results" && selected !== null && (
        <button type="button" onClick={handleCheckIn} disabled={busy !== null} className={`w-full ${buttonClass}`}>
          {busy === "checkin" ? "Checking in…" : `Check in at ${selected.name}`}
        </button>
      )}

      {error && (
        <p role="alert" className="text-sm italic text-[#ff8a74]">
          {error}
        </p>
      )}
    </div>
  );
}
