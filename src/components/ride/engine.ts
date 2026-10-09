"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import type { GpsState, Hazard, RideEvent, Sev, Upcoming } from "./types";

type Known = { id: string; lat: number; lng: number; street: string; lane: string; severity: number; kind?: string };
type Pos = { lat: number; lng: number; heading: number | null; accuracy: number | null };
type ServerEvent = { kind: RideEvent["kind"]; potholeId: string; hazard?: string; street: string; lane: string; severity: number | null };
const toHazard = (s?: string): Hazard => (s === "bump" || s === "rough" ? s : "pothole");

const WARN_M = 55; // start warning about a known pothole this far out (~180 ft)
const PASS_M = 20; // closer than this counts as having reached it
const FRAME_MS = 700; // pause between frames; each frame also waits for the server's answer
const FT = 3.28084;

const rad = (d: number) => (d * Math.PI) / 180;
function meters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}
function bearing(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
const angleDiff = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);
const toSev = (n: number | null): Sev | null => (n == null ? null : (Math.min(5, Math.max(1, Math.round(n))) as Sev));

function deviceId() {
  try {
    let id = localStorage.getItem("spotholes-device");
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("spotholes-device", id); }
    return id;
  } catch { return crypto.randomUUID(); }
}

// The detector expects a 640x640 letterboxed frame.
function grabFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement): Promise<Blob | null> {
  const vw = video.videoWidth, vh = video.videoHeight;
  if (!vw || !vh) return Promise.resolve(null);
  canvas.width = 640; canvas.height = 640;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  const s = Math.min(640 / vw, 640 / vh), w = vw * s, h = vh * s;
  ctx.fillStyle = "#727272"; ctx.fillRect(0, 0, 640, 640);
  ctx.drawImage(video, (640 - w) / 2, (640 - h) / 2, w, h);
  return new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.6));
}

type Opts = {
  active: boolean;
  paused: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  onAhead: (u: Upcoming) => void;
  onResult: (e: RideEvent) => void;
  onHint: (hint: "screen") => void;
};

