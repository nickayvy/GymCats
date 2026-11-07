import type { LocationFix } from "@/app/battle/actions";

export function getFix(): Promise<LocationFix> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("This browser can't share your location."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error("Location is blocked. Allow location for this site in your browser settings."));
        } else {
          reject(new Error("Couldn't get a location fix. Try again in a moment."));
        }
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 15_000 },
    );
  });
}

export const buttonClass =
  "rounded-xl bg-accent px-5 py-3 font-semibold text-background transition hover:bg-accent-glow disabled:cursor-not-allowed disabled:opacity-50";
export const ghostButtonClass =
  "rounded-xl border border-white/15 px-5 py-3 text-sm text-foreground/80 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50";
