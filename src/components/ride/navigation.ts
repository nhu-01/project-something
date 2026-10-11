"use client";
import { useEffect, useRef, useState } from "react";
import { meters } from "./engine";
import type { Pos } from "./types";

// Turn-by-turn directions with Leaflet Routing Machine (an open-source routing client) against the public
// OpenStreetMap bike-routing server (no key), or Mapbox cycling directions when NEXT_PUBLIC_MAPBOX_TOKEN is set.
export type TurnKind = "straight" | "left" | "right" | "bearLeft" | "bearRight" | "sharpLeft" | "sharpRight" | "uturn" | "arrive";
export type NavStep = { kind: TurnKind; road: string; meters: number };
export type NavState = { coords: [number, number][]; step: NavStep | null; remainingM: number | null; failed: boolean };

const SERVICE = "https://routing.openstreetmap.de/routed-bike/route/v1";

const kindOf = (type: string): TurnKind => {
  if (/DestinationReached|WaypointReached/i.test(type)) return "arrive";
  if (/TurnAround|UTurn/i.test(type)) return "uturn";
  if (/SharpLeft/i.test(type)) return "sharpLeft";
  if (/SharpRight/i.test(type)) return "sharpRight";
  if (/SlightLeft/i.test(type)) return "bearLeft";
  if (/SlightRight/i.test(type)) return "bearRight";
  if (/Left/i.test(type)) return "left";
  if (/Right/i.test(type)) return "right";
  return "straight";
};

// the part of the plugin's route object we read (its own typings are loose)
type LrmRoute = { coordinates: { lat: number; lng: number }[]; instructions: { index: number; type: string | number; road?: string }[]; summary: { totalDistance: number } };

type Planned = { coords: [number, number][]; steps: { index: number; kind: TurnKind; road: string }[]; totalM: number };

async function plan(from: { lat: number; lng: number }, to: { lat: number; lng: number }): Promise<Planned | null> {
  // leaflet touches `window` when it loads, so it is only imported here, in the browser, when directions are needed
  const L = (await import("leaflet")).default;
  // the plugin looks for a global L when it loads
  (globalThis as { L?: typeof L }).L = L;
  await import("leaflet-routing-machine");
  const waypoints = [L.Routing.waypoint(L.latLng(from.lat, from.lng)), L.Routing.waypoint(L.latLng(to.lat, to.lng))];

  const ask = (router: { route: (w: typeof waypoints, cb: (...args: unknown[]) => void) => unknown }) =>
    new Promise<Planned | null>((resolve) => {
      router.route(waypoints, (...args: unknown[]) => {
        const [err, routes] = args as [unknown, LrmRoute[] | undefined];
        const r = !err && routes?.[0];
        if (!r) return resolve(null);
        resolve({
          coords: r.coordinates.map((c) => [c.lat, c.lng] as [number, number]),
          steps: r.instructions.map((i) => ({ index: i.index, kind: kindOf(String(i.type)), road: i.road || "" })),
          totalM: r.summary.totalDistance,
        });
      });
    });

  // Mapbox (cycling profile) when a public token is configured; the open OSRM server otherwise, or if Mapbox fails
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (token) {
    const viaMapbox = await ask(L.Routing.mapbox(token, { profile: "mapbox/cycling" }) as never);
    if (viaMapbox) return viaMapbox;
  }
  return ask(L.Routing.osrmv1({ serviceUrl: SERVICE, profile: "driving", timeout: 8000 }) as never);
}

// Follows the rider along a route to `target`: asks for directions when the target changes, asks again if they wander
// more than ~70 m off the line, and reports the next maneuver and how far away it is.
export function useNavigation(pos: Pos | null, target: { id: string; lat: number; lng: number } | null): NavState {
  const [planned, setPlanned] = useState<{ id: string; route: Planned | null } | null>(null);
  const posRef = useRef(pos);
  const busy = useRef(false);
  const lastAt = useRef(0);
  useEffect(() => { posRef.current = pos; }, [pos]);

  const tid = target?.id ?? null, tlat = target?.lat, tlng = target?.lng;
  const hasPos = pos != null;
  const route = planned && planned.id === tid ? planned.route : null;

  // how far from the planned line the rider is
  const offM = (() => {
    if (!pos || !route) return 0;
    let best = Infinity;
    for (const c of route.coords) best = Math.min(best, meters(pos, { lat: c[0], lng: c[1] }));
    return best;
  })();

  useEffect(() => {
    const p = posRef.current;
    if (!tid || tlat == null || tlng == null || !p || busy.current) return;
    const stale = !route || offM > 70;
    if (!stale || Date.now() - lastAt.current < 8000) return;
    busy.current = true; lastAt.current = Date.now();
    void plan(p, { lat: tlat, lng: tlng }).then((r) => setPlanned({ id: tid, route: r })).finally(() => { busy.current = false; });
  }, [tid, tlat, tlng, hasPos, route, offM]);

  if (!target || !pos || !route) return { coords: route?.coords ?? [], step: null, remainingM: null, failed: Boolean(planned && planned.id === tid && !planned.route) };

  // nearest point on the line, then the next maneuver after it
  let near = 0, nearD = Infinity;
  route.coords.forEach((c, i) => { const d = meters(pos, { lat: c[0], lng: c[1] }); if (d < nearD) { nearD = d; near = i; } });
  const along = (from: number, to: number) => {
    let sum = 0;
    for (let i = from; i < to; i++) sum += meters({ lat: route.coords[i][0], lng: route.coords[i][1] }, { lat: route.coords[i + 1][0], lng: route.coords[i + 1][1] });
    return sum;
  };
  const next = route.steps.find((s) => s.index > near) ?? route.steps[route.steps.length - 1];
  const stepM = next ? along(near, Math.max(near, Math.min(next.index, route.coords.length - 1))) : 0;
  return {
    coords: route.coords,
    step: next ? { kind: next.kind, road: next.road, meters: stepM } : null,
    remainingM: along(near, route.coords.length - 1),
    failed: false,
  };
}