// Runs a ride: tracks GPS, warns about saved potholes ahead, and sends camera frames to the server,
// which detects new potholes and compares known ones with what earlier riders saw.
export function useRideEngine({ active, paused, videoRef, onAhead, onResult, onHint }: Opts) {
  const [upcoming, setUpcoming] = useState<Upcoming | null>(null);
  const [distance, setDistance] = useState(0);
  const [gps, setGps] = useState<GpsState>("waiting");
  const [online, setOnline] = useState(true);
  const [meters_, setMeters] = useState(0); // distance covered this ride, from the GPS breadcrumbs
  const live = useRef({ paused, onAhead, onResult, onHint });
  useEffect(() => { live.current = { paused, onAhead, onResult, onHint }; }, [paused, onAhead, onResult, onHint]);

  useEffect(() => {
    if (!active) return;
    let stopped = false;
    let ride: { rideId: string; token: string } | null = null;
    let pos: Pos | null = null;
    let prevFix: { lat: number; lng: number } | null = null;
    let lastFetch: { at: number; lat: number; lng: number } | null = null;
    let lastFrame: Blob | null = null;
    let current: { id: string; minD: number } | null = null;
    let lastHint = 0;
    let crumbs: { lat: number; lng: number; t: number }[] = [];
    let lastCrumb: { lat: number; lng: number } | null = null;
    const known = new Map<string, Known>();
    const warned = new Set<string>();
    const resolved = new Set<string>(); // potholes that already got a result on this ride
    const canvas = document.createElement("canvas");

    const emit = (e: ServerEvent | null | undefined) => {
      if (!e || stopped) return;
      resolved.add(e.potholeId); warned.add(e.potholeId);
      if (e.kind === "repaired") known.delete(e.potholeId);
      live.current.onResult({ id: `${e.potholeId}-${e.kind}`, kind: e.kind, hazard: toHazard(e.hazard), street: e.street, lane: e.lane, severity: toSev(e.severity), at: Date.now() });
    };

    const send = async (path: "/api/scan" | "/api/pass", frame: Blob, extra: Record<string, string> = {}) => {
      if (!ride || !pos) return null;
      const form = new FormData();
      form.append("rideId", ride.rideId); form.append("token", ride.token);
      form.append("lat", String(pos.lat)); form.append("lng", String(pos.lng));
      if (pos.heading != null) form.append("heading", String(pos.heading));
      if (pos.accuracy != null) form.append("accuracy", String(pos.accuracy));
      for (const [k, v] of Object.entries(extra)) form.append(k, v);
      form.append("frame", frame, "frame.jpg");
      try {
        const res = await fetch(path, { method: "POST", body: form });
        setOnline(res.ok);
        if (!res.ok) return null;
        const body = (await res.json()) as { event: ServerEvent | null; hint?: "screen" };
        // don't nag: at most one hint every 20 seconds
        if (body.hint && !stopped && Date.now() - lastHint > 20000) { lastHint = Date.now(); live.current.onHint(body.hint); }
        return body.event;
      } catch { setOnline(false); return null; }
    };

    const refreshNearby = async () => {
      if (!pos) return;
      lastFetch = { at: Date.now(), lat: pos.lat, lng: pos.lng };
      try {
        const res = await fetch(`/api/nearby?lat=${pos.lat}&lng=${pos.lng}`);
        if (!res.ok) return;
        for (const k of (await res.json()) as Known[]) if (!resolved.has(k.id)) known.set(k.id, k);
      } catch { /* offline: keep what we have */ }
    };

    // 1. start the ride
    fetch("/api/rides", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ deviceId: deviceId() }) })
      .then((r) => (r.ok ? r.json() : null)).then((j) => { if (j && !stopped) ride = j; else if (!j) setOnline(false); }).catch(() => setOnline(false));

    // 2. follow the rider
    const watch = navigator.geolocation?.watchPosition(
      (p) => {
        const here = { lat: p.coords.latitude, lng: p.coords.longitude };
        let heading = p.coords.heading != null && !Number.isNaN(p.coords.heading) && (p.coords.speed ?? 0) > 0.5 ? p.coords.heading : pos?.heading ?? null;
        if (prevFix && meters(prevFix, here) > 4) { heading = bearing(prevFix, here); prevFix = here; }
        if (!prevFix) prevFix = here;
        pos = { ...here, heading, accuracy: p.coords.accuracy ?? null };
        // breadcrumb for the ridden-streets map: only decent fixes, only when we've actually moved
        if ((p.coords.accuracy ?? 99) <= 50 && (!lastCrumb || meters(lastCrumb, here) > 6)) {
          if (lastCrumb) { const step = meters(lastCrumb, here); if (step < 120) setMeters((m) => m + step); }
          lastCrumb = here; crumbs.push({ ...here, t: Date.now() });
        }
        setGps("ok");
      },
      (err) => { if (err.code === err.PERMISSION_DENIED) setGps("denied"); },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },
    );
    if (watch == null) setGps("denied");

    const flushCrumbs = (keepalive = false) => {
      if (!ride || !crumbs.length) return;
      const points = crumbs.splice(0, 80);
      void fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ rideId: ride.rideId, token: ride.token, points }), keepalive })
        .then((r) => { if (!r.ok) crumbs = [...points, ...crumbs].slice(-400); })
        .catch(() => { crumbs = [...points, ...crumbs].slice(-400); }); // offline: keep them for the next try
    };
    const crumbTimer = setInterval(() => flushCrumbs(), 8000);

    // 3. warn about saved potholes ahead, and settle each one as the rider passes it
    const tick = setInterval(() => {
      if (stopped || live.current.paused || !pos) return;
      if (!lastFetch || Date.now() - lastFetch.at > 30000 || meters(lastFetch, pos) > 150) void refreshNearby();

      if (current) {
        const k = known.get(current.id);
        const d = k ? meters(pos, k) : Infinity;
        if (k && d < current.minD) current.minD = d;
        const passed = !k || d > current.minD + 8 || d > WARN_M + 30;
        if (!passed) { setDistance(Math.max(0, Math.round((d * FT) / 5) * 5)); return; }
        const done = current;
        current = null; setUpcoming(null);
        // reached it but the camera never confirmed it: ask the server to judge the latest frame
        if (k && done.minD < PASS_M && !resolved.has(done.id) && lastFrame) void send("/api/pass", lastFrame, { potholeId: done.id }).then(emit);
        return;
      }

      let best: { k: Known; d: number } | null = null;
      for (const k of known.values()) {
        if (warned.has(k.id)) continue;
        const d = meters(pos, k);
        const ahead = pos.heading == null || angleDiff(bearing(pos, k), pos.heading) < 45 || d < 12;
        if (d <= WARN_M && ahead && (!best || d < best.d)) best = { k, d };
      }
      if (best) {
        warned.add(best.k.id);
        current = { id: best.k.id, minD: best.d };
        const u: Upcoming = { id: best.k.id, hazard: toHazard(best.k.kind), street: best.k.street, lane: best.k.lane, severity: toSev(best.k.severity) ?? 2, startFt: Math.max(10, Math.round(best.d * FT)) };
        setUpcoming(u); setDistance(u.startFt); live.current.onAhead(u);
      }
    }, 400);

    // 4. send camera frames one at a time
    (async () => {
      while (!stopped) {
        const video = videoRef.current;
        if (!live.current.paused && ride && pos && video) {
          const frame = await grabFrame(video, canvas);
          if (frame) { lastFrame = frame; emit(await send("/api/scan", frame)); }
        }
        await new Promise((r) => setTimeout(r, FRAME_MS));
      }
    })();

    return () => {
      stopped = true;
      clearInterval(tick);
      clearInterval(crumbTimer);
      flushCrumbs(true);
      if (watch != null) navigator.geolocation.clearWatch(watch);
      setUpcoming(null); setGps("waiting"); setMeters(0);
      if (ride) void fetch(`/api/rides/${ride.rideId}/end`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: ride.token }), keepalive: true }).catch(() => {});
    };
  }, [active, videoRef]);

  return { upcoming, distance, gps, online, meters: meters_ };
}
