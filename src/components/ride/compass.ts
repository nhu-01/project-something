"use client";
import { useEffect, useState } from "react";

type IosOrientation = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };

// iOS only shows the compass permission prompt from a tap, so the ride's "start" button calls this.
export async function requestCompass() {
  const ctor = typeof DeviceOrientationEvent !== "undefined" ? (DeviceOrientationEvent as IosOrientation) : null;
  if (!ctor?.requestPermission) return true;
  try { return (await ctor.requestPermission()) === "granted"; } catch { return false; }
}

// Which way the phone is facing, in degrees clockwise from north; null until the device reports it.
// The arrow uses this so it keeps pointing the right way when you are stopped at the spot.
export function useCompass(active: boolean) {
  const [heading, setHeading] = useState<number | null>(null);
  useEffect(() => {
    if (!active) return;
    let last = 0;
    const on = (e: Event) => {
      const o = e as DeviceOrientationEvent & { webkitCompassHeading?: number };
      let h: number | null = null;
      if (typeof o.webkitCompassHeading === "number") h = o.webkitCompassHeading; // iOS: already clockwise from north
      else if (o.absolute && o.alpha != null) h = (360 - o.alpha) % 360; // Android: alpha counts the other way
      if (h == null || Number.isNaN(h)) return;
      const now = performance.now();
      if (now - last < 120) return; // plenty smooth, and cheap
      last = now; setHeading(h);
    };
    window.addEventListener("deviceorientationabsolute", on, true);
    window.addEventListener("deviceorientation", on, true);
    return () => { window.removeEventListener("deviceorientationabsolute", on, true); window.removeEventListener("deviceorientation", on, true); setHeading(null); };
  }, [active]);
  return heading;
}
