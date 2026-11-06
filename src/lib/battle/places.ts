import { distanceMeters, GYM_RADIUS_M } from "@/lib/battle/rules";
import type { NearbyGym } from "@/lib/battle/state";
import { getGoogleMapsApiKey } from "@/lib/env";

// Server-only helpers for the Places API (New). Field masks stick to
// Pro-tier fields: asking for photos or reviews would bill every call at a
// higher tier.
const API = "https://places.googleapis.com/v1";
const GYM_TYPES = ["gym", "fitness_center"];
// Google allows at most 20 results per call.
const MAX_RESULTS = 20;
const PLACE_ID_PATTERN = /^[A-Za-z0-9_-]{1,300}$/;

interface ApiPlace {
  id?: string;
  displayName?: { text: string };
  shortFormattedAddress?: string;
  location?: { latitude: number; longitude: number };
  types?: string[];
}

/** Same slack as check-ins: the gym radius plus up to 100 m of GPS accuracy. */
export function searchRadius(accuracy: number): number {
  return GYM_RADIUS_M + Math.min(Math.max(accuracy, 0), 100);
}

export type GymSearchResult =
  | { status: "ok"; gyms: NearbyGym[] }
  | { status: "not_configured" }
  | { status: "error" };

async function callPlaces(path: string, fieldMask: string, body?: unknown): Promise<unknown | null> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) throw new Error("not_configured");
  try {
    const res = await fetch(`${API}/${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`Places ${path} failed`, res.status, await res.text().catch(() => ""));
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error(`Places ${path} failed`, error);
    return null;
  }
}

/**
 * Gyms within the check-in radius of a point, nearest first. With a query
 * (e.g. "24 Hour Fitness"), searches by name, which finds gyms that the
 * plain nearby search's 20-result cap would miss in busy areas.
 */
export async function searchGyms(
  lat: number,
  lng: number,
  accuracy: number,
  query?: string,
): Promise<GymSearchResult> {
  if (!getGoogleMapsApiKey()) return { status: "not_configured" };

  const radius = searchRadius(accuracy);
  const circle = { center: { latitude: lat, longitude: lng }, radius };
  const fields = "places.id,places.displayName,places.shortFormattedAddress,places.location";
  const text = query?.trim().slice(0, 100);

  const body = text
    ? await callPlaces("places:searchText", fields, {
        textQuery: text,
        includedType: "gym",
        strictTypeFiltering: true,
        pageSize: MAX_RESULTS,
        rankPreference: "DISTANCE",
        // Text search only biases to a circle, so results are filtered below.
        locationBias: { circle },
      })
    : await callPlaces("places:searchNearby", fields, {
        includedTypes: GYM_TYPES,
        maxResultCount: MAX_RESULTS,
        rankPreference: "DISTANCE",
        locationRestriction: { circle },
      });
  if (body === null) return { status: "error" };

  const gyms = ((body as { places?: ApiPlace[] }).places ?? [])
    .flatMap((p): NearbyGym[] => {
      if (!p.id || !p.displayName?.text || !p.location) return [];
      const { latitude, longitude } = p.location;
      return [
        {
          placeId: p.id,
          name: p.displayName.text.slice(0, 60),
          address: p.shortFormattedAddress ?? null,
          lat: latitude,
          lng: longitude,
          distanceM: Math.round(distanceMeters(lat, lng, latitude, longitude)),
        },
      ];
    })
    .filter((g) => g.distanceM <= radius)
    .sort((a, b) => a.distanceM - b.distanceM);

  return { status: "ok", gyms };
}

export type GymLookup =
  | { status: "ok"; gym: { placeId: string; name: string; lat: number; lng: number; isGym: boolean } }
  | { status: "not_found" }
  | { status: "not_configured" }
  | { status: "error" };

/** Looks a place up by ID, to check what the client says it picked. */
export async function getGymPlace(placeId: string): Promise<GymLookup> {
  if (!getGoogleMapsApiKey()) return { status: "not_configured" };
  if (!PLACE_ID_PATTERN.test(placeId)) return { status: "not_found" };

  const body = (await callPlaces(`places/${placeId}`, "id,displayName,location,types")) as ApiPlace | null;
  if (body === null) return { status: "error" };
  if (!body.id || !body.location) return { status: "not_found" };

  return {
    status: "ok",
    gym: {
      placeId: body.id,
      name: body.displayName?.text ?? "",
      lat: body.location.latitude,
      lng: body.location.longitude,
      isGym: (body.types ?? []).some((t) => GYM_TYPES.includes(t)),
    },
  };
}
