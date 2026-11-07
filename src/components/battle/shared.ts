import { useEffect, useState } from "react";
import type { LocationFix } from "@/app/battle/actions";

/**
 * The current time, ticking every second while `active`. Null until the
 * component mounts, so the server render and hydration agree; callers fall
 * back to a fixed time such as the session's last location check.
 */
export function useNow(active: boolean): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}

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

export const buttonClass = "gc-btn gc-btn-primary";
export const ghostButtonClass = "gc-btn gc-btn-sm";
