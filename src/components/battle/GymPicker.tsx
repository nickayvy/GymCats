"use client";

import { useState } from "react";
import { checkInAtGym, findNearbyGyms } from "@/app/battle/actions";
import { buttonClass, getFix, ghostButtonClass } from "@/components/battle/shared";
import type { BattleState, NearbyGym } from "@/lib/battle/state";

type Search = { kind: "idle" } | { kind: "results"; gyms: NearbyGym[] } | { kind: "manual" };

function formatDistance(meters: number): string {
  const miles = meters / 1609.34;
  return miles < 0.1 ? `${Math.round(meters * 3.281)} ft` : `${miles.toFixed(1)} mi`;
}

function DumbbellIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" strokeLinecap="round" />
    </svg>
  );
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
    <div className="mt-3 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-foreground/70">
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
            className="shrink-0 font-mono text-xs uppercase tracking-widest text-foreground/60 hover:text-accent disabled:opacity-50"
          >
            Back
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
            className="flex-1 rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <button type="submit" disabled={busy !== null} className={search.kind === "idle" ? buttonClass : ghostButtonClass}>
            {busy === "search" ? "Searching…" : search.kind === "idle" ? "Find gyms near me" : "Search again"}
          </button>
        </form>
      )}

      {search.kind === "results" && search.gyms.length === 0 && (
        <p className="text-sm text-foreground/70">
          {query.trim()
            ? "No gyms by that name within a mile of you. Try another name, or clear it to see every gym nearby."
            : "No gyms within a mile of you. Try again once you're closer to yours."}
        </p>
      )}

      {search.kind === "results" && search.gyms.length > 0 && (
        <>
          <ul className="max-h-72 space-y-2 overflow-y-auto pr-1" aria-label="Nearby gyms">
            {search.gyms.map((gym) => {
              const active = selected?.placeId === gym.placeId;
              return (
                <li key={gym.placeId}>
                  <button
                    type="button"
                    onClick={() => handlePick(gym)}
                    aria-pressed={active}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                      active
                        ? "border-accent bg-accent/10"
                        : "border-white/10 bg-black/20 hover:border-white/25"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        active ? "bg-accent text-background" : "bg-white/10 text-accent"
                      }`}
                    >
                      <DumbbellIcon />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{gym.name}</span>
                      {gym.address && <span className="block truncate text-xs text-foreground/50">{gym.address}</span>}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-foreground/60">{formatDistance(gym.distanceM)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {search.kind === "manual" && (
        <p className="text-sm text-foreground/70">
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
            className="flex-1 rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-sm outline-none focus:border-accent"
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
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
